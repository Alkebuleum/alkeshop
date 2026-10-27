// Every change to AlkeShop's data happens here, on behalf of a signed-in
// wallet. Clients can only read (see firestore.rules); these operations check
// who is asking, validate what they send and move orders through their states:
//
//   product: awaiting_payment → confirming → delivered (→ refunded)
//            or failed (payment.failure: expired, declined, failed, underpaid)
//   service: requested → awaiting_payment → confirming → active → delivered → completed
//            or cancelled (declined / not paid in time), disputed → refunded | completed
const {
  lc, cfg, PRICE_HOLD_MS, SERVICE_PAY_WINDOW_MS, REVIEW_WINDOW_MS, PRODUCT_REFUND_MS, DROPPED_AFTER_MS,
  DOWNLOAD_URL_MS, PRODUCT_CATEGORIES, SERVICE_CATEGORIES, LICENSES,
} = require("./config");
const { checkPayment } = require("./payments");
const { TEMPLATES, sendEmail } = require("./email");

class ShopError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new ShopError(code, message); };

/* ---------------- Validation ---------------- */

function str(v, name, { min = 0, max }) {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : fail("invalid-argument", `${name} must be text.`);
  if (s.length < min) fail("invalid-argument", min === 1 ? `${name} is required.` : `${name} is too short.`);
  if (s.length > max) fail("invalid-argument", `${name} is too long (${max} characters at most).`);
  return s;
}
function int(v, name, { min, max }) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) fail("invalid-argument", `${name} must be a whole number from ${min} to ${max}.`);
  return n;
}
function price(v) {
  const n = Number(v);
  if (!(n > 0 && n <= 1e9)) fail("invalid-argument", "Price must be more than 0 ALKE.");
  return Math.round(n * 1000) / 1000;
}
const oneOf = (v, list, name) => (list.includes(v) ? v : fail("invalid-argument", `Unknown ${name}.`));
const strList = (v, name, { maxItems, max }) => {
  if (v == null) return [];
  if (!Array.isArray(v) || v.length > maxItems) fail("invalid-argument", `Too many ${name}.`);
  return v.map((x) => str(x, name, { min: 1, max }));
};

const UPLOAD_PATH = /^uploads\/(0x[0-9a-f]{40})\/[A-Za-z0-9_-]{6,40}\/[^/]{1,200}$/;
// Files someone attaches must be ones they uploaded themselves.
function fileList(v, wallet, { maxItems }) {
  if (v == null) return [];
  if (!Array.isArray(v) || v.length > maxItems) fail("invalid-argument", "Too many files.");
  return v.map((f) => {
    const m = UPLOAD_PATH.exec(f?.path || "");
    if (!m || m[1] !== wallet) fail("invalid-argument", "A file wasn't uploaded from this wallet.");
    return { name: str(f.name, "File name", { min: 1, max: 200 }), size: int(f.size, "File size", { min: 0, max: 2 ** 40 }), path: f.path };
  });
}

/* ---------------- Helpers ---------------- */

const firstName = (name) => String(name || "").split(" ")[0];
const sellerShare = (amount) => Math.round(amount * (10000 - cfg().feeBps)) / 10000;
const randomId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function roleIn(order, wallet) {
  if (order.buyer === wallet) return "buyer";
  if (order.sellerId === wallet) return "seller";
  return null;
}

async function nextOrderId(tx, db) {
  const ref = db.doc("counters/orders");
  const snap = await tx.get(ref);
  const seq = (snap.exists ? snap.data().seq : 10500) + 1;
  tx.set(ref, { seq });
  return `AS-${seq}`;
}

// Messages sort by `at`; several written in one action must keep their order.
let lastAt = 0;
const stamp = () => (lastAt = Math.max(Date.now(), lastAt + 1));

function say(tx, db, orderId, from, text, extra = {}) {
  tx.set(db.collection(`orders/${orderId}/messages`).doc(), { from, text, at: stamp(), ...extra });
}

function audit(tx, db, ctx, text) {
  tx.set(db.collection("audit").doc(), { at: Date.now(), who: ctx.staff || ctx.wallet, wallet: ctx.wallet || "", text });
}

