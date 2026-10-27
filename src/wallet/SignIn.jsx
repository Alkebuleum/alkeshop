// Pages with private data (orders, library, seller center, admin) need the
// connected wallet signed in to AlkeShop. withSignIn wraps such a page: it
// asks for the one-time signature, waits for that wallet's data, then renders.
import React, { useState } from "react";
import Shell from "../components/Shell";
import { EmptyState, Loading } from "../components/ui";
import { useWallet } from "./WalletProvider";
import { useStore, signedInAs } from "../lib/store";

export function SignInPrompt({ what }) {
  const { conn, signIn } = useWallet();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const go = async () => {
    setBusy(true);
    setErr(null);
    try { await signIn(conn); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <EmptyState icon="lock" title="Sign in with your wallet"
      action={<button type="button" onClick={go} disabled={busy} className="btn-primary btn-sm">{busy ? "Waiting for your wallet…" : "Sign in"}</button>}>
      Approve a one-time sign-in in your wallet to see {what}. It proves the wallet is yours and doesn't move any funds.
      {err && <span role="alert" className="mt-2 block text-bad">{err}</span>}
    </EmptyState>
  );
}

// `connect`: the page needs a wallet (otherwise it shows its own connect state).
export function withSignIn(Page, { what, connect = false }) {
  return function SignedIn(props) {
    const s = useStore();
    const { conn, openConnect } = useWallet();
    const frame = (body) => <Shell tab="none">{body}</Shell>;
    if (!conn) {
      return connect ? frame(
        <EmptyState icon="lock" title="Connect your wallet" action={<button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect Nuru Wallet</button>}>
          Connect the wallet you used to see {what}.
        </EmptyState>,
      ) : <Page {...props} />;
    }
    if (!s.authReady) return frame(<Loading />);
    if (!signedInAs(s, conn)) return frame(<SignInPrompt what={what} />);
    if (!s.privateReady) return frame(<Loading />);
    return <Page {...props} />;
  };
}
