// A small JSON-RPC client for Alkebuleum (the same calls the site makes).
const { RPC_URL } = require("./config");

let id = 1;

async function rpc(method, params = [], { timeoutMs = 10000 } = {}) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`RPC ${data.error.code}: ${data.error.message}`);
  return data.result;
}

module.exports = { rpc };
