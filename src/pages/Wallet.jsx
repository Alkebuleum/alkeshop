// The buyer's ALKE: live balance, their address to receive on, and where to
// get more (JollofSwap). Checkout links here when a wallet is short.
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Shell, { PageHeader, Page } from "../components/Shell";
import { CopyButton, Icon, Notice } from "../components/ui";
import { useWallet, isNuruConn } from "../wallet/WalletProvider";
import { toAlke, totalOf } from "../lib/payPlan";
import { explorerAddress } from "../lib/chain";
import { GET_ALKE_URL, P2P_URL } from "../lib/config";
import { time } from "../lib/format";
import { nuruInjected } from "../lib/nuruBrowser";

function Balance() {
  const { conn, openConnect, balance, refreshBalance } = useWallet();
  if (!conn) {
    return (
      <section aria-label="Balance" className="flex flex-col gap-1 rounded-[22px] border border-violet-edge bg-surface p-5">
        <p className="text-sm font-semibold text-mute">Your ALKE</p>
        <p className="text-[15px] text-body">Connect your wallet to see your balance.</p>
        <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm mt-2 self-start">Connect Nuru Wallet</button>
      </section>
    );
  }
  const total = totalOf(balance);
  const split = isNuruConn(conn) && balance?.signer != null;
  return (
    <section aria-label="Balance" className="flex flex-col gap-1 rounded-[22px] border border-violet-edge bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-mute">Your ALKE</p>
        <button type="button" onClick={refreshBalance} aria-label="Refresh balance" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mute hover:bg-raised hover:text-ink">
          <Icon name="revise" size={16} />
        </button>
      </div>
      <p aria-live="polite">
        {total == null
          ? <span className="text-[15px] text-body">{balance?.error ? "Balance unavailable" : "Checking balance…"}</span>
          : <><span className="text-[40px] font-extrabold tracking-[-0.03em]">{toAlke(total)}</span><span className="text-lg font-bold text-mute"> ALKE</span></>}
      </p>
      {split && (
        <dl className="rows mt-1 text-sm">
          <div><dt>Nuru Account</dt><dd>{toAlke(balance.account)} ALKE</dd></div>
          <div><dt>Signing key, for network fees</dt><dd>{toAlke(balance.signer)} ALKE</dd></div>
        </dl>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className={balance?.error ? "text-peach" : "text-mute"}>
          {balance?.error ? (total == null ? "Couldn't reach the Alkebuleum network." : "Couldn't refresh. Showing the last balance.") : balance?.at ? `Updated ${time(balance.at)}` : ""}
        </span>
        <a href={explorerAddress(conn.address)} target="_blank" rel="noreferrer" className="btn-text">Activity on AlkeScan<Icon name="external" size={14} /></a>
      </div>
    </section>
  );
}

// Inside Nuru, JollofSwap opens in this same tab: a new window would leave
// Nuru's dApp browser (and its wallet), so JollofSwap couldn't connect.
function Way({ icon, title, children, href, cta }) {
  const tab = nuruInjected() ? {} : { target: "_blank", rel: "noreferrer" };
  return (
    <section className="card flex flex-col gap-2 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-raised text-violet-text"><Icon name={icon} /></span>
        <h3 className="font-extrabold">{title}</h3>
      </div>
      <p className="text-[15px] leading-normal text-body">{children}</p>
      {href && <a href={href} {...tab} className="btn-secondary btn-sm mt-1 self-start">{cta}<Icon name="external" size={16} /></a>}
    </section>
  );
}

function Receive() {
  const { conn } = useWallet();
  if (!conn) return null;
  return (
    <section aria-labelledby="recv-h" className="card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-raised text-violet-text"><Icon name="download" /></span>
        <h3 id="recv-h" className="font-extrabold">Receive ALKE</h3>
      </div>
      <p className="text-[15px] leading-normal text-body">
        Anyone can send ALKE to this address on the Alkebuleum network{isNuruConn(conn) ? ". It's your Nuru Account" : ""}.
      </p>
      <div className="self-center rounded-2xl bg-white p-3"><QRCodeSVG value={conn.address} size={168} bgColor="#ffffff" fgColor="#0B0B0F" level="M" /></div>
      <div className="flex items-center gap-1 rounded-xl bg-raised px-3 py-2">
        <span className="min-w-0 flex-1 break-all font-mono text-[13px]">{conn.address}</span>
        <CopyButton value={conn.address} label="Copy wallet address" />
      </div>
    </section>
  );
}

export default function Wallet() {
  const [sp] = useSearchParams();
  // Checkout sends buyers here when they're short; offer the way back.
  const back = /^\/(checkout|orders)\//.test(sp.get("back") || "") ? sp.get("back") : null;
  const need = sp.get("need");

  return (
    <Shell tab="wallet">
      <PageHeader title="Wallet" back={back || undefined} />
      <Page className="flex flex-col gap-6 pb-6 pt-1 md:grid md:grid-cols-[1fr_1fr] md:items-start md:gap-10">
        <div className="flex flex-col gap-6">
          {back && (
            <Notice tone="peach" icon="info">
              <span className="flex flex-col gap-2">
                <span>{need ? `Your order needs about ${need} more ALKE, plus a little for the network fee.` : "Your order needs more ALKE."} Once it shows in your balance, go back to finish paying. The price stays held until the timer ends.</span>
                <Link to={back} className="font-bold">Back to checkout</Link>
              </span>
            </Notice>
          )}
          <Balance />
          <Receive />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="h-section">Get ALKE</h2>
          <Way icon="coins" title="Swap on JollofSwap" href={GET_ALKE_URL} cta="Open JollofSwap">
            Have USDC or MAH? Swap it for ALKE on JollofSwap, the Alkebuleum exchange. Connect the same wallet there and the ALKE shows up here.
          </Way>
          <Way icon="user" title="No crypto yet?" href={P2P_URL} cta="Open JollofSwap P2P">
            Buy MAH from other people with your local currency on JollofSwap P2P, then swap the MAH for ALKE.
          </Way>
          <p className="text-[13px] leading-relaxed text-mute">JollofSwap is a separate service. Check the rate and fees there before you swap. AlkeShop never asks for your recovery phrase.</p>
        </div>
      </Page>
    </Shell>
  );
}
