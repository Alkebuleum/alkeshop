const test = require("node:test");
const assert = require("node:assert");
const { ethers } = require("ethers");
const { checkPayment, orderCalldata, amountWei } = require("../src/payments");

const TREASURY = "0x00000000000000000000000000000000000000aa";
const BUYER = "0x00000000000000000000000000000000000000b1";
const EXECUTE = new ethers.Interface(["function execute(address target, uint256 value, bytes data)"]);
const hex = (n) => "0x" + BigInt(n).toString(16);
const order = { id: "AS-1", amount: 100, buyer: BUYER, payment: { txHash: "0x" + "ab".repeat(32), submittedAt: 0 } };
const opts = (rpc) => ({ rpc, treasury: TREASURY, minConfs: 2, now: 1000, droppedAfterMs: 60_000 });

function chain({ tx, status = 1, head = 12, balances = {} }) {
  return async (method, params) => {
    if (method === "eth_getTransactionByHash") return tx;
    if (method === "eth_getTransactionReceipt") return tx?.blockNumber ? { status: hex(status), blockNumber: tx.blockNumber } : null;
    if (method === "eth_blockNumber") return hex(head);
    if (method === "eth_getBalance") return balances[params[1]] ?? null;
    throw new Error(method);
  };
}

test("a tagged direct transfer for the full amount confirms", async () => {
  const tx = { to: TREASURY, value: hex(amountWei(100)), input: orderCalldata("AS-1"), blockNumber: hex(10) };
  assert.deepEqual(await checkPayment(order, opts(chain({ tx }))), { stage: "confirmed", blockNumber: 10, verified: true, how: "direct" });
});

test("waits for enough confirmations", async () => {
  const tx = { to: TREASURY, value: hex(amountWei(100)), input: orderCalldata("AS-1"), blockNumber: hex(12) };
  assert.deepEqual(await checkPayment(order, opts(chain({ tx }))), { stage: "confirming", confirmations: 1 });
});

test("a short payment is underpaid", async () => {
  const tx = { to: TREASURY, value: hex(amountWei(40)), input: orderCalldata("AS-1"), blockNumber: hex(10) };
  assert.deepEqual(await checkPayment(order, opts(chain({ tx }))), { stage: "underpaid", received: 40 });
});

test("a transfer tagged for another order doesn't count", async () => {
  const tx = { to: TREASURY, value: hex(amountWei(100)), input: orderCalldata("AS-2"), blockNumber: hex(10) };
  assert.equal((await checkPayment(order, opts(chain({ tx })))).stage, "failed");
});

test("execute() from a Nuru Account is decoded", async () => {
  const input = EXECUTE.encodeFunctionData("execute", [TREASURY, amountWei(100), orderCalldata("AS-1")]);
  const tx = { to: BUYER, value: "0x0", input, blockNumber: hex(10) };
  assert.equal((await checkPayment(order, opts(chain({ tx })))).how, "execute");
});

test("a relayed call is checked by the treasury's balance change", async () => {
  const input = "0xdeadbeef" + orderCalldata("AS-1").slice(2) + "00".repeat(8);
  const tx = { to: BUYER, value: "0x0", input, blockNumber: hex(10) };
  const ok = await checkPayment(order, opts(chain({ tx, balances: { [hex(9)]: hex(5n), [hex(10)]: hex(5n + amountWei(100)) } })));
  assert.deepEqual(ok, { stage: "confirmed", blockNumber: 10, verified: true, how: "relayed" });
  const unknown = await checkPayment(order, opts(chain({ tx })));
  assert.equal(unknown.verified, false);
  const elsewhere = await checkPayment(order, opts(chain({ tx: { ...tx, to: TREASURY.replace("aa", "cc") } })));
  assert.equal(elsewhere.stage, "failed");
});

test("a reverted payment fails, and one never seen is dropped after a while", async () => {
  const tx = { to: TREASURY, value: hex(amountWei(100)), input: orderCalldata("AS-1"), blockNumber: hex(10) };
  assert.equal((await checkPayment(order, opts(chain({ tx, status: 0 })))).stage, "failed");
  assert.equal((await checkPayment(order, opts(chain({ tx: null })))).stage, "sent");
  assert.equal((await checkPayment(order, { ...opts(chain({ tx: null })), now: 120_000 })).stage, "failed");
});
