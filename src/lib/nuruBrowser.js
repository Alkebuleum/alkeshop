// Inside the Nuru app's dApp browser, as JollofSwap does it. Nuru injects
// window.ethereum (_isNuruWallet) at document start: eth_accounts[0] is the
// active signing key, nuru_getIdentity.aaWallet the Nuru Account, and it emits
// `accountsChanged` / `nuruIdentityChanged` when either is switched in the app.
// No QR there: Nuru shows its own approval sheets. Kept free of ethers and
// Firebase so the main bundle can check it cheaply.

export const nuruInjected = () =>
  typeof window !== "undefined" && (window.ethereum?._isNuruWallet || window.ethereum?.isNuru) ? window.ethereum : null;

// The Nuru dApp browser's user agent, for when its wallet bridge didn't load.
export const inNuruApp = () =>
  !!nuruInjected() || (typeof navigator !== "undefined" && /NuruWallet\//.test(navigator.userAgent));

// Link props for Alkebuleum apps (JollofSwap, AlkeScan). Inside Nuru they open
// in this same tab: a new window leaves Nuru's dApp browser and its wallet.
export const appLink = () => (nuruInjected() ? {} : { target: "_blank", rel: "noreferrer" });

// Makes Nuru forget this site, so it isn't silently reconnected on next load.
export async function revokeNuruBrowser() {
  const eth = nuruInjected();
  if (!eth) return;
  try {
    await eth.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
  } catch { /* older Nuru builds: the local disconnect still applies */ }
}
