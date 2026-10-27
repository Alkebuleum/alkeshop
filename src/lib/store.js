// AlkeShop's data. Shared data lives in the "alkeshop" Firestore database and
// is read live; every change goes through the shopApi function, which checks
// who is asking (see functions/src/shop.js for the order lifecycle). Pages
// read one snapshot with useStore() and call the actions below.
//
// What a visitor can read: live listings and approved sellers. A signed-in
// wallet adds its own orders (as buyer and seller), seller profile, listings
// and payouts; staff read everything.
import { useSyncExternalStore } from "react";
import { CREDITS_ENABLED, PRODUCT_REFUND_MS, sellerShare } from "./config";
import { loadAuth, loadShop, loadStorage } from "./firebase";

const FAVORITES_KEY = "alkeshop:favorites";
const loadFavorites = () => { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []; } catch { return []; } };

const blank = () => ({
  ready: false, // the public catalog has loaded
  authReady: false, // we know whether someone is signed in
  session: null, // { wallet, admin } for the signed-in wallet
  privateReady: false, // that wallet's own data has loaded
  listings: [],
  sellers: {}, // by wallet
  orders: [],
  messages: {}, // by order id, while an order is open
  payouts: [],
  audit: [],
  credits: {}, // Nuru Credits balances, once Credits come back
  favorites: typeof localStorage === "undefined" ? [] : loadFavorites(),
  settings: { creditsEnabled: CREDITS_ENABLED },
  toast: null, // { id, text }
});

let state = blank();
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => { state = { ...state, ...patch }; emit(); };

export const getState = () => state;
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const useStore = () => useSyncExternalStore(subscribe, getState, getState);

// For tests: render pages against a fixed state.
export function setStateForTests(patch) { state = { ...blank(), ready: true, authReady: true, privateReady: true, ...patch }; emit(); }

const lc = (a) => (a || "").toLowerCase();

/* ---------------- Live data ---------------- */

// Each kind of data can come from several queries (public, mine, staff);
// `sources[kind][name]` holds each query's docs by id and is merged on change.
const sources = { listings: {}, sellers: {}, contacts: {}, orders: {}, payouts: {}, audit: {} };
const byNewest = (a, b) => (b.createdAt || b.at || 0) - (a.createdAt || a.at || 0);

function merge() {
  const all = (kind) => Object.assign({}, ...Object.values(sources[kind]));
  const contacts = all("contacts");
  const sellers = Object.fromEntries(Object.values(all("sellers")).map((p) => [p.id, { ...p, email: contacts[p.id]?.email }]));
  set({
    listings: Object.values(all("listings")).sort(byNewest),
    sellers,
    orders: Object.values(all("orders")).sort(byNewest),
    payouts: Object.values(all("payouts")).sort(byNewest),
    audit: Object.values(all("audit")).sort(byNewest),
  });
}

let privateUnsubs = [];

function watch(fs, q, kind, name, onFirst) {
  let first = true;
  return fs.onSnapshot(q, (snap) => {
    sources[kind][name] = Object.fromEntries((snap.docs || [snap]).filter((d) => d.exists()).map((d) => [d.id, { ...d.data(), id: d.data().id || d.id }]));
    merge();
    if (first) { first = false; onFirst?.(); }
  }, (e) => {
    console.warn(`AlkeShop: ${kind}/${name}:`, e.message);
    if (first) { first = false; onFirst?.(); }
  });
}

function watchPrivate(fs, db, session) {
  privateUnsubs.forEach((u) => u());
  privateUnsubs = [];
  for (const kind of ["listings", "sellers", "contacts", "orders", "payouts", "audit"]) {
    for (const name of Object.keys(sources[kind])) if (name !== "public") delete sources[kind][name];
  }
  merge();
  if (!session) { set({ privateReady: false }); return; }

  const w = session.wallet;
  const col = (c) => fs.collection(db, c);
  const mine = (c, field) => fs.query(col(c), fs.where(field, "==", w));
  let waiting = 2;
  const loaded = () => { if (--waiting === 0) set({ privateReady: true }); };
  privateUnsubs.push(
    watch(fs, mine("orders", "buyer"), "orders", "buyer", loaded),
    watch(fs, mine("orders", "sellerId"), "orders", "seller", loaded),
    watch(fs, fs.doc(db, `sellers/${w}`), "sellers", "mine"),
    watch(fs, fs.doc(db, `sellerContacts/${w}`), "contacts", "mine"),
    watch(fs, mine("listings", "sellerId"), "listings", "mine"),
    watch(fs, mine("payouts", "sellerId"), "payouts", "mine"),
  );
  if (session.admin) {
    privateUnsubs.push(
      watch(fs, col("orders"), "orders", "all"),
      watch(fs, col("sellers"), "sellers", "all"),
      watch(fs, col("sellerContacts"), "contacts", "all"),
      watch(fs, col("listings"), "listings", "all"),
      watch(fs, col("payouts"), "payouts", "all"),
      watch(fs, fs.query(col("audit"), fs.orderBy("at", "desc"), fs.limit(200)), "audit", "all"),
    );
  }
}

