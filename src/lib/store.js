// AlkeShop's data, kept in this browser (localStorage) until the AlkeShop
// backend exists. Everything that reads or changes marketplace state goes
// through this module, so swapping in an API later touches one place.
//
// Order lifecycle (`status`):
//   product / credits: awaiting_payment → confirming → delivered (product) | completed (credits)
//                      or failed (payment.failure says why: expired, declined, failed, underpaid)
//   service:           requested → awaiting_payment → confirming → active → delivered → completed
//                      or cancelled (seller declined / pay window passed), disputed
import { useSyncExternalStore } from "react";
import { PRICE_HOLD_MS, SERVICE_PAY_WINDOW_MS, REVIEW_WINDOW_MS, sellerShare } from "./config";
import { sellers as seedSellers } from "./catalog";

const KEY = "alkeshop:v1";
const fresh = () => ({
  seq: 10500,
  orders: [],
  messages: {},
  credits: {},
  sellers: {}, // seller profiles by lower-case wallet address
  listings: [], // seller-created products and services
  favorites: [],
  payouts: [],
  audit: [],
  settings: { creditsEnabled: true },
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved ? { ...fresh(), ...saved } : fresh();
  } catch {
    return fresh();
  }
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { }
  listeners.forEach((l) => l());
}

// Another tab changed the data (e.g. the seller center open beside the shop).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = load();
    listeners.forEach((l) => l());
  });
}

export const getState = () => state;
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const useStore = () => useSyncExternalStore(subscribe, getState, getState);

// Applies `recipe` to a copy of the state and saves it.
function update(recipe) {
  const draft = structuredClone(state);
  const out = recipe(draft);
  commit(draft);
  return out;
}

const now = () => Date.now();
const lc = (a) => (a || "").toLowerCase();
const msgId = () => now().toString(36) + Math.random().toString(36).slice(2, 6);
const findOrder = (s, id) => s.orders.find((o) => o.id === id);
const sellerName = (s, id) => s.sellers[id]?.name || seedSellers.find((x) => x.id === id)?.name || "Seller";
const firstName = (name) => name.split(" ")[0];

function say(s, orderId, from, text, extra = {}) {
  (s.messages[orderId] ||= []).push({ id: msgId(), from, text, at: now(), ...extra });
}

function audit(s, who, text) {
  s.audit.unshift({ at: now(), who, text });
  s.audit = s.audit.slice(0, 200);
}

/* ---------------- Buying ---------------- */

// Opens a checkout for a product or a credit package; returns the order id.
export function startCheckout({ kind, item, buyer }) {
  return update((s) => {
    const id = `AS-${++s.seq}`;
    s.orders.unshift({
      id, kind, buyer: lc(buyer), createdAt: now(), status: "awaiting_payment", holdUntil: now() + PRICE_HOLD_MS,
      itemId: item.id, title: kind === "credits" ? `${item.credits.toLocaleString("en-US")} Nuru Credits` : item.title,
      sellerId: kind === "credits" ? "nuru" : item.sellerId,
      sellerName: kind === "credits" ? "Nuru" : sellerName(s, item.sellerId),
      amount: item.price, credits: item.credits, license: item.license, version: item.version, size: item.size,
      payment: {},
    });
    return id;
  });
}

// Sends a service request. Nothing is charged until the seller accepts.
export function requestService({ service, buyer, answers }) {
  return update((s) => {
    const id = `AS-${++s.seq}`;
    s.orders.unshift({
      id, kind: "service", buyer: lc(buyer), createdAt: now(), status: "requested",
      itemId: service.id, title: service.title.replace(/^I will /, "").replace(/^./, (c) => c.toUpperCase()),
      sellerId: service.sellerId, sellerName: sellerName(s, service.sellerId),
      amount: service.price, days: service.days, revisionsLeft: service.revisions, answers, payment: {},
    });
    say(s, id, "buyer", answers.map((a) => `${a.q}: ${a.a || "(skipped)"}`).join("\n"), { files: answers.flatMap((a) => a.files || []) });
    say(s, id, "system", `Request sent. ${firstName(sellerName(s, service.sellerId))} will accept or decline. Nothing has been charged.`);
    return id;
  });
}

// A payment transaction was submitted from the wallet.
export function paymentSubmitted(orderId, { txHash, payer }) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "confirming";
    o.payment = { txHash, payer: lc(payer), submittedAt: now(), stage: "sent" };
  });
}

export function paymentStage(orderId, stage, extra = {}) {
  update((s) => {
    const o = findOrder(s, orderId);
    if (o?.status === "confirming") o.payment = { ...o.payment, stage, ...extra };
  });
}