async function getOrder(tx, db, orderId) {
  const ref = db.doc(`orders/${str(orderId, "Order", { min: 1, max: 40 })}`);
  const snap = await tx.get(ref);
  if (!snap.exists) fail("not-found", "That order doesn't exist.");
  return { ref, order: snap.data() };
}

// Seller money: available = finished sales not yet paid out; pending = paid but
// still in progress, or a product inside its refund window.
function earnings(orders, payouts, now = Date.now()) {
  const done = orders.filter((o) => o.status === "completed" || (o.kind === "product" && o.status === "delivered" && now - o.paidAt > PRODUCT_REFUND_MS));
  const pending = orders.filter((o) => (["active", "delivered"].includes(o.status)) && !done.includes(o));
  const paidOut = payouts.reduce((t, p) => t + p.amount, 0);
  const sum = (xs) => xs.reduce((t, o) => t + sellerShare(o.amount), 0);
  return { available: Math.max(0, Math.round((sum(done) - paidOut) * 1000) / 1000), pending: sum(pending), paidOut };
}

/* ---------------- Selling ---------------- */

async function applySeller(ctx, p) {
  const { db, wallet } = ctx;
  const profile = {
    id: wallet,
    payout: wallet,
    name: str(p.name, "Seller name", { min: 2, max: 60 }),
    type: oneOf(p.type, ["Individual", "Business"], "account type"),
    country: str(p.country, "Country", { min: 1, max: 40 }),
    bio: str(p.bio, "Description", { min: 10, max: 600 }),
    portfolio: str(p.portfolio, "Portfolio link", { max: 200 }),
    sells: (Array.isArray(p.sells) ? p.sells : []).filter((x) => ["products", "services"].includes(x)),
    langs: str(p.langs, "Languages", { max: 80 }),
    tags: strList(p.tags, "tags", { maxItems: 6, max: 30 }),
    status: "review",
    appliedAt: Date.now(),
  };
  if (!profile.sells.length) fail("invalid-argument", "Choose what you want to sell.");
  if (profile.portfolio && !/^https?:\/\//i.test(profile.portfolio)) fail("invalid-argument", "The portfolio link must start with https://");
  const email = str(p.email, "Email", { min: 3, max: 120 });
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("invalid-argument", "Enter a valid email address.");

  await db.runTransaction(async (tx) => {
    const ref = db.doc(`sellers/${wallet}`);
    const cur = await tx.get(ref);
    if (cur.exists && cur.data().status !== "rejected") fail("already-exists", "This wallet has already applied.");
    tx.set(ref, profile);
    tx.set(db.doc(`sellerContacts/${wallet}`), { email });
    audit(tx, db, { wallet: "", staff: "System" }, `Seller application from ${profile.name}`);
  });
  return { ok: true };
}

async function saveListing(ctx, l) {
  const { db, wallet, bucket } = ctx;
  const status = oneOf(l.status, ["draft", "review"], "status");
  const strict = status === "review";
  const kind = oneOf(l.kind, ["product", "service"], "listing type");
  const min = (n) => (strict ? n : 0);

  let fields;
  if (kind === "product") {
    const files = fileList(l.files, wallet, { maxItems: 20 });
    if (strict && !files.length) fail("invalid-argument", "Add at least one file buyers receive.");
    fields = {
      title: str(l.title, "Title", { min: min(4), max: 100 }),
      category: oneOf(l.category, PRODUCT_CATEGORIES, "category"),
      about: str(l.about, "Description", { min: min(20), max: 3000 }),
      bullets: strList(l.bullets, "highlights", { maxItems: 8, max: 160 }),
      files,
      formats: [...new Set(files.map((f) => (f.name.split(".").pop() || "").toUpperCase().slice(0, 6)).filter(Boolean))],
      version: str(l.version, "Version", { max: 20 }),
      license: oneOf(l.license, LICENSES, "license"),
      price: strict || l.price ? price(l.price) : 0,
    };
  } else {
    const needs = Array.isArray(l.needs) ? l.needs : [];
    if (needs.length > 10) fail("invalid-argument", "Ask at most 10 questions.");
    fields = {
      title: str(l.title, "Title", { min: min(6), max: 120 }),
      category: oneOf(l.category, SERVICE_CATEGORIES, "category"),
      sub: str(l.sub, "Subcategory", { max: 60 }),
      scope: str(l.scope, "Scope of work", { min: min(20), max: 3000 }),
      price: strict || l.price ? price(l.price) : 0,
      days: int(l.days ?? 1, "Delivery days", { min: 1, max: 90 }),
      revisions: int(l.revisions ?? 0, "Revisions", { min: 0, max: 10 }),
      deliverables: strList(l.deliverables, "deliverables", { maxItems: 12, max: 160 }),
      needs: needs.map((n) => ({ q: str(n?.q, "Question", { min: 1, max: 200 }), type: oneOf(n?.type, ["text", "file"], "question type"), optional: !!n?.optional })),
      cancellation: str(l.cancellation, "Cancellation policy", { max: 300 }),
      available: l.available !== false,
      maxActive: int(l.maxActive ?? 3, "Most active orders", { min: 1, max: 50 }),
      packageName: str(l.packageName || "Standard package", "Package name", { max: 60 }),
    };
    if (strict && !fields.deliverables.length) fail("invalid-argument", "Add at least one deliverable.");
  }

  // Product files must really be in storage; their stored size is what counts.
  if (kind === "product" && strict && bucket) {
    fields.files = await Promise.all(fields.files.map(async (f) => {
      const [meta] = await bucket.file(f.path).getMetadata().catch(() => [null]);
      if (!meta) fail("invalid-argument", `${f.name} didn't finish uploading. Remove it and add it again.`);
      return { ...f, size: Number(meta.size) };
    }));
  }

  return db.runTransaction(async (tx) => {
    const seller = await tx.get(db.doc(`sellers/${wallet}`));
    if (!seller.exists || seller.data().status !== "approved") fail("permission-denied", "Only approved sellers can list.");
    const id = l.id ? str(l.id, "Listing", { min: 1, max: 60 }) : `${kind}-${randomId()}`;
    const ref = db.doc(`listings/${id}`);
    const cur = await tx.get(ref);
    if (cur.exists && (cur.data().sellerId !== wallet || cur.data().kind !== kind)) fail("permission-denied", "That isn't your listing.");
    const now = Date.now();
    tx.set(ref, {
      ...fields, id, kind, status, sellerId: wallet, sellerName: seller.data().name,
      createdAt: cur.exists ? cur.data().createdAt : now, updatedAt: now, reviewNote: "",
    });
    if (strict) audit(tx, db, { wallet: "", staff: "System" }, `Listing submitted for review: ${fields.title}`);
    return { id };
  });
}

/* ---------------- Buying ---------------- */

async function liveListing(tx, db, listingId, kind, buyer) {
  const snap = await tx.get(db.doc(`listings/${str(listingId, "Listing", { min: 1, max: 60 })}`));
  const l = snap.data();
  if (!snap.exists || l.status !== "live" || l.kind !== kind) fail("not-found", "This listing isn't available.");
  if (l.sellerId === buyer) fail("failed-precondition", "You can't buy your own listing.");
  return l;
}

async function checkout(ctx, { listingId }) {
  const { db, wallet } = ctx;
  if (!cfg().treasury) fail("failed-precondition", "Payments are switched off for now.");
  return db.runTransaction(async (tx) => {
    const l = await liveListing(tx, db, listingId, "product", wallet);
    const id = await nextOrderId(tx, db);
    const now = Date.now();
    tx.set(db.doc(`orders/${id}`), {
      id, kind: "product", buyer: wallet, createdAt: now, status: "awaiting_payment", holdUntil: now + PRICE_HOLD_MS,
      itemId: l.id, title: l.title, sellerId: l.sellerId, sellerName: l.sellerName,
      amount: l.price, license: l.license, version: l.version || "",
      size: (l.files || []).reduce((t, f) => t + f.size, 0), files: l.files || [], payment: {},
    });
    return { orderId: id };
  });
}

async function requestService(ctx, { listingId, answers }) {
  const { db, wallet } = ctx;
  if (!cfg().treasury) fail("failed-precondition", "Payments are switched off for now.");
  return db.runTransaction(async (tx) => {
    const l = await liveListing(tx, db, listingId, "service", wallet);
    if (l.available === false) fail("failed-precondition", "This seller isn't taking new orders.");
    const given = Array.isArray(answers) ? answers : [];
    const clean = l.needs.map((n, i) => {
      const a = given[i] || {};
      const out = { q: n.q, a: str(a.a, "Answer", { max: 2000 }), files: fileList(a.files, wallet, { maxItems: 10 }) };
      if (!n.optional && (n.type === "file" ? !out.files.length : !out.a)) fail("invalid-argument", `Answer: ${n.q}`);
      return out;
    });
    const id = await nextOrderId(tx, db);
    tx.set(db.doc(`orders/${id}`), {
      id, kind: "service", buyer: wallet, createdAt: Date.now(), status: "requested",
      itemId: l.id, title: l.title.replace(/^I will /, "").replace(/^./, (c) => c.toUpperCase()),
      sellerId: l.sellerId, sellerName: l.sellerName, amount: l.price, days: l.days, revisionsLeft: l.revisions,
      answers: clean, payment: {},
    });
    say(tx, db, id, "buyer", clean.map((a) => `${a.q}: ${a.a || "(skipped)"}`).join("\n"), { files: clean.flatMap((a) => a.files) });
    say(tx, db, id, "system", `Request sent. ${firstName(l.sellerName)} will accept or decline. Nothing has been charged.`);
    return { orderId: id };
  });
}

async function submitPayment(ctx, { orderId, txHash, payer }) {
  const { db, wallet } = ctx;
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash || "")) fail("invalid-argument", "That isn't a transaction hash.");
  const hash = lc(txHash);
  await db.runTransaction(async (tx) => {
    const { ref, order } = await getOrder(tx, db, orderId);
    if (order.buyer !== wallet) fail("permission-denied", "That isn't your order.");
    if (order.status !== "awaiting_payment") fail("failed-precondition", "This order isn't waiting for payment.");
    const used = db.doc(`payments/${hash}`);
    if ((await tx.get(used)).exists) fail("already-exists", "That payment was already used for an order.");
    tx.set(used, { orderId: order.id, at: Date.now() });
    tx.update(ref, { status: "confirming", payment: { txHash: hash, payer: lc(payer) || wallet, submittedAt: Date.now(), stage: "sent" } });
  });
  return { ok: true };
}