// Starts reading the catalog and following sign-in. Called once by the app.
let started = false;
export async function startSync() {
  if (started) return;
  started = true;
  const { fs, db } = await loadShop();
  let pending = 2;
  const loaded = () => { if (--pending === 0) set({ ready: true }); };
  watch(fs, fs.query(fs.collection(db, "listings"), fs.where("status", "==", "live")), "listings", "public", loaded);
  watch(fs, fs.query(fs.collection(db, "sellers"), fs.where("status", "==", "approved")), "sellers", "public", loaded);

  const { m, auth } = await loadAuth();
  m.onIdTokenChanged(auth, async (user) => {
    const claims = user ? (await user.getIdTokenResult()).claims : {};
    const session = claims.shopWallet ? { wallet: claims.shopWallet, admin: claims.shopAdmin === true } : null;
    if (session?.wallet !== state.session?.wallet || session?.admin !== state.session?.admin) {
      set({ session, privateReady: false });
      watchPrivate(fs, db, session);
    }
    if (!state.authReady) set({ authReady: true });
  });
}

// Follows one order's conversation while its page is open; returns the stop function.
export function watchMessages(orderId) {
  let stop = () => { };
  let stopped = false;
  loadShop().then(({ fs, db }) => {
    if (stopped) return;
    stop = fs.onSnapshot(fs.query(fs.collection(db, `orders/${orderId}/messages`), fs.orderBy("at")), (snap) => {
      set({ messages: { ...state.messages, [orderId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) } });
    }, (e) => console.warn("AlkeShop: messages:", e.message));
  });
  return () => { stopped = true; stop(); };
}

/* ---------------- Calling the server ---------------- */

// WalletProvider registers how to make sure the connected wallet is signed in.
let ensureSession = async () => { throw new Error("Connect a wallet first."); };
export const setSessionProvider = (fn) => { ensureSession = fn; };

let toastN = 0;
export const showToast = (text) => set({ toast: { id: ++toastN, text } });
export const dismissToast = () => set({ toast: null });

const QUIET = /cancelled|rejected|declined/i;

// Runs a shopApi operation as the connected wallet. Resolves with its result,
// or with null after telling the person what went wrong.
async function api(op, args = {}) {
  try {
    await ensureSession();
    const { call } = await loadShop();
    return await call("shopApi", { op, ...args });
  } catch (e) {
    const text = String(e?.message || e).replace(/^(FirebaseError: )?/, "");
    if (!QUIET.test(text)) showToast(text);
    return null;
  }
}

// Waits (briefly) until a newly created order arrives from the database.
function arrived(orderId, ms = 8000) {
  return new Promise((resolve) => {
    const has = () => state.orders.some((o) => o.id === orderId);
    if (has()) return resolve(orderId);
    const t = setTimeout(() => { un(); resolve(orderId); }, ms);
    const un = subscribe(() => { if (has()) { clearTimeout(t); un(); resolve(orderId); } });
  });
}