// The payment didn't go through. Services stay open so the buyer can retry.
export function paymentFailed(orderId, failure, extra = {}) {
  update((s) => {
    const o = findOrder(s, orderId);
    if (!o) return;
    o.payment = { ...o.payment, failure, failedAt: now(), ...extra };
    o.status = o.kind === "service" ? "awaiting_payment" : "failed";
    if (o.kind === "service" && failure === "underpaid") o.status = "failed";
  });
}

// Confirmed on chain: deliver what was bought.
// `verified` is false when the amount couldn't be read from the transaction
// (a relayed call); admin reconciliation checks those against the treasury.
export function paymentConfirmed(orderId, { blockNumber, verified }) {
  update((s) => {
    const o = findOrder(s, orderId);
    if (!o || o.status !== "confirming") return;
    o.paidAt = now();
    o.payment = { ...o.payment, stage: "confirmed", blockNumber, verified, failure: null };
    if (o.kind === "product") o.status = "delivered";
    if (o.kind === "credits") {
      o.status = "completed";
      s.credits[o.buyer] = (s.credits[o.buyer] || 0) + o.credits;
    }
    if (o.kind === "service") {
      o.status = "active";
      o.dueAt = now() + o.days * 86400000;
      say(s, o.id, "system", `Payment confirmed. ${firstName(o.sellerName)} has been told to start.`);
    }
  });
}

export function toggleFavorite(id) {
  update((s) => {
    s.favorites = s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id];
  });
}

/* ---------------- Order conversation ---------------- */

export function sendMessage(orderId, from, text, files = []) {
  update((s) => say(s, orderId, from, text, { files }));
}

export function acceptDelivery(orderId) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "completed";
    o.completedAt = now();
    say(s, orderId, "system", "You accepted the delivery. The order is complete.");
  });
}

export function requestRevision(orderId, text) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "active";
    o.revisionsLeft = Math.max(0, (o.revisionsLeft || 0) - 1);
    say(s, orderId, "buyer", text || "Please revise the delivery.");
    say(s, orderId, "system", `Revision requested. ${o.revisionsLeft} left.`);
    o.revisionAt = now();
  });
}

export function openDispute(orderId, reason) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "disputed";
    o.disputedAt = now();
    o.dispute = reason;
    say(s, orderId, "system", "Dispute opened. AlkeShop support will review the conversation and files and reply here.");
    audit(s, "System", `Dispute opened on ${orderId}: ${reason}`);
  });
}

/* ---------------- Selling ---------------- */

export function applyAsSeller(address, profile) {
  update((s) => {
    s.sellers[lc(address)] = { ...profile, id: lc(address), payout: lc(address), status: "review", appliedAt: now() };
    audit(s, "System", `Seller application from ${profile.name}`);
  });
}

export function saveListing(address, listing) {
  return update((s) => {
    const id = listing.id || `${listing.kind}-${msgId()}`;
    const i = s.listings.findIndex((l) => l.id === id);
    const next = { ...listing, id, sellerId: lc(address), updatedAt: now(), createdAt: listing.createdAt || now() };
    if (i >= 0) s.listings[i] = next; else s.listings.unshift(next);
    if (next.status === "review") audit(s, "System", `Listing submitted for review: ${next.title}`);
    return id;
  });
}

export function sellerAccept(orderId) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "awaiting_payment";
    o.payBy = now() + SERVICE_PAY_WINDOW_MS;
    say(s, orderId, "system", `${firstName(o.sellerName)} accepted your request. Pay within 18 hours to start.`);
  });
}

export function sellerDecline(orderId) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "cancelled";
    o.closedReason = "Seller declined";
    say(s, orderId, "system", `${firstName(o.sellerName)} declined this request. Nothing was charged.`);
  });
}

export function sellerDeliver(orderId, note, files) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "delivered";
    o.deliveredAt = now();
    o.deliveries = (o.deliveries || 0) + 1;
    say(s, orderId, "seller", note, { delivery: o.deliveries, files });
  });
}

/* ---------------- Administration ---------------- */

export function reviewSeller(address, approve, staff) {
  update((s) => {
    const p = s.sellers[lc(address)];
    p.status = approve ? "approved" : "rejected";
    p.reviewedAt = now();
    audit(s, staff, `${approve ? "approved" : "rejected"} seller ${p.name}`);
  });
}

export function reviewListing(id, approve, staff, note = "") {
  update((s) => {
    const l = s.listings.find((x) => x.id === id);
    l.status = approve ? "live" : "returned";
    l.reviewNote = note;
    audit(s, staff, `${approve ? "approved" : "returned"} listing ${l.title}${note ? ` · ${note}` : ""}`);
  });
}

export function resolveDispute(orderId, refund, staff) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = refund ? "refunded" : "completed";
    o.completedAt = now();
    say(s, orderId, "system", refund ? `Support refunded ${o.amount} ALKE to the buyer.` : "Support closed the dispute in the seller's favor. The order is complete.");
    audit(s, staff, `${refund ? "refunded" : "closed"} dispute on ${orderId}${refund ? `, ${o.amount} ALKE` : ""}`);
  });
}

