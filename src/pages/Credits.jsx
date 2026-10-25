import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { Icon, Sheet } from "../components/ui";
import { useWallet } from "../wallet/WalletProvider";
import { useStore, startCheckout, ordersOf } from "../lib/store";
import { CREDIT_PACKAGES, CREDIT_USES } from "../lib/catalog";
import { alke, date, num } from "../lib/format";

export default function Credits() {
  const s = useStore();
  const nav = useNavigate();
  const { conn, ensureConnected, openConnect } = useWallet();
  const [pick, setPick] = useState("standard");
  const [history, setHistory] = useState(false);
  const pkg = CREDIT_PACKAGES.find((p) => p.id === pick);
  const balance = conn ? s.credits[conn.address.toLowerCase()] || 0 : null;
  const purchases = conn ? ordersOf(s, conn.address).filter((o) => o.kind === "credits" && o.status === "completed") : [];

  const buy = async (e) => {
    e.preventDefault();
    try {
      const c = await ensureConnected();
      nav(`/checkout/${startCheckout({ kind: "credits", item: { ...pkg, title: `${num(pkg.credits)} credits` }, buyer: c.address })}`);
    } catch { }
  };

  return (
    <Shell tab="credits">
      <PageHeader title="Nuru Credits" />
      <Page className="flex flex-col gap-6 pb-6 pt-1 md:grid md:grid-cols-[1fr_1fr] md:items-start md:gap-10">
        <div className="flex flex-col gap-6">
          <section aria-label="Balance" className="flex flex-col gap-1 rounded-[22px] border border-violet-edge bg-surface p-5">
            <p className="text-sm font-semibold text-mute">Your balance</p>
            {balance === null ? (
              <>
                <p className="text-[15px] text-body">Connect your Nuru Wallet to see your credits.</p>
                <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm mt-2 self-start">Connect Nuru Wallet</button>
              </>
            ) : (
              <>
                <p><span className="text-[40px] font-extrabold tracking-[-0.03em]">{num(balance)}</span><span className="text-lg font-bold text-mute"> credits</span></p>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-mute">Bought through AlkeShop</span>
                  <button type="button" onClick={() => setHistory(true)} className="btn-text">Usage history</button>
                </div>
              </>
            )}
          </section>
          <section aria-labelledby="uses-h" className="flex flex-col gap-3">
            <h2 id="uses-h" className="h-section">What credits power</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {CREDIT_USES.map((u) => <div key={u} className="card flex items-center gap-2 p-3.5 text-sm font-bold"><Icon name="sparkle" size={18} className="text-peach" />{u}</div>)}
            </div>
            <p className="text-[13px] text-mute">Nuru shows how many credits a feature uses before you use it.</p>
          </section>
        </div>

        {s.settings.creditsEnabled ? (
          <form aria-labelledby="pkg-h" onSubmit={buy} className="flex flex-col gap-3">
            <h2 id="pkg-h" className="h-section">Choose a package</h2>
            {CREDIT_PACKAGES.map((p) => (
              <label key={p.id} htmlFor={`pkg-${p.id}`}
                className={`flex min-h-[72px] cursor-pointer items-center gap-3 rounded-[18px] border bg-surface p-4 ${pick === p.id ? "border-violet" : "border-line"}`}>
                <input type="radio" id={`pkg-${p.id}`} name="pkg" checked={pick === p.id} onChange={() => setPick(p.id)} className="check" />
                <span className="flex-1">
                  <span className="block font-extrabold">{num(p.credits)} credits {p.best && <span className="ml-1 rounded-full bg-peach px-2 py-0.5 text-[11px] font-extrabold text-night">Best value</span>}</span>
                  <span className="block text-[13px] text-mute">{p.name} · expires 12 months after purchase</span>
                </span>
                <span className="font-extrabold">{alke(p.price)}</span>
              </label>
            ))}
            <p className="text-[13px] leading-relaxed text-mute">Credits are prepaid units for Nuru services. They are not a coin, cannot be withdrawn and cannot be sent to another account.</p>
            <button type="submit" className="btn-primary w-full">Buy {num(pkg.credits)} credits · {alke(pkg.price)}</button>
          </form>
        ) : (
          <section aria-labelledby="off-h" className="card flex flex-col gap-1 p-5">
            <h2 id="off-h" className="font-extrabold">Credit packages aren't available in this app</h2>
            <p className="text-[15px] text-mute">Your balance and usage still show here.</p>
          </section>
        )}
      </Page>

      {history && (
        <Sheet title="Usage history" onClose={() => setHistory(false)}>
          {purchases.length ? (
            <dl className="rows">
              {purchases.map((o) => <div key={o.id}><dt>{date(o.paidAt)} · {o.id}</dt><dd className="text-ok">+{num(o.credits)}</dd></div>)}
            </dl>
          ) : <p className="text-[15px] text-mute">No credit purchases yet.</p>}
          <p className="mt-4 text-[13px] text-mute">Credits you spend show in Nuru.</p>
        </Sheet>
      )}
    </Shell>
  );
}
