// End-to-end shop flows against the Firestore emulator. Run from the project
// root:  npm run test:emulator   (firebase emulators:exec starts Firestore).
const test = require("node:test");
const assert = require("node:assert");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { amountWei, orderCalldata } = require("../src/payments");

process.env.SHOP_ADMINS = "0x00000000000000000000000000000000000000ad";
process.env.SHOP_MIN_CONFS = "1";
const { OPS, tick, settlePayment } = require("../src/shop");

admin.initializeApp({ projectId: "amid-7592b" });
const db = getFirestore("alkeshop");

const SELLER = "0x00000000000000000000000000000000000000a1";
const BUYER = "0x00000000000000000000000000000000000000b1";
const OTHER = "0x00000000000000000000000000000000000000c1";
const TREASURY = "0x00000000000000000000000000000000000000ee";
const STAFF = "0x00000000000000000000000000000000000000ad";
const file = (wallet, name = "kit.pdf") => ({ name, size: 1000, path: `uploads/${wallet}/batch123/${name}` });
const bucket = { file: (p) => ({ getSignedUrl: async () => [`https://signed.example/${p}`], getMetadata: async () => [{ size: "1234" }] }) };
const hex = (n) => "0x" + BigInt(n).toString(16);

// A chain where every payment is a tagged transfer to the treasury, mined in block 10.
let paid = {};
const rpc = async (method, params) => {
  if (method === "eth_blockNumber") return hex(20);
  const p = paid[params[0]];
  if (method === "eth_getTransactionByHash") return p ? { to: TREASURY, value: hex(amountWei(p.amount)), input: orderCalldata(p.orderId), blockNumber: hex(10) } : null;
  if (method === "eth_getTransactionReceipt") return p ? { status: "0x1", blockNumber: hex(10) } : null;
  throw new Error(method);
};
const sent = []; // emails, instead of Brevo
const as = (wallet, extra = {}) => ({ db, wallet, admin: wallet === STAFF, bucket, rpc, sendEmail: async (m) => sent.push(m), ...extra });
const order = async (id) => (await db.doc(`orders/${id}`).get()).data();
const messages = async (id) => (await db.collection(`orders/${id}/messages`).orderBy("at").get()).docs.map((d) => d.data());
let txN = 0;
const pay = async (wallet, orderId, amount) => {
  const txHash = "0x" + String(++txN).padStart(64, "0");
  paid[txHash] = { orderId, amount };
  await OPS.submitPayment(as(wallet), { orderId, txHash });
  return txHash;
};

test.before(async () => {
  paid = {};
  for (const c of ["sellers", "sellerContacts", "listings", "orders", "payouts", "audit", "payments", "counters"]) {
    await db.recursiveDelete(db.collection(c));
  }
});

let productId, serviceId;