export function refundOrder(orderId, staff, reason) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.status = "refunded";
    o.refundedAt = now();
    audit(s, staff, `approved refund on ${orderId}, ${o.amount} ALKE · reason: ${reason}`);
  });
}

export function markReconciled(orderId, staff) {
  update((s) => {
    const o = findOrder(s, orderId);
    o.reconciled = true;
    audit(s, staff, `checked payment for ${orderId} against the treasury`);
  });
}

export function setCreditsEnabled(on, staff) {
  update((s) => {
    s.settings.creditsEnabled = on;
    audit(s, staff, `${on ? "switched on" : "switched off"} Nuru Credit sales`);
  });
}

export function recordPayout(sellerId, amount, staff) {
  update((s) => {
    s.payouts.unshift({ sellerId, amount, at: now() });
    audit(s, staff, `approved payout of ${amount} ALKE to ${sellerName(s, sellerId)}`);
  });
}

/* ---------------- Derived ---------------- */

export const ordersOf = (s, buyer) => s.orders.filter((o) => o.buyer === lc(buyer));
export const sellerOrders = (s, sellerId) => s.orders.filter((o) => o.sellerId === lc(sellerId) && o.kind !== "credits");

// Seller money: available = completed sales not yet paid out; pending = paid but
// still in progress or inside the review window.
export function earnings(s, sellerId) {
  const mine = sellerOrders(s, sellerId);
  const share = (o) => sellerShare(o.amount);
  const done = mine.filter((o) => o.status === "completed" || (o.kind === "product" && o.status === "delivered" && now() - o.paidAt > 7 * 86400000));
  const pending = mine.filter((o) => ["active", "delivered"].includes(o.status) && !done.includes(o));
  const paidOut = s.payouts.filter((p) => p.sellerId === lc(sellerId)).reduce((t, p) => t + p.amount, 0);
  return {
    available: Math.max(0, done.reduce((t, o) => t + share(o), 0) - paidOut),
    pending: pending.reduce((t, o) => t + share(o), 0),
    paidOut,
  };
}

/* ---------------- Time-based changes ---------------- */

// Runs every few seconds: expires price holds and pay windows, completes
// deliveries after the review window, and lets the sample sellers from the
// catalog accept and deliver so the service flow can be tried end to end.
export function tick() {
  const t = now();
  const s0 = state;
  const due = s0.orders.some((o) =>
    (o.status === "awaiting_payment" && ((o.holdUntil && t > o.holdUntil) || (o.payBy && t > o.payBy))) ||
    (o.status === "delivered" && o.kind === "service" && t - o.deliveredAt > REVIEW_WINDOW_MS) ||
    (isSample(o.sellerId) && o.status === "requested" && t - o.createdAt > 6000) ||
    (isSample(o.sellerId) && o.status === "active" && t - (o.revisionAt || o.paidAt) > 15000));
  if (!due) return;
  update((s) => {
    for (const o of s.orders) {
      if (o.status === "awaiting_payment" && o.holdUntil && t > o.holdUntil) {
        o.status = "failed";
        o.payment = { ...o.payment, failure: "expired", failedAt: t };
      } else if (o.status === "awaiting_payment" && o.payBy && t > o.payBy) {
        o.status = "cancelled";
        o.closedReason = "Not paid in time";
        say(s, o.id, "system", "The 18-hour payment window passed, so this request was closed. Nothing was charged.");
      } else if (o.status === "delivered" && o.kind === "service" && t - o.deliveredAt > REVIEW_WINDOW_MS) {
        o.status = "completed";
        o.completedAt = t;
        say(s, o.id, "system", "The review window passed, so the order completed automatically.");
      } else if (isSample(o.sellerId) && o.status === "requested" && t - o.createdAt > 6000) {
        o.status = "awaiting_payment";
        o.payBy = t + SERVICE_PAY_WINDOW_MS;
        say(s, o.id, "seller", "Thanks for the details. Happy to take this on.");
        say(s, o.id, "system", `${firstName(o.sellerName)} accepted your request. Pay within 18 hours to start.`);
      } else if (isSample(o.sellerId) && o.status === "active" && t - (o.revisionAt || o.paidAt) > 15000) {
        o.status = "delivered";
        o.deliveredAt = t;
        o.deliveries = (o.deliveries || 0) + 1;
        say(s, o.id, "seller", "Here is the delivery. Let me know if you'd like changes.", {
          delivery: o.deliveries,
          files: [{ name: `${o.itemId}-delivery-${o.deliveries}.zip`, size: 12_000_000, sample: true }],
        });
      }
    }
  });
}

const isSample = (sellerId) => !!seedSellers.find((x) => x.id === sellerId)?.sample;
