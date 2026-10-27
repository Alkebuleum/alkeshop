// The whole stack on the emulators: wallet sign-in through shopAuth, custom
// token claims, shopApi calls, Storage upload rules and Firestore reads, using
// the same client SDK the site uses. Run: npm run test:e2e
import test from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithCustomToken } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from "firebase/firestore";
import { getStorage, connectStorageEmulator, ref, uploadBytes } from "firebase/storage";

const require = createRequire(new URL("../functions/index.js", import.meta.url));
const { ethers } = require("ethers");
const { buildMessage } = require("./src/auth");

const wallet = (n) => new ethers.Wallet(ethers.id(`alkeshop-e2e-${n}`));
const apps = [];

async function signedIn(w) {
  const app = initializeApp({ projectId: "amid-7592b", apiKey: "fake", storageBucket: "amid-7592b-alkeshop" }, `e2e-${apps.length}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
  const fns = getFunctions(app, "us-central1");
  connectFunctionsEmulator(fns, "127.0.0.1", 5101);
  const db = getFirestore(app, "alkeshop");
  connectFirestoreEmulator(db, "127.0.0.1", 8180);
  const storage = getStorage(app, "gs://amid-7592b-alkeshop");
  connectStorageEmulator(storage, "127.0.0.1", 9299);
  const call = (name, args) => httpsCallable(fns, name)(args).then((r) => r.data);

  const issuedAt = new Date().toISOString();
  const signature = await w.signMessage(buildMessage({ wallet: w.address, key: w.address, issuedAt }));
  const res = await call("shopAuth", { wallet: w.address, key: w.address, issuedAt, signature });
  await assert.rejects(call("shopAuth", { wallet: w.address, key: w.address, issuedAt, signature }), /already used/, "a signature works once");
  await signInWithCustomToken(auth, res.token);
  const claims = (await auth.currentUser.getIdTokenResult()).claims;
  return { res, claims, db, storage, api: (op, args) => call("shopApi", { op, ...args }) };
}

test.after(() => Promise.all(apps.map(deleteApp)));

test("sign in, sell, review, list, buy and fetch files across the real stack", async () => {
  const seller = await signedIn(wallet("seller"));
  const buyer = await signedIn(wallet("buyer"));
  const staff = await signedIn(wallet("staff"));
  const me = wallet("seller").address.toLowerCase();
  assert.equal(seller.claims.shopWallet, me);
  assert.equal(seller.claims.shopAdmin, false);
  assert.equal(staff.claims.shopAdmin, true, "staff from SHOP_ADMINS");

  await seller.api("applySeller", { name: "E2E Studio", type: "Business", country: "Ghana", email: "e2e@example.com", bio: "End-to-end test seller.", sells: ["products"] });
  await assert.rejects(seller.api("admin", { action: "reviewSeller", wallet: me, approve: true }), /Staff only/);
  await staff.api("admin", { action: "reviewSeller", wallet: me, approve: true, staff: "E2E staff" });
  assert.equal((await getDoc(doc(buyer.db, `sellers/${me}`))).data().status, "approved", "approved sellers are public");

  const path = `uploads/${me}/e2ebatch1/guide.pdf`;
  await uploadBytes(ref(seller.storage, path), new TextEncoder().encode("%PDF-1.4 test"));
  await assert.rejects(uploadBytes(ref(buyer.storage, path.replace("guide", "fake")), new Uint8Array([1])), /unauthorized|permission/i, "can't upload into someone else's folder");

  const { id } = await seller.api("saveListing", { kind: "product", status: "review", title: "E2E Guide", category: "business", about: "A guide made in the end-to-end test.", files: [{ name: "guide.pdf", size: 1, path }], license: "commercial", price: 12.5 });
  assert.equal((await getDoc(doc(seller.db, `listings/${id}`))).data().files[0].size, 13, "size read from storage");
  await assert.rejects(getDoc(doc(buyer.db, `listings/${id}`)), /permission/i, "not public until approved");
  await staff.api("admin", { action: "reviewListing", id, approve: true, staff: "E2E staff" });
  assert.equal((await getDoc(doc(buyer.db, `listings/${id}`))).data().status, "live");

  const { orderId } = await buyer.api("checkout", { listingId: id });
  const order = (await getDoc(doc(buyer.db, `orders/${orderId}`))).data();
  assert.equal(order.amount, 12.5);
  assert.equal(order.status, "awaiting_payment");
  assert.equal((await getDoc(doc(seller.db, `orders/${orderId}`))).data().buyer, wallet("buyer").address.toLowerCase(), "the seller sees orders for their listing");
  await assert.rejects(getDoc(doc(seller.db, `sellerContacts/${wallet("buyer").address.toLowerCase()}`)), /permission/i);
  await assert.rejects(buyer.api("fileUrl", { orderId, path }), /access/, "no files before paying");
  // Signing download links needs a real service account, so the emulator stops at the access check.
  await assert.rejects(seller.api("fileUrl", { listingId: id, path }), /went wrong on our side/);
});