// The buyer said no in their wallet. A service stays open to pay later.
async function paymentDeclined(ctx, { orderId }) {
  const { db, wallet } = ctx;
  await db.runTransaction(async (tx) => {
    const { ref, order } = await getOrder(tx, db, orderId);
    if (order.buyer !== wallet || order.status !== "awaiting_payment") return;
    const payment = { ...order.payment, failure: "declined", failedAt: Date.now() };
    tx.update(ref, order.kind === "service" ? { payment } : { payment, status: "failed" });
  });
  return { ok: true };
}

// Applies one chain check to a confirming order (from the site or the tick).
async function settlePayment(db, orderId, { rpc, now = Date.now() }) {
  const snap = await db.doc(`orders/${orderId}`).get();
  const order = snap.data();
  if (!snap.exists || order.status !== "confirming") return order?.status;
  const { treasury, minConfs } = cfg();
  const r = await checkPayment(order, { rpc, treasury, minConfs, now, droppedAfterMs: DROPPED_AFTER_MS });

  return db.runTransaction(async (tx) => {
    const { ref, order: o } = await getOrder(tx, db, orderId);
    if (o.status !== "confirming") return o.status;
    const t = Date.now();
    if (r.stage === "confirmed") {
      const update = { paidAt: t, payment: { ...o.payment, stage: "confirmed", blockNumber: r.blockNumber, verified: r.verified, how: r.how, failure: null } };
      if (o.kind === "product") update.status = "delivered";
      if (o.kind === "service") {
        Object.assign(update, { status: "active", dueAt: t + o.days * 86400000 });
        say(tx, db, o.id, "system", `Payment confirmed. ${firstName(o.sellerName)} has been told to start.`);
      }
      tx.update(ref, update);
      return update.status;
    }
    if (r.stage === "failed" || r.stage === "underpaid") {
      const payment = { ...o.payment, failure: r.stage === "underpaid" ? "underpaid" : "failed", reason: r.reason || null, received: r.received ?? null, failedAt: t };
      const status = o.kind === "service" && r.stage === "failed" ? "awaiting_payment" : "failed";
      tx.update(ref, { status, payment });
      if (r.stage === "underpaid") audit(tx, db, { wallet: "", staff: "System" }, `Underpayment on ${o.id}: received ${r.received} of ${o.amount} ALKE`);
      return status;
    }
    if (o.payment.stage !== r.stage || o.payment.confirmations !== r.confirmations) {
      tx.update(ref, { payment: { ...o.payment, stage: r.stage, confirmations: r.confirmations ?? null } });
    }
    return o.status;
  });
}