const safeName = (n) => n.replace(/[/\\#?\[\]*]/g, "_").slice(-200);

// Uploads File objects into this wallet's folder; returns [{ name, size, path }].
export async function uploadFiles(files) {
  if (!files?.length) return [];
  await ensureSession();
  const { m, storage } = await loadStorage();
  const batch = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return Promise.all([...files].map(async (f) => {
    const path = `uploads/${state.session.wallet}/${batch}/${safeName(f.name)}`;
    await m.uploadBytes(m.ref(storage, path), f, { contentType: f.type || "application/octet-stream" });
    return { name: f.name, size: f.size, path };
  }));
}

// Uploads whichever entries are still local files ({ file }) and keeps the rest.
async function withUploads(list = []) {
  const local = list.filter((f) => f.file);
  const up = await uploadFiles(local.map((f) => f.file));
  return list.map((f) => (f.file ? up[local.indexOf(f)] : f));
}

async function tryUploads(fn) {
  try { return await fn(); } catch (e) {
    if (!QUIET.test(e?.message || "")) showToast(`Upload failed: ${e?.message || e}`);
    return undefined;
  }
}

/* ---------------- Buying ---------------- */

// Opens a checkout for a product; resolves with the order id (or null).
export async function startCheckout({ kind, item }) {
  if (kind !== "product") { showToast("Nuru Credits aren't sold here yet."); return null; }
  const r = await api("checkout", { listingId: item.id });
  return r && arrived(r.orderId);
}

// Sends a service request; answers' files are File objects. Nothing is charged.
export async function requestService({ service, answers }) {
  const ready = await tryUploads(() => Promise.all(answers.map(async (a) => ({ a: a.a, files: await uploadFiles(a.files) }))));
  if (!ready) return null;
  const r = await api("requestService", { listingId: service.id, answers: ready });
  return r && arrived(r.orderId);
}

export const paymentSubmitted = (orderId, { txHash, payer }) => api("submitPayment", { orderId, txHash, payer });
export const paymentDeclined = (orderId) => api("paymentDeclined", { orderId });

// Asks the server to look at a confirming payment now (it also checks every minute).
export async function checkPayment(orderId) {
  try {
    const { call } = await loadShop();
    await call("shopApi", { op: "checkPayment", orderId });
  } catch { /* the server's own check will catch up */ }
}

export function toggleFavorite(id) {
  const favorites = state.favorites.includes(id) ? state.favorites.filter((f) => f !== id) : [...state.favorites, id];
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch { }
  set({ favorites });
}

// Gets a short-lived link for a file and starts the download.
export async function downloadFile({ path, orderId, listingId }) {
  const r = await api("fileUrl", { path, orderId, listingId });
  if (r?.url) window.location.assign(r.url);
}

/* ---------------- Order conversation ---------------- */

const act = (orderId, action, extra = {}) => api("orderAction", { orderId, action, ...extra });

export async function sendMessage(orderId, text, files = []) {
  const up = await tryUploads(() => uploadFiles(files));
  return up && act(orderId, "message", { text, files: up });
}
export const acceptDelivery = (orderId) => act(orderId, "acceptDelivery");
export const requestRevision = (orderId, text) => act(orderId, "revision", { text });
export const openDispute = (orderId, text) => act(orderId, "dispute", { text });
export const sellerAccept = (orderId) => act(orderId, "accept");
export const sellerDecline = (orderId) => act(orderId, "decline");
export async function sellerDeliver(orderId, text, files = []) {
  const up = await tryUploads(() => uploadFiles(files));
  return up && act(orderId, "deliver", { text, files: up });
}

/* ---------------- Selling ---------------- */

export const applyAsSeller = (_address, profile) => api("applySeller", profile);

// Saves a listing; product files may include { file } entries still to upload.
export async function saveListing(_address, listing) {
  const files = listing.kind === "product" ? await tryUploads(() => withUploads(listing.files)) : undefined;
  if (listing.kind === "product" && !files) return null;
  const r = await api("saveListing", { ...listing, ...(files ? { files } : {}) });
  return r?.id || null;
}

/* ---------------- Administration ---------------- */

const staffOp = (action, args) => api("admin", { action, ...args });
export const reviewSeller = (wallet, approve, staff) => staffOp("reviewSeller", { wallet, approve, staff });
export const reviewListing = (id, approve, staff, note = "") => staffOp("reviewListing", { id, approve, staff, note });
export const resolveDispute = (orderId, refund, staff) => staffOp("resolveDispute", { orderId, refund, staff });
export const refundOrder = (orderId, staff, reason) => staffOp("refund", { orderId, staff, reason });
export const markReconciled = (orderId, staff) => staffOp("reconcile", { orderId, staff });
export const recordPayout = (sellerId, _amount, staff) => staffOp("payout", { sellerId, staff });
export const setCreditsEnabled = () => showToast("Nuru Credits are switched off in this build.");

/* ---------------- Derived ---------------- */

export const ordersOf = (s, buyer) => s.orders.filter((o) => o.buyer === lc(buyer));
export const sellerOrders = (s, sellerId) => s.orders.filter((o) => o.sellerId === lc(sellerId) && o.kind !== "credits");
export const signedInAs = (s, conn) => !!conn && s.session?.wallet === lc(conn.address);

// Seller money: available = finished sales not yet paid out; pending = paid but
// still in progress, or a product inside its refund window. The server
// computes the same when staff record a payout.
export function earnings(s, sellerId, now = Date.now()) {
  const mine = sellerOrders(s, sellerId);
  const done = mine.filter((o) => o.status === "completed" || (o.kind === "product" && o.status === "delivered" && now - o.paidAt > PRODUCT_REFUND_MS));
  const pending = mine.filter((o) => ["active", "delivered"].includes(o.status) && !done.includes(o));
  const paidOut = s.payouts.filter((p) => p.sellerId === lc(sellerId)).reduce((t, p) => t + p.amount, 0);
  const sum = (xs) => xs.reduce((t, o) => t + sellerShare(o.amount), 0);
  return { available: Math.max(0, sum(done) - paidOut), pending: sum(pending), paidOut };
}
