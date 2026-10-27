// Signing in to AlkeShop with a wallet. The wallet signs a short message
// (no funds move); shopAuth checks it and returns a Firebase sign-in whose
// claims carry the wallet, which the database rules and shopApi trust.
import { ethers } from "ethers";
import { loadAuth, loadShop } from "./firebase";

// Keep in step with functions/src/auth.js.
export function buildMessage({ wallet, key, issuedAt }) {
  return [
    "AlkeShop sign-in",
    `Wallet: ${ethers.getAddress(wallet)}`,
    `Key: ${ethers.getAddress(key)}`,
    `Issued: ${issuedAt}`,
    "Signing proves you control this wallet. It doesn't move any funds.",
  ].join("\n");
}

// The key that signs for a connection: Nuru signs with its key, for the Nuru Account.
export const signingKeyOf = (c) => (c.type === "nuru" || c.type === "nuru-browser" ? c.signer : c.address);

// `sign(c, message, key)` asks the wallet for a personal_sign signature.
export async function signIn(c, sign) {
  const key = signingKeyOf(c);
  const issuedAt = new Date().toISOString();
  const signature = await sign(c, buildMessage({ wallet: c.address, key, issuedAt }), key);
  const { call } = await loadShop();
  const { token } = await call("shopAuth", { wallet: c.address, key, issuedAt, signature });
  const { m, auth } = await loadAuth();
  await m.signInWithCustomToken(auth, token);
}

export async function signOut() {
  const { m, auth } = await loadAuth();
  if (auth.currentUser?.uid.startsWith("shop:")) await m.signOut(auth);
}