async function checkPaymentOp(ctx, { orderId }) {
  const { db, wallet, admin } = ctx;
  const snap = await db.doc(`orders/${str(orderId, "Order", { min: 1, max: 40 })}`).get();
  if (!snap.exists) fail("not-found", "That order doesn't exist.");
  if (!admin && !roleIn(snap.data(), wallet)) fail("permission-denied", "That isn't your order.");
  return { status: await settlePayment(db, orderId, ctx) };
}

/* ---------------- Order conversation ---------------- */

async function orderAction(ctx, { orderId, action, text, files }) {
  const { db, wallet } = ctx;
  await db.runTransaction(async (tx) => {
    const { ref, order: o } = await getOrder(tx, db, orderId);
    const role = roleIn(o, wallet);
    if (!role) fail("permission-denied", "Only the buyer and the seller can act on this order.");
    const need = (r, statuses) => {
      if (role !== r) fail("permission-denied", "That's not yours to do on this order.");
      if (!statuses.includes(o.status)) fail("failed-precondition", "This order has moved on. Refresh and try again.");
    };
    const t = Date.now();
    switch (action) {
      case "message": {
        if (["completed", "cancelled", "refunded", "failed"].includes(o.status)) fail("failed-precondition", "This order is closed.");
        const body = str(text, "Message", { max: 4000 });
        const attached = fileList(files, wallet, { maxItems: 10 });
        if (!body && !attached.length) fail("invalid-argument", "Write a message or attach a file.");
        say(tx, db, o.id, role, body, { files: attached });
        break;
      }
      case "accept":
        need("seller", ["requested"]);
        tx.update(ref, { status: "awaiting_payment", payBy: t + SERVICE_PAY_WINDOW_MS });
        say(tx, db, o.id, "system", `${firstName(o.sellerName)} accepted your request. Pay within 18 hours to start.`);
        break;
      case "decline":
        need("seller", ["requested"]);
        tx.update(ref, { status: "cancelled", closedReason: "Seller declined" });
        say(tx, db, o.id, "system", `${firstName(o.sellerName)} declined this request. Nothing was charged.`);
        break;
      case "deliver": {
        need("seller", ["active"]);
        const n = (o.deliveries || 0) + 1;
        tx.update(ref, { status: "delivered", deliveredAt: t, deliveries: n });
        say(tx, db, o.id, "seller", str(text, "Delivery note", { min: 1, max: 4000 }), { delivery: n, files: fileList(files, wallet, { maxItems: 20 }) });
        break;
      }
      case "acceptDelivery":
        need("buyer", ["delivered"]);
        tx.update(ref, { status: "completed", completedAt: t });
        say(tx, db, o.id, "system", "You accepted the delivery. The order is complete.");
        break;
      case "revision": {
        need("buyer", ["delivered"]);
        if (!(o.revisionsLeft > 0)) fail("failed-precondition", "No revisions left on this order.");
        const left = o.revisionsLeft - 1;
        tx.update(ref, { status: "active", revisionsLeft: left, revisionAt: t });
        say(tx, db, o.id, "buyer", str(text, "Revision request", { max: 4000 }) || "Please revise the delivery.");
        say(tx, db, o.id, "system", `Revision requested. ${left} left.`);
        break;
      }
      case "dispute": {
        need("buyer", ["active", "delivered"]);
        const reason = str(text, "What went wrong", { min: 1, max: 2000 });
        tx.update(ref, { status: "disputed", disputedAt: t, dispute: reason });
        say(tx, db, o.id, "system", "Dispute opened. AlkeShop support will review the conversation and files and reply here.");
        audit(tx, db, { wallet: "", staff: "System" }, `Dispute opened on ${o.id}: ${reason}`);
        break;
      }
      default:
        fail("invalid-argument", "Unknown action.");
    }
  });
  return { ok: true };
}

