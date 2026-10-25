// Alkebuleum chain config and a small JSON-RPC client (from the explorer).
export const RPC_URL = "https://rpc.alkebuleum.com";
export const CHAIN_ID = 237422;
export const CHAIN_NAME = "Alkebuleum Mainnet";
export const CHAIN_CURRENCY = "ALKE";
export const EXPLORER_URL = "https://alkescan.com";

export const explorerTx = (hash) => `${EXPLORER_URL}/tx/${hash}`;

let _reqId = 1;

export async function rpc(method, params = [], { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: _reqId++, method, params }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} from RPC.`);
    const data = await res.json();
    if (data?.error) throw new Error(`RPC Error (${data.error.code ?? "unknown"}): ${data.error.message ?? "Unknown error"}.`);
    return data.result;
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`RPC timeout after ${Math.round(timeoutMs / 1000)}s.`);
    throw err;
  } finally {
    clearTimeout(t);
  }
}
