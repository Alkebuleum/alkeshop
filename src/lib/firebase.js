// Shared Alkebuleum Firebase project (also used by the explorer, JollofSwap and
// Nuru). AlkeShop only needs it for the Nuru QR handshake, so auth and the
// realtime Firestore SDK load on demand, when someone connects or signs.
import { initializeApp } from "firebase/app";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
});

let authPromise = null;
function loadAuth() {
  authPromise ||= import("firebase/auth").then((m) => ({ m, auth: m.getAuth(app) }));
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

let dbPromise = null;
export function loadRealtimeDb() {
  dbPromise ||= import("firebase/firestore").then((m) => ({ m, db: m.getFirestore(app) }));
  return dbPromise;
}
