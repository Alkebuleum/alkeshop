import React, { Suspense, createContext, lazy, useCallback, useContext, useEffect, useRef, useState } from "react";
import { rpc } from "../lib/chain";
import { balanceOf, planPayment, shortMessage, toAlke } from "../lib/payPlan";

const ConnectModal = lazy(() => import("./WalletModals").then((m) => ({ default: m.ConnectModal })));
const SignModal = lazy(() => import("./WalletModals").then((m) => ({ default: m.SignModal })));

const STORAGE_KEY = "alkeshop:wallet";
const BALANCE_REFRESH_MS = 15000;
const WalletCtx = createContext(null);

const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; } };
const save = (c) => { try { c ? localStorage.setItem(STORAGE_KEY, JSON.stringify(c)) : localStorage.removeItem(STORAGE_KEY); } catch { } };

export const isNuruConn = (c) => c?.type === "nuru" || c?.type === "nuru-browser";

// rpc.alkebuleum.com fails every eth_estimateGas with "-32603 internal error",
// while eth_call and eth_createAccessList work. So we always pass our own gas
// limit (as JollofSwap and the explorer do); otherwise Nuru and MetaMask
// estimate it themselves and fail. `from` is whoever is msg.sender of the call.
async function gasFor(from, tx, value) {
  const call = { from, to: tx.to, data: tx.data || "0x", value: "0x" + value.toString(16) };
  let used = null;
  try { used = BigInt(await rpc("eth_estimateGas", [call])); } catch { }
  if (used == null) {
    try { used = BigInt((await rpc("eth_createAccessList", [call, "latest"])).gasUsed); } catch { }
  }
  if (used == null) {
    // Both failed: if the call itself reverts, say so instead of sending a doomed tx.
    try { await rpc("eth_call", [call, "latest"]); } catch (e) {
      throw new Error(`This payment would fail on chain: ${e?.message || e}`);
    }
    return 100_000n;
  }
  return (used * 13n) / 10n + 10_000n;
}

// Marks wallet "no" answers so checkout can show "Payment cancelled".
function explainSendError(e) {
  const msg = String(e?.message || e);
  if (e?.rejected || e?.code === 4001 || e?.code === "ACTION_REJECTED" || /user (rejected|denied)/i.test(msg)) {
    const r = new Error("You declined the request in your wallet.");
    r.rejected = true;
    return r;
  }
  if (/-32603|internal error/i.test(msg)) {
    return new Error(
      "The network couldn't process this payment (RPC internal error). Your ALKE didn't move. " +
      "Please try again in a moment."
    );
  }
  return e;
}