/* ---------------- Files ---------------- */

// A short-lived download link, for people allowed to see that file.
async function fileUrl(ctx, { path, orderId, listingId }) {
  const { db, wallet, admin, bucket } = ctx;
  const p = str(path, "File", { min: 1, max: 400 });
  let allowed = admin;
  if (!allowed && orderId) {
    const snap = await db.doc(`orders/${str(orderId, "Order", { min: 1, max: 40 })}`).get();
    const o = snap.data();
    if (snap.exists && roleIn(o, wallet)) {
      if (o.kind === "product") allowed = (o.status === "delivered" || o.sellerId === wallet) && (o.files || []).some((f) => f.path === p);
      else {
        const msgs = await db.collection(`orders/${o.id}/messages`).get();
        allowed = msgs.docs.some((m) => (m.data().files || []).some((f) => f.path === p));
      }
    }
  }
  if (!allowed && listingId) {
    const snap = await db.doc(`listings/${str(listingId, "Listing", { min: 1, max: 60 })}`).get();
    allowed = snap.exists && snap.data().sellerId === wallet && (snap.data().files || []).some((f) => f.path === p);
  }
  if (!allowed) fail("permission-denied", "You don't have access to that file.");
  const name = p.split("/").pop();
  const [url] = await bucket.file(p).getSignedUrl({
    action: "read", expires: Date.now() + DOWNLOAD_URL_MS,
    responseDisposition: `attachment; filename="${name.replace(/"/g, "")}"`,
  });
  return { url };
}

