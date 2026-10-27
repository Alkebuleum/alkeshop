// Shared Alkebuleum Firebase project (also used by the explorer, JollofSwap and
// Nuru). AlkeShop keeps its data in its own Firestore database ("alkeshop")
// and its files in its own bucket; the default database is only used for the
// Nuru QR handshake. Each SDK loads on demand.
import { initializeApp } from "firebase/app";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
});

export const SHOP_DATABASE = "alkeshop";
export const SHOP_BUCKET = import.meta.env.VITE_SHOP_BUCKET || "amid-7592b-alkeshop";
// `VITE_USE_EMULATORS=1 npm run dev` talks to `firebase emulators:start` (ports in firebase.json).
const EMULATORS = import.meta.env.VITE_USE_EMULATORS === "1";

let authPromise = null;
export function loadAuth() {
  authPromise ||= import("firebase/auth").then((m) => {
    const auth = m.getAuth(app);
    if (EMULATORS) m.connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
    return { m, auth };
  });
  return authPromise;
}

// The QR connect/sign flows only need "some" signed-in session, which is how
// Nuru itself signs in.
export async function ensureSignedIn() {
  const { m, auth } = await loadAuth();
  await auth.authStateReady();
  if (!auth.currentUser) await m.signInAnonymously(auth);
  return auth.currentUser;
}

// The default database, for the Nuru QR handshake.
let dbPromise = null;
export function loadRealtimeDb() {
  dbPromise ||= import("firebase/firestore").then((m) => ({ m, db: m.getFirestore(app) }));
  return dbPromise;
}

// AlkeShop's database and its functions.
let shopPromise = null;
export function loadShop() {
  shopPromise ||= Promise.all([import("firebase/firestore"), import("firebase/functions")]).then(([fs, fn]) => {
    const db = fs.getFirestore(app, SHOP_DATABASE);
    const functions = fn.getFunctions(app, "us-central1");
    if (EMULATORS) {
      fs.connectFirestoreEmulator(db, "127.0.0.1", 8180);
      fn.connectFunctionsEmulator(functions, "127.0.0.1", 5101);
    }
    return { fs, db, call: (name, args) => fn.httpsCallable(functions, name)(args).then((r) => r.data) };
  });
  return shopPromise;
}

let storagePromise = null;
export function loadStorage() {
  storagePromise ||= import("firebase/storage").then((m) => {
    const storage = m.getStorage(app, `gs://${SHOP_BUCKET}`);
    if (EMULATORS) m.connectStorageEmulator(storage, "127.0.0.1", 9299);
    return { m, storage };
  });
  return storagePromise;
}