test("a seller applies, is approved and lists a product and a service", async () => {
  await OPS.applySeller(as(SELLER), { name: "Ama Studio", type: "Business", country: "Ghana", email: "ama@example.com", bio: "Templates for small shops.", sells: ["products", "services"] });
  await assert.rejects(OPS.applySeller(as(SELLER), { name: "Ama Studio", type: "Business", country: "Ghana", email: "ama@example.com", bio: "Templates for small shops.", sells: ["products"] }), /already applied/);
  await assert.rejects(OPS.saveListing(as(SELLER), { kind: "product", status: "draft", title: "Draft", category: "business", license: "commercial" }), /approved sellers/);
  await assert.rejects(OPS.admin(as(SELLER), { action: "reviewSeller", wallet: SELLER, approve: true }), /Staff only/);
  await OPS.admin(as(STAFF), { action: "reviewSeller", wallet: SELLER, approve: true, staff: "Staff" });

  await assert.rejects(OPS.saveListing(as(SELLER), {
    kind: "product", status: "review", title: "Shop Kit", category: "business", about: "Everything a small shop needs.", files: [file(OTHER)], license: "commercial", price: 50,
  }), /wasn't uploaded from this wallet/);
  ({ id: productId } = await OPS.saveListing(as(SELLER), {
    kind: "product", status: "review", title: "Shop Kit", category: "business", about: "Everything a small shop needs.", files: [file(SELLER)], version: "1.0", license: "commercial", price: 50,
  }));
  ({ id: serviceId } = await OPS.saveListing(as(SELLER), {
    kind: "service", status: "review", title: "I will design a logo", category: "design", scope: "A clean logo for a small business.", price: 200, days: 3, revisions: 1,
    deliverables: ["3 concepts"], needs: [{ q: "Business name", type: "text" }],
  }));
  const listing = (await db.doc(`listings/${productId}`).get()).data();
  assert.equal(listing.status, "review");
  assert.equal(listing.files[0].size, 1234, "size comes from storage, not the client");
  assert.deepEqual(listing.formats, ["PDF"]);
  await assert.rejects(OPS.admin(as(STAFF), { action: "reviewListing", id: productId, approve: false }), /should change/);
  await OPS.admin(as(STAFF), { action: "reviewListing", id: productId, approve: false, note: "Add a preview" });
  await OPS.saveListing(as(SELLER), { ...(await db.doc(`listings/${productId}`).get()).data(), status: "review" });
  await OPS.admin(as(STAFF), { action: "reviewListing", id: productId, approve: true });
  await OPS.admin(as(STAFF), { action: "reviewListing", id: serviceId, approve: true });
  assert.equal((await db.doc(`listings/${serviceId}`).get()).data().status, "live");

  assert.deepEqual(sent.map((m) => [m.to, m.subject]), [
    ["ama@example.com", "You're approved to sell on AlkeShop"],
    ["ama@example.com", "Changes needed: Shop Kit"],
    ["ama@example.com", "Your listing is live: Shop Kit"],
    ["ama@example.com", "Your listing is live: I will design a logo"],
  ]);
  assert.match(sent[1].html, /Add a preview/);
});

test("checkout is off until a treasury is set", async () => {
  delete process.env.SHOP_TREASURY;
  await assert.rejects(OPS.checkout(as(BUYER), { listingId: productId }), /switched off/);
  process.env.SHOP_TREASURY = TREASURY;
});

test("a product is bought, confirmed on chain and downloadable only by the buyer", async () => {
  await assert.rejects(OPS.checkout(as(SELLER), { listingId: productId }), /your own listing/);
  const { orderId } = await OPS.checkout(as(BUYER), { listingId: productId });
  assert.equal(orderId, "AS-10501");
  assert.equal((await order(orderId)).amount, 50);

  await assert.rejects(OPS.fileUrl(as(BUYER), { orderId, path: file(SELLER).path }), /access/, "not before paying");
  await assert.rejects(OPS.submitPayment(as(OTHER), { orderId, txHash: "0x" + "1".repeat(64) }), /isn't your order/);
  const txHash = await pay(BUYER, orderId, 50);

  const { orderId: second } = await OPS.checkout(as(BUYER), { listingId: productId });
  await assert.rejects(OPS.submitPayment(as(BUYER), { orderId: second, txHash }), /already used/, "one payment, one order");

  await OPS.checkPayment(as(BUYER), { orderId });
  const o = await order(orderId);
  assert.equal(o.status, "delivered");
  assert.equal(o.payment.verified, true);

  assert.match((await OPS.fileUrl(as(BUYER), { orderId, path: file(SELLER).path })).url, /signed/);
  await assert.rejects(OPS.fileUrl(as(OTHER), { orderId, path: file(SELLER).path }), /access/);
  await assert.rejects(OPS.fileUrl(as(BUYER), { orderId, path: file(SELLER, "other.zip").path }), /access/);
});

test("an underpayment fails the order", async () => {
  const { orderId } = await OPS.checkout(as(BUYER), { listingId: productId });
  await pay(BUYER, orderId, 20);
  await settlePayment(db, orderId, { rpc });
  const o = await order(orderId);
  assert.equal(o.status, "failed");
  assert.equal(o.payment.failure, "underpaid");
  assert.equal(o.payment.received, 20);
});

test("a service runs from request to completion, then the seller is paid out", async () => {
  await assert.rejects(OPS.requestService(as(BUYER), { listingId: serviceId, answers: [{ a: "" }] }), /Business name/);
  const { orderId } = await OPS.requestService(as(BUYER), { listingId: serviceId, answers: [{ a: "Ama Bakery" }] });
  assert.equal((await order(orderId)).status, "requested");
  assert.match((await messages(orderId))[0].text, /Ama Bakery/);

  await assert.rejects(OPS.orderAction(as(BUYER), { orderId, action: "accept" }), /not yours/);
  await assert.rejects(OPS.orderAction(as(OTHER), { orderId, action: "message", text: "hi" }), /Only the buyer and the seller/);
  await OPS.orderAction(as(SELLER), { orderId, action: "accept" });
  await pay(BUYER, orderId, 200);
  await settlePayment(db, orderId, { rpc });
  assert.equal((await order(orderId)).status, "active");

  await OPS.orderAction(as(BUYER), { orderId, action: "message", text: "Blue, please" });
  await OPS.orderAction(as(SELLER), { orderId, action: "deliver", text: "Here you go", files: [file(SELLER, "logo.zip")] });
  await OPS.orderAction(as(BUYER), { orderId, action: "revision", text: "Bigger" });
  await assert.rejects(OPS.orderAction(as(BUYER), { orderId, action: "revision", text: "Again" }), /moved on/);
  await OPS.orderAction(as(SELLER), { orderId, action: "deliver", text: "Bigger now" });
  await assert.rejects(OPS.orderAction(as(BUYER), { orderId, action: "revision" }), /No revisions left/);
  assert.match((await OPS.fileUrl(as(BUYER), { orderId, path: file(SELLER, "logo.zip").path })).url, /signed/, "delivered files are the buyer's");
  await OPS.orderAction(as(BUYER), { orderId, action: "acceptDelivery" });
  assert.equal((await order(orderId)).status, "completed");

  const { amount } = await OPS.admin(as(STAFF), { action: "payout", sellerId: SELLER, staff: "Staff" });
  assert.equal(amount, 180, "200 less the 10% fee; the product is still in its refund window");
  await assert.rejects(OPS.admin(as(STAFF), { action: "payout", sellerId: SELLER }), /Nothing is ready/);
});

test("the tick expires unpaid checkouts and closes unpaid accepted requests", async () => {
  const { orderId: hold } = await OPS.checkout(as(OTHER), { listingId: productId });
  const { orderId: req } = await OPS.requestService(as(OTHER), { listingId: serviceId, answers: [{ a: "Shop" }] });
  await OPS.orderAction(as(SELLER), { orderId: req, action: "accept" });
  await tick(db, { rpc, now: Date.now() + 19 * 3600 * 1000 });
  assert.equal((await order(hold)).payment.failure, "expired");
  assert.equal((await order(req)).status, "cancelled");
});

test("a dispute is resolved by staff", async () => {
  const { orderId } = await OPS.requestService(as(BUYER), { listingId: serviceId, answers: [{ a: "Shop" }] });
  await OPS.orderAction(as(SELLER), { orderId, action: "accept" });
  await pay(BUYER, orderId, 200);
  await settlePayment(db, orderId, { rpc });
  await OPS.orderAction(as(BUYER), { orderId, action: "dispute", text: "No delivery" });
  await OPS.admin(as(STAFF), { action: "resolveDispute", orderId, refund: true });
  assert.equal((await order(orderId)).status, "refunded");
  assert.ok((await db.collection("audit").get()).size > 3);
});