/* ---------------- Email ---------------- */

// Emails a seller at the address from their application. Never fails the
// caller: the decision is already saved and shows on the site either way.
async function notifySeller(ctx, { sellerId, template, data }) {
  try {
    const to = (await ctx.db.doc(`sellerContacts/${sellerId}`).get()).data()?.email;
    if (!to) return;
    await (ctx.sendEmail || sendEmail)({ to, ...TEMPLATES[template](data) });
  } catch (e) {
    console.warn(`email ${template} to seller ${sellerId} failed:`, e.message);
  }
}

/* ---------------- Administration ---------------- */

async function adminOp(ctx, { action, ...a }) {
  const { db } = ctx;
  if (!ctx.admin) fail("permission-denied", "Staff only.");
  ctx = { ...ctx, staff: str(a.staff, "Staff name", { max: 60 }) || ctx.wallet };

  if (action === "payout") {
    const sellerId = lc(a.sellerId);
    const [orders, payouts] = await Promise.all([
      db.collection("orders").where("sellerId", "==", sellerId).get(),
      db.collection("payouts").where("sellerId", "==", sellerId).get(),
    ]);
    const { available } = earnings(orders.docs.map((d) => d.data()), payouts.docs.map((d) => d.data()));
    if (!(available > 0)) fail("failed-precondition", "Nothing is ready to pay out to this seller.");
    await db.runTransaction(async (tx) => {
      const seller = await tx.get(db.doc(`sellers/${sellerId}`));
      tx.set(db.collection("payouts").doc(), { sellerId, amount: available, at: Date.now(), by: ctx.wallet, to: seller.data()?.payout || sellerId });
      audit(tx, db, ctx, `recorded payout of ${available} ALKE to ${seller.data()?.name || sellerId}`);
    });
    return { amount: available };
  }

  let email = null; // { sellerId, template, data } to send once the change is saved
  await db.runTransaction(async (tx) => {
    const t = Date.now();
    switch (action) {
      case "reviewSeller": {
        const ref = db.doc(`sellers/${lc(a.wallet)}`);
        const s = await tx.get(ref);
        if (!s.exists) fail("not-found", "No such seller.");
        tx.update(ref, { status: a.approve ? "approved" : "rejected", reviewedAt: t });
        audit(tx, db, ctx, `${a.approve ? "approved" : "rejected"} seller ${s.data().name}`);
        email = { sellerId: s.data().id, template: a.approve ? "sellerApproved" : "sellerRejected", data: { name: s.data().name } };
        break;
      }
      case "reviewListing": {
        const ref = db.doc(`listings/${str(a.id, "Listing", { min: 1, max: 60 })}`);
        const l = await tx.get(ref);
        if (!l.exists || l.data().status !== "review") fail("failed-precondition", "That listing isn't waiting for review.");
        const note = str(a.note, "Note", { max: 500 });
        if (!a.approve && !note) fail("invalid-argument", "Say what the seller should change.");
        tx.update(ref, { status: a.approve ? "live" : "returned", reviewNote: note, reviewedAt: t });
        audit(tx, db, ctx, `${a.approve ? "approved" : "returned"} listing ${l.data().title}${note ? ` · ${note}` : ""}`);
        const { sellerId, sellerName, title, kind, id } = l.data();
        email = { sellerId, template: a.approve ? "listingApproved" : "listingReturned", data: { name: sellerName, title, kind, id, note } };
        break;
      }
      case "resolveDispute": {
        const { ref, order: o } = await getOrder(tx, db, a.orderId);
        if (o.status !== "disputed") fail("failed-precondition", "That order isn't in dispute.");
        tx.update(ref, a.refund ? { status: "refunded", refundedAt: t } : { status: "completed", completedAt: t });
        say(tx, db, o.id, "system", a.refund ? `Support refunded ${o.amount} ALKE to the buyer.` : "Support closed the dispute in the seller's favor. The order is complete.");
        audit(tx, db, ctx, `${a.refund ? "refunded" : "closed"} dispute on ${o.id}${a.refund ? `, ${o.amount} ALKE` : ""}`);
        break;
      }
      case "refund": {
        const { ref, order: o } = await getOrder(tx, db, a.orderId);
        if (o.status === "refunded") fail("failed-precondition", "Already refunded.");
        tx.update(ref, { status: "refunded", refundedAt: t });
        audit(tx, db, ctx, `approved refund on ${o.id}, ${o.amount} ALKE · reason: ${str(a.reason, "Reason", { max: 200 })}`);
        break;
      }
      case "reconcile": {
        const { ref, order: o } = await getOrder(tx, db, a.orderId);
        tx.update(ref, { reconciled: true });
        audit(tx, db, ctx, `checked payment for ${o.id} against the treasury`);
        break;
      }
      default:
        fail("invalid-argument", "Unknown action.");
    }
  });
  if (email) await notifySeller(ctx, email);
  return { ok: true };
}

