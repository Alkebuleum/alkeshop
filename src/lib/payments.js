// Watching an order's payment on Alkebuleum.
//
// Each payment is a plain ALKE transfer to SHOP_TREASURY whose calldata is
// "alkeshop:<order id>", so the treasury's history can be matched to orders.
// From a Nuru Account the transfer is an execute(treasury, value, data) call
// (or a relayed call) on the account, so `tx.to` is the account, not us.
import { ethers } from "ethers";
import { rpc } from "./chain";
import { SHOP_TREASURY, MIN_CONFS } from "./config";
import { WEI } from "./payPlan";

export const orderCalldata = (orderId) => ethers.hexlify(ethers.toUtf8Bytes(`alkeshop:${orderId}`));
export const amountWei = (alke) => BigInt(Math.round(alke * 1000)) * (WEI / 1000n);

const EXECUTE = new ethers.Interface(["function execute(address target, uint256 value, bytes data)"]);
const lc = (a) => (a || "").toLowerCase();

// What the transaction says it sends to the treasury, when we can read it.
// Null means "can't tell from the outside" (a relayed call); the receipt
// status is then all we check, and the order is flagged for reconciliation.
export function paidByTx(tx, orderId) {
  const treasury = lc(SHOP_TREASURY);
  if (lc(tx.to) === treasury) {
    return { value: BigInt(tx.value), tagged: lc(tx.input) === lc(orderCalldata(orderId)) };
  }
  try {
    const [target, value, data] = EXECUTE.decodeFunctionData("execute", tx.input);
    if (lc(target) === treasury) return { value: BigInt(value), tagged: lc(data) === lc(orderCalldata(orderId)) };
  } catch { }
  return null;
}

// One look at a submitted payment. Resolves with
//   { stage: "sent" | "seen" | "confirming", confirmations }
//   { stage: "confirmed", blockNumber, verified }
//   { stage: "failed" } | { stage: "underpaid", received }
export async function checkPayment(order) {
  const { txHash } = order.payment;
  const tx = await rpc("eth_getTransactionByHash", [txHash]);
  if (!tx) return { stage: "sent" };
  if (!tx.blockNumber) return { stage: "seen" };
  const receipt = await rpc("eth_getTransactionReceipt", [txHash]);
  if (!receipt) return { stage: "seen" };
  if (parseInt(receipt.status, 16) !== 1) return { stage: "failed" };

  const paid = paidByTx(tx, order.id);
  if (paid && paid.value < amountWei(order.amount)) {
    return { stage: "underpaid", received: Number(paid.value / 10n ** 15n) / 1000 };
  }
  const blockNumber = parseInt(receipt.blockNumber, 16);
  const head = parseInt(await rpc("eth_blockNumber"), 16);
  const confirmations = head - blockNumber + 1;
  if (confirmations < MIN_CONFS) return { stage: "confirming", confirmations };
  return { stage: "confirmed", blockNumber, verified: !!paid };
}
