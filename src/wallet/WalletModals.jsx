// Wallet dialogs (connect + Nuru approval QR). Split out of WalletProvider so
// the QR, Nuru and ethers code only load when someone actually connects.
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Icon, LogoMark, Sheet, Spinner } from "../components/ui";
import { connectWallet, hasWallet } from "../lib/wallet";
import { nuruConnect, nuruInjected, nuruBrowserConnect, NURU_PLAY_STORE } from "../lib/nuru";

function QrBox({ uri }) {
  return (
    <a href={uri} aria-label="Open in Nuru" className="mx-auto block w-fit rounded-[18px] bg-white p-3">
      <QRCodeSVG value={uri} size={208} bgColor="#ffffff" fgColor="#0B0B0F" level="M" />
    </a>
  );
}

function Choice({ icon, title, sub, busy, disabled, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex min-h-[64px] w-full items-center gap-3 rounded-[18px] border border-line-2 bg-night p-3 text-left transition-colors hover:border-violet disabled:opacity-40">
      {icon}
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-[13px] text-mute">{sub}</span>
      </span>
      {busy && <Spinner />}
    </button>
  );
}

export function ConnectModal({ prefer = "nuru", onConnected, onClose }) {
  const [uri, setUri] = useState(null);
  const [busy, setBusy] = useState(null); // "nuru" | "injected"
  const [err, setErr] = useState(null);
  const inNuru = !!nuruInjected();

  const run = async (kind, fn) => {
    setErr(null);
    setBusy(kind);
    try {
      onConnected(await fn());
    } catch (e) {
      setErr(e.shortMessage || e.message || String(e));
      setUri(null);
    } finally {
      setBusy(null);
    }
  };

  const nuruIcon = <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet"><LogoMark size={24} fg="#0B0B0F" /></span>;
  const otherIcon = <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-body"><Icon name="wallet" /></span>;

  return (
    <Sheet title={uri ? "Scan with Nuru" : "Connect a wallet"} subtitle={uri ? null : "Pay and get paid in ALKE on Alkebuleum"} onClose={onClose}>
      {inNuru ? (
        <div className="space-y-3">
          <p className="text-sm text-mute">You're in the Nuru browser. Approve the connection in Nuru.</p>
          <button type="button" onClick={() => run("nuru", nuruBrowserConnect)} disabled={!!busy} className="btn-primary w-full">
            {busy && <Spinner className="h-4 w-4 border-night/30 border-t-night" />}Connect Nuru Wallet
          </button>
        </div>
      ) : uri ? (
        <div className="space-y-4 text-center">
          <QrBox uri={uri} />
          <p className="text-[15px] text-body">Open <strong className="text-ink">Nuru</strong> on your phone, tap scan, then approve.</p>
          <p className="flex items-center justify-center gap-2 text-[13px] text-mute"><Spinner className="h-3 w-3" />Waiting for Nuru…</p>
          <p className="text-[13px] text-mute">Connecting only shares your Nuru Account address. It never moves funds.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {prefer === "other" ? null : (
            <Choice icon={nuruIcon} title="Nuru Wallet" sub="Scan a QR code with the Nuru app" busy={busy === "nuru"} disabled={!!busy}
              onClick={() => run("nuru", () => nuruConnect(setUri))} />
          )}
          <Choice icon={otherIcon} title="Browser wallet" sub={hasWallet() ? "MetaMask or another installed wallet" : "None found in this browser"}
            busy={busy === "injected"} disabled={!!busy || !hasWallet()}
            onClick={() => run("injected", async () => ({ type: "injected", address: await connectWallet() }))} />
          {prefer === "other" && (
            <Choice icon={nuruIcon} title="Nuru Wallet" sub="Scan a QR code with the Nuru app" busy={busy === "nuru"} disabled={!!busy}
              onClick={() => run("nuru", () => nuruConnect(setUri))} />
          )}
          <p className="pt-2 text-center text-[13px] text-mute">
            No Nuru yet? <a href={NURU_PLAY_STORE} target="_blank" rel="noreferrer">Get it on Google Play</a>
          </p>
        </div>
      )}
      {err && <p role="alert" className="mt-3 text-sm text-bad">{err}</p>}
    </Sheet>
  );
}

export function SignModal({ uri, label }) {
  return (
    <Sheet title={label} subtitle="Scan with Nuru to approve">
      <div className="space-y-4 text-center">
        <QrBox uri={uri} />
        <p className="flex items-center justify-center gap-2 text-[13px] text-mute"><Spinner className="h-3 w-3" />Waiting for approval in Nuru…</p>
        <p className="text-[13px] text-mute">Check the amount and the network fee in Nuru before you approve.</p>
      </div>
    </Sheet>
  );
}