/* ---------------- Time-based changes ---------------- */

// Runs every minute: settles payments, expires price holds and pay windows,
// and completes deliveries once the review window passes.
async function tick(db, { rpc, now = Date.now() }) {
  const [confirming, awaiting, delivered] = await Promise.all(
    ["confirming", "awaiting_payment", "delivered"].map((s) => db.collection("orders").where("status", "==", s).get()),
  );
  for (const d of confirming.docs) {
    try { await settlePayment(db, d.id, { rpc, now }); } catch (e) { console.warn(`settle ${d.id}:`, e.message); }
  }
  const due = [
    ...awaiting.docs.filter((d) => { const o = d.data(); return (o.holdUntil && now > o.holdUntil) || (o.payBy && now > o.payBy); }),
    ...delivered.docs.filter((d) => { const o = d.data(); return o.kind === "service" && now - o.deliveredAt > REVIEW_WINDOW_MS; }),
  ];
  for (const d of due) {
    await db.runTransaction(async (tx) => {
      const { ref, order: o } = await getOrder(tx, db, d.id);
      if (o.status === "awaiting_payment" && o.holdUntil && now > o.holdUntil) {
        tx.update(ref, { status: "failed", payment: { ...o.payment, failure: "expired", failedAt: now } });
      } else if (o.status === "awaiting_payment" && o.payBy && now > o.payBy) {
        tx.update(ref, { status: "cancelled", closedReason: "Not paid in time" });
        say(tx, db, o.id, "system", "The 18-hour payment window passed, so this request was closed. Nothing was charged.");
      } else if (o.status === "delivered" && o.kind === "service" && now - o.deliveredAt > REVIEW_WINDOW_MS) {
        tx.update(ref, { status: "completed", completedAt: now });
        say(tx, db, o.id, "system", "The review window passed, so the order completed automatically.");
      }
    });
  }
  return { settled: confirming.size, timed: due.length };
}

const OPS = {
  applySeller, saveListing, checkout, requestService, submitPayment, paymentDeclined,
  checkPayment: checkPaymentOp, orderAction, fileUrl, admin: adminOp,
};

module.exports = { OPS, ShopError, tick, settlePayment, earnings, sellerShare };
