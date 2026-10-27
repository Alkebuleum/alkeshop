// Wallet sign-in. The site asks the wallet to sign (personal_sign) the exact
// text from buildMessage with its active key. We accept the key for the
// wallet when it IS the wallet (MetaMask and other plain accounts), or when
// the wallet is a Nuru Account whose primary() is the key or that reports
// isValidSigner(key), so linked Nuru keys work too (as in Nuru's chatAuth).
const { ethers } = require("ethers");
const { lc, AUTH_MAX_AGE_MS } = require("./config");
const { rpc } = require("./rpc");

const WALLET = new ethers.Interface([
  "function primary() view returns (address)",
  "function isValidSigner(address signer) view returns (bool)",
]);

// Keep in step with src/lib/session.js.
function buildMessage({ wallet, key, issuedAt }) {
  return [
    "AlkeShop sign-in",
    `Wallet: ${ethers.getAddress(wallet)}`,
    `Key: ${ethers.getAddress(key)}`,
    `Issued: ${issuedAt}`,
    "Signing proves you control this wallet. It doesn't move any funds.",
  ].join("\n");
}

async function call(to, fn, args = []) {
  const out = await rpc("eth_call", [{ to, data: WALLET.encodeFunctionData(fn, args) }, "latest"]);
  return WALLET.decodeFunctionResult(fn, out)[0];
}

// Is `key` allowed to sign for the Nuru Account `wallet`?
async function isKeyOfNuruAccount(wallet, key) {
  try { if (lc(await call(wallet, "primary")) === lc(key)) return true; } catch { /* not a Nuru Account */ }
  try { return (await call(wallet, "isValidSigner", [key])) === true; } catch { return false; }
}

class AuthError extends Error {}

// Returns the lower-case wallet the signature proves, or throws AuthError.
async function verifySignIn({ wallet, key, issuedAt, signature }, { now = Date.now(), isKeyOf = isKeyOfNuruAccount } = {}) {
  if (!ethers.isAddress(wallet) || !ethers.isAddress(key)) throw new AuthError("Wallet and key must be addresses.");
  if (typeof signature !== "string" || !/^0x[0-9a-fA-F]{130}$/.test(signature)) throw new AuthError("Bad signature.");
  const t = Date.parse(issuedAt);
  if (!Number.isFinite(t) || Math.abs(now - t) > AUTH_MAX_AGE_MS) throw new AuthError("This sign-in request expired. Try again.");
  let signer;
  try { signer = ethers.verifyMessage(buildMessage({ wallet, key, issuedAt }), signature); } catch { throw new AuthError("Bad signature."); }
  if (lc(signer) !== lc(key)) throw new AuthError("The signature wasn't made by this key.");
  if (lc(key) !== lc(wallet) && !(await isKeyOf(wallet, key))) throw new AuthError("This key can't sign for that wallet.");
  return lc(wallet);
}

module.exports = { buildMessage, verifySignIn, isKeyOfNuruAccount, AuthError };
