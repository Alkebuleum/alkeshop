// Checking an order's payment on Alkebuleum.
//
// Each payment is an ALKE transfer to the treasury whose calldata is
// "alkeshop:<order id>". It arrives one of three ways:
//   direct   — a plain transfer: tx.to is the treasury
//   execute  — from a Nuru Account's primary key: execute(treasury, value, data)
//   relayed  — from a linked Nuru key, submitted by relay.alkebuleum.com: the
//              call can't be decoded from outside, so we require the order tag
//              in the calldata and the tx to target the buyer's Nuru Account,
//              then read the amount from the treasury's balance change in
//              that block. When the node no longer has that block's state the
//              payment is accepted but flagged for reconciliation.
const { ethers } = require("ethers");
const { lc } = require("./config");

const WEI = 10n ** 18n;
const orderCalldata = (orderId) => ethers.hexlify(ethers.toUtf8Bytes(`alkeshop:${orderId}`));
const amountWei = (alke) => BigInt(Math.round(alke * 1000)) * (WEI / 1000n);
const toAlke = (wei) => Number(wei / 10n ** 15n) / 1000;

const EXECUTE = new ethers.Interface(["function execute(address target, uint256 value, bytes data)"]);

// { how, value, tagged } when the transaction says what it sends; null when it can't be read.
function readTransfer(tx, orderId, treasury) {
  const tag = lc(orderCalldata(orderId));
  if (lc(tx.to) === treasury) return { how: "direct", value: BigInt(tx.value), tagged: lc(tx.input) === tag };
  try {
    const [target, value, data] = EXECUTE.decodeFunctionData("execute", tx.input);
    if (lc(target) === treasury) return { how: "execute", value: BigInt(value), tagged: lc(data) === tag };
  } catch { /* not execute() */ }
  return null;
}

// One look at a submitted payment. Resolves with
//   { stage: "sent" | "seen" } | { stage: "confirming", confirmations }
//   { stage: "confirmed", blockNumber, verified, how }
//   { stage: "failed", reason } | { stage: "underpaid", received }
async function checkPayment(order, { rpc, treasury, minConfs, now = Date.now(), droppedAfterMs }) {
  const { txHash, submittedAt } = order.payment;
  const tx = await rpc("eth_getTransactionByHash", [txHash]);
  if (!tx) return now - submittedAt > droppedAfterMs ? { stage: "failed", reason: "dropped" } : { stage: "sent" };
  if (!tx.blockNumber) return { stage: "seen" };
  const receipt = await rpc("eth_getTransactionReceipt", [txHash]);
  if (!receipt) return { stage: "seen" };
  if (parseInt(receipt.status, 16) !== 1) return { stage: "failed", reason: "reverted" };

  const blockNumber = parseInt(receipt.blockNumber, 16);
  const confirmations = parseInt(await rpc("eth_blockNumber"), 16) - blockNumber + 1;
  if (confirmations < minConfs) return { stage: "confirming", confirmations };

  const due = amountWei(order.amount);
  const read = readTransfer(tx, order.id, treasury);
  if (read) {
    if (!read.tagged) return { stage: "failed", reason: "not-for-this-order" };
    if (read.value < due) return { stage: "underpaid", received: toAlke(read.value) };
    return { stage: "confirmed", blockNumber, verified: true, how: read.how };
  }

  // Relayed through the buyer's Nuru Account.
  const tagHex = lc(orderCalldata(order.id)).slice(2);
  if (lc(tx.to) !== lc(order.buyer) || !lc(tx.input).includes(tagHex)) return { stage: "failed", reason: "not-for-this-order" };
  const [after, before] = await Promise.all([
    rpc("eth_getBalance", [treasury, "0x" + blockNumber.toString(16)]).catch(() => null),
    rpc("eth_getBalance", [treasury, "0x" + (blockNumber - 1).toString(16)]).catch(() => null),
  ]);
  const verified = after != null && before != null && BigInt(after) - BigInt(before) >= due;
  return { stage: "confirmed", blockNumber, verified, how: "relayed" };
}

module.exports = { orderCalldata, amountWei, toAlke, readTransfer, checkPayment };