export function WalletProvider({ children }) {
  const [conn, setConn] = useState(load);
  const [connecting, setConnecting] = useState(null); // null | { prefer }
  const [signQr, setSignQr] = useState(null); // { uri, label }
  const pending = useRef(null); // { resolve, reject } for openConnect()

  // A browser-wallet session is only kept while the wallet still exposes the account.
  useEffect(() => {
    if (conn?.type !== "injected" && conn?.type !== "nuru-browser") return;
    if (!window.ethereum) { setConn(null); save(null); return; }
    window.ethereum.request({ method: "eth_accounts" }).then((accs) => {
      if (!accs?.length) { setConn(null); save(null); }
    }).catch(() => { });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow account switches / disconnects in the browser wallet.
  useEffect(() => {
    if (conn?.type !== "injected" || !window.ethereum?.on) return;
    const onAccounts = (accs) => {
      const next = accs?.[0] ? { type: "injected", address: accs[0] } : null;
      setConn(next);
      save(next);
    };
    window.ethereum.on("accountsChanged", onAccounts);
    return () => window.ethereum.removeListener?.("accountsChanged", onAccounts);
  }, [conn?.type]);

  const finishConnect = (c) => {
    setConn(c);
    save(c);
    setConnecting(null);
    pending.current?.resolve(c);
    pending.current = null;
  };

  const cancelConnect = () => {
    setConnecting(null);
    pending.current?.reject(new Error("Wallet connection cancelled."));
    pending.current = null;
  };

  // Opens the connect dialog; resolves with the connection. `prefer: "other"`
  // opens it on the browser-wallet choice ("Pay from another wallet").
  const openConnect = useCallback((opts = {}) => {
    setConnecting({ prefer: opts.prefer || "nuru" });
    return new Promise((resolve, reject) => { pending.current = { resolve, reject }; });
  }, []);

  const ensureConnected = useCallback(() => (conn ? Promise.resolve(conn) : openConnect()), [conn, openConnect]);

  const disconnect = useCallback(() => { setConn(null); save(null); }, []);

  // The connected account's ALKE, in wei, kept fresh for the header, wallet
  // page and account menu. `signer` is the Nuru signing key, which holds ALKE
  // for network fees; null for other wallets. A failed check keeps the last
  // known figures and sets `error`.
  const [balance, setBalance] = useState(null); // null | { account, signer, at, error }
  const connRef = useRef(conn);
  connRef.current = conn;
  const refreshBalance = useCallback(async () => {
    if (!conn) return;
    const current = () => connRef.current === conn; // drop answers for a wallet since switched
    const signerAddr = conn.signer && conn.signer.toLowerCase() !== conn.address.toLowerCase() ? conn.signer : null;
    try {
      const [account, signer] = await Promise.all([balanceOf(conn.address), signerAddr ? balanceOf(signerAddr) : null]);
      if (current()) setBalance({ account, signer, at: Date.now(), error: false });
    } catch {
      if (current()) setBalance((b) => ({ account: null, signer: null, at: null, ...b, error: true }));
    }
  }, [conn]);
  useEffect(() => {
    setBalance(null);
    if (!conn) return;
    refreshBalance();
    const t = setInterval(() => document.visibilityState === "visible" && refreshBalance(), BALANCE_REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && refreshBalance();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [conn, refreshBalance]);

  // Sends straight from the Nuru signer key (Nuru doesn't wrap it), so the key
  // is msg.sender and pays both the value and the gas. Waits until mined.
  const sendFromSigner = async (c, tx, value, label) => {
    const gas = await gasFor(c.signer, tx, value);
    if (c.type === "nuru") {
      try {
        const { nuruSendFromSigner } = await import("../lib/nuru");
        return await nuruSendFromSigner(c, { ...tx, value, gas }, (uri) => setSignQr({ uri, label }));
      } finally {
        setSignQr(null);
      }
    }
    // In the Nuru browser, `from` = the signer is how a dApp asks for a direct send.
    const hash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from: c.signer, to: tx.to, data: tx.data || "0x", value: "0x" + value.toString(16), gas: "0x" + gas.toString(16) }],
    });
    const { waitForReceipt } = await import("../lib/nuru");
    await waitForReceipt(hash);
    return hash;
  };

  // Submits {to, data, value}; resolves with the tx hash once the wallet has
  // sent it (not mined: the payment screen watches it confirm).
  const send = async (c, tx, value, label) => {
    if (c.type === "nuru") {
      try {
        const { nuruSendTransaction } = await import("../lib/nuru");
        const gas = await gasFor(c.address, tx, value);
        return await nuruSendTransaction(c, { ...tx, value, gas }, (uri) => setSignQr({ uri, label }));
      } finally {
        setSignQr(null);
      }
    }
    if (c.type === "nuru-browser") {
      // The Nuru browser wraps the call through the Nuru Account itself (adding
      // its own execute() overhead to our gas), so the Nuru Account is msg.sender.
      const gas = await gasFor(c.address, tx, value);
      return window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ to: tx.to, data: tx.data || "0x", value: "0x" + value.toString(16), gas: "0x" + gas.toString(16) }],
      });
    }
    const { getSigner } = await import("../lib/wallet");
    const signer = await getSigner();
    const gasLimit = await gasFor(c.address, tx, value);
    return (await signer.sendTransaction({ to: tx.to, data: tx.data || "0x", value, gasLimit })).hash;
  };

  // Pays {to, data, value(wei)} from the connected wallet, moving ALKE from the
  // Nuru signer key into the Nuru Account first if that's what it takes.
  const pay = useCallback(async (tx, label = "Approve payment") => {
    const c = await ensureConnected();
    const value = BigInt(tx.value || 0);
    const plan = await planPayment(c, value).catch(() => null);
    if (plan?.mode === "short") throw new Error(shortMessage(plan));
    try {
      if (plan?.mode === "consolidate") {
        await sendFromSigner(c, { to: c.address }, plan.topUp, `Move ${toAlke(plan.topUp)} ALKE into your Nuru Account`);
      }
      const hash = await send(c, tx, value, label);
      refreshBalance();
      return { hash, payer: c.address };
    } catch (e) {
      throw explainSendError(e);
    }
  }, [ensureConnected, refreshBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WalletCtx.Provider value={{ conn, openConnect, ensureConnected, disconnect, pay, balance, refreshBalance }}>
      {children}
      <Suspense fallback={null}>
        {connecting && <ConnectModal prefer={connecting.prefer} onConnected={finishConnect} onClose={cancelConnect} />}
        {signQr && <SignModal uri={signQr.uri} label={signQr.label} />}
      </Suspense>
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
