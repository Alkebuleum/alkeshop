// Where a wallet payment's ALKE comes from. Pure (no React) so the wallet
// provider and checkout can share it, and it can be unit-tested.
import { rpc } from "./chain";

export const WEI = 10n ** 18n;
export const toAlke = (wei) => (Number(wei / 10n ** 15n) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 });
export const balanceOf = async (addr) => BigInt(await rpc("eth_getBalance", [addr, "latest"]));
// All the ALKE a connection holds (Nuru Account plus signing key); null while unknown.
export const totalOf = (b) => (b?.account == null ? null : b.account + (b.signer ?? 0n));
const PRIMARY_SELECTOR = "0xc6dbdf61"; // primary()
const primaryOf = (addr) => rpc("eth_call", [{ to: addr, data: PRIMARY_SELECTOR }, "latest"]).catch(() => null);

// ALKE the signer key keeps for gas when it tops up the Nuru Account.
export const SIGNER_GAS_BUFFER = 5n * 10n ** 16n; // 0.05 ALKE

// Decides where a payment of `value` comes from. For a Nuru connection, in order:
//   account     — the Nuru Account covers it
//   consolidate — move the shortfall from the signer into the Nuru Account, then pay
//   short       — even together they can't cover it (`shortBy` says by how much)
// Other wallets have one account: "wallet" or "short". Null when we can't tell
// (a Nuru session without its Nuru Account address). `deps` is for tests.
export async function planPayment(c, value, { getBalance = balanceOf, getPrimary = primaryOf } = {}) {
  const isNuru = c.type === "nuru" || c.type === "nuru-browser";
  if (!isNuru) {
    const balance = await getBalance(c.address);
    return { isNuru, mode: balance >= value ? "wallet" : "short", account: balance, value, shortBy: value > balance ? value - balance : 0n };
  }
  if (!c.signer || c.address.toLowerCase() === c.signer.toLowerCase()) return null;
  const [account, signer, primary] = await Promise.all([getBalance(c.address), getBalance(c.signer), getPrimary(c.address)]);
  // The primary key pays gas for execute(); linked keys go through the gasless relay.
  const isPrimary = !!primary && primary.length >= 66 && ("0x" + primary.slice(-40)).toLowerCase() === c.signer.toLowerCase();
  const plan = { isNuru, account, signer, value, topUp: 0n, shortBy: 0n, gasKeyEmpty: isPrimary && signer === 0n };
  if (account >= value && !plan.gasKeyEmpty) return { ...plan, mode: "account" };
  const topUp = value > account ? value - account : 0n;
  if (topUp > 0n && signer >= topUp + SIGNER_GAS_BUFFER) return { ...plan, mode: "consolidate", topUp };
  const spendable = account + (signer > SIGNER_GAS_BUFFER ? signer - SIGNER_GAS_BUFFER : 0n);
  return { ...plan, mode: "short", shortBy: value > spendable ? value - spendable : 0n };
}

export function shortMessage(p) {
  if (!p.isNuru) return `Your wallet holds ${toAlke(p.account)} ALKE, but this payment needs ${toAlke(p.value)} ALKE plus a little for the network fee.`;
  if (p.account >= p.value && p.gasKeyEmpty) return "Your Nuru signing key has no ALKE for the network fee. Send it a small amount of ALKE and try again.";
  return `Not enough ALKE: your Nuru Account holds ${toAlke(p.account)} and your signer key ${toAlke(p.signer)}, but this payment needs ${toAlke(p.value)}.`;
}
