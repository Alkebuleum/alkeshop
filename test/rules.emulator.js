// Firestore rules for the "alkeshop" database, against the emulator.
// Run: npm run test:emulator
import test from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";
import { initializeApp, deleteApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";

// firebase-admin lives with the functions.
const require = createRequire(new URL("../functions/index.js", import.meta.url));
const admin = require("firebase-admin");
const { getFirestore: adminDb } = require("firebase-admin/firestore");

const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
admin.initializeApp({ projectId: "amid-7592b" });
const seed = adminDb("alkeshop");

const BUYER = "0x00000000000000000000000000000000000000b1";
const SELLER = "0x00000000000000000000000000000000000000a1";
const OTHER = "0x00000000000000000000000000000000000000c1";

const apps = [];
function as(claims) {
  const app = initializeApp({ projectId: "amid-7592b", apiKey: "x" }, `app${apps.length}`);
  apps.push(app);
  const db = getFirestore(app, "alkeshop");
  connectFirestoreEmulator(db, host, Number(port), claims ? { mockUserToken: { sub: `shop:${claims.shopWallet || "x"}`, ...claims } } : undefined);
  return db;
}
const can = (p) => p.then(() => true, () => false);

test.before(async () => {
  for (const c of ["sellers", "sellerContacts", "listings", "orders", "payouts", "audit"]) await seed.recursiveDelete(seed.collection(c));
  await seed.doc(`sellers/${SELLER}`).set({ id: SELLER, name: "Ama", status: "approved" });
  await seed.doc(`sellers/${OTHER}`).set({ id: OTHER, name: "Pending", status: "review" });
  await seed.doc(`sellerContacts/${SELLER}`).set({ email: "ama@example.com" });
  await seed.doc("listings/live").set({ status: "live", sellerId: SELLER });
  await seed.doc("listings/draft").set({ status: "draft", sellerId: SELLER });
  await seed.doc("orders/AS-1").set({ id: "AS-1", buyer: BUYER, sellerId: SELLER, status: "delivered" });
  await seed.doc("orders/AS-1/messages/m1").set({ from: "buyer", text: "hi", at: 1 });
  await seed.doc("payouts/p1").set({ sellerId: SELLER, amount: 10 });
  await seed.doc("audit/a1").set({ text: "x" });
});
test.after(async () => { await Promise.all(apps.map(deleteApp)); await admin.app().delete(); });

test("anyone can browse live listings and approved sellers, nothing else", async () => {
  const anon = as(null);
  assert.ok(await can(getDoc(doc(anon, "listings/live"))));
  assert.ok(await can(getDocs(query(collection(anon, "listings"), where("status", "==", "live")))));
  assert.ok(await can(getDoc(doc(anon, `sellers/${SELLER}`))));
  assert.ok(!(await can(getDoc(doc(anon, "listings/draft")))));
  assert.ok(!(await can(getDoc(doc(anon, `sellers/${OTHER}`)))));
  assert.ok(!(await can(getDocs(collection(anon, "listings")))), "can't list unpublished listings");
  assert.ok(!(await can(getDoc(doc(anon, "orders/AS-1")))));
});

test("a wallet reads its own orders, messages, profile and payouts", async () => {
  const buyer = as({ shopWallet: BUYER });
  const seller = as({ shopWallet: SELLER });
  const other = as({ shopWallet: OTHER });
  assert.ok(await can(getDoc(doc(buyer, "orders/AS-1"))));
  assert.ok(await can(getDocs(query(collection(buyer, "orders"), where("buyer", "==", BUYER)))));
  assert.ok(await can(getDocs(collection(seller, "orders/AS-1/messages"))));
  assert.ok(await can(getDoc(doc(seller, "listings/draft"))));
  assert.ok(await can(getDoc(doc(seller, `sellerContacts/${SELLER}`))));
  assert.ok(await can(getDocs(query(collection(seller, "payouts"), where("sellerId", "==", SELLER)))));
  assert.ok(await can(getDoc(doc(other, `sellers/${OTHER}`))), "an applicant sees their own application");

  assert.ok(!(await can(getDoc(doc(other, "orders/AS-1")))));
  assert.ok(!(await can(getDocs(collection(other, "orders/AS-1/messages")))));
  assert.ok(!(await can(getDocs(query(collection(other, "orders"), where("buyer", "==", BUYER))))));
  assert.ok(!(await can(getDoc(doc(buyer, `sellerContacts/${SELLER}`)))));
  assert.ok(!(await can(getDocs(collection(buyer, "payouts")))));
  assert.ok(!(await can(getDocs(collection(seller, "audit")))));
});

test("only staff read everything", async () => {
  const staff = as({ shopWallet: OTHER, shopAdmin: true });
  for (const c of ["orders", "listings", "sellers", "sellerContacts", "payouts", "audit", "orders/AS-1/messages"]) {
    assert.ok(await can(getDocs(collection(staff, c))), c);
  }
});

test("nobody writes directly, not even staff", async () => {
  for (const db of [as(null), as({ shopWallet: BUYER }), as({ shopWallet: SELLER, shopAdmin: true })]) {
    assert.ok(!(await can(setDoc(doc(db, "orders/AS-1"), { status: "completed" }, { merge: true }))));
    assert.ok(!(await can(setDoc(doc(db, "listings/new"), { status: "live", sellerId: SELLER }))));
    assert.ok(!(await can(setDoc(doc(db, "orders/AS-1/messages/x"), { from: "system", text: "refunded" }))));
    assert.ok(!(await can(setDoc(doc(db, `sellers/${BUYER}`), { status: "approved" }))));
  }
});

test("a token from another app (no shopWallet claim) gets nothing private", async () => {
  const nuruUser = as({ ain: "AA00000001" });
  assert.ok(!(await can(getDoc(doc(nuruUser, "orders/AS-1")))));
  assert.ok(!(await can(getDocs(collection(nuruUser, "payouts")))));
});
