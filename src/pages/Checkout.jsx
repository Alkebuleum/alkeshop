import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Cover, ServiceThumb } from "../components/Cards";
import { HeaderButton, Icon, LogoMark, Notice, Spinner } from "../components/ui";
import { useWallet, isNuruConn } from "../wallet/WalletProvider";
import { accountName } from "../wallet/AccountMenu";
import { useStore, paymentSubmitted, paymentFailed } from "../lib/store";
import { getProduct, getService } from "../lib/market";
import { LICENSES } from "../lib/catalog";
import { planPayment, toAlke } from "../lib/payPlan";
import { amountWei, orderCalldata } from "../lib/payments";
import { SHOP_TREASURY } from "../lib/config";
import { alke, countdown, num, timeLeft } from "../lib/format";
import NotFound from "./NotFound";

function useNow(ms = 1000) {
  const [t, setT] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setT(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return t;
}

// Where the payment will come from, refreshed so a top-up made in Nuru shows up.
function usePlan(conn, amount) {
  const [plan, setPlan] = useState(undefined); // undefined = checking, null = unknown
  useEffect(() => {
    if (!conn) { setPlan(undefined); return; }
    let live = true;
    const load = () => planPayment(conn, amountWei(amount)).then((p) => live && setPlan(p)).catch(() => live && setPlan(null));
    setPlan(undefined);
    load();
    const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, [conn, amount]);
  return plan;
}

function ItemSummary({ order, s }) {
  if (order.kind === "product") {
    const p = getProduct(s, order.itemId);
    return (
      <section aria-label="Item" className="flex gap-3.5">
        {p && <Cover product={p} className="h-[88px] w-[88px] flex-none !p-2.5 [&>p]:!text-[13px] [&>span]:hidden" />}
        <div className="flex flex-col justify-center gap-0.5">
          <p className="font-extrabold">{order.title}</p>
          <p className="text-[13px] text-mute">{order.sellerName} · {(LICENSES[order.license] || LICENSES.commercial).label} license</p>
          <p className="text-[13px] font-bold text-ok">Instant download</p>
        </div>
      </section>
    );
  }
  if (order.kind === "service") {
    const x = getService(s, order.itemId);
    return (
      <section aria-label="Item" className="flex items-center gap-3.5">
        {x && <ServiceThumb service={x} className="h-[72px] w-[72px] rounded-[14px] text-2xl" />}
        <div>
          <p className="font-extrabold">{order.title}</p>
          <p className="text-[13px] text-mute">{order.sellerName} · {order.days}-day delivery</p>
        </div>
      </section>
    );
  }
  return (
    <section aria-label="Item" className="flex items-center gap-3.5">
      <span className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-[14px] bg-peach text-night"><Icon name="sparkle" size={30} stroke={1.8} /></span>
      <div>
        <p className="font-extrabold">{num(order.credits)} Nuru Credits</p>
        <p className="text-[13px] text-mute">Added to your Nuru account when payment confirms</p>
      </div>
    </section>
  );
}

function WalletBox({ conn, plan, onChange }) {
  const name = isNuruConn(conn) ? `Nuru Wallet ${accountName(conn).startsWith("····") ? accountName(conn) : `· ${accountName(conn)}`}` : `Browser wallet ${accountName(conn)}`;
  const short = plan?.mode === "short";
  const icon = isNuruConn(conn)
    ? <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-violet"><LogoMark size={22} fg="#0B0B0F" /></span>
    : <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-raised"><Icon name="wallet" /></span>;
  return (
    <section aria-label="Paying wallet" className={`flex flex-col gap-3 rounded-[18px] border p-4 ${short ? "border-peach/40 bg-peach/5" : "border-line bg-surface"}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{name}</span>
          <span className={`block text-[13px] ${short ? "text-peach" : "text-mute"}`}>
            {plan === undefined ? "Checking balance…" : plan === null ? "Balance unavailable"
              : short ? `Balance ${toAlke(plan.account)} ALKE · ${toAlke(plan.shortBy)} ALKE short, plus fee`
                : `Balance ${toAlke(plan.account)} ALKE`}
          </span>
        </span>
        <button type="button" onClick={onChange} className="btn-text">Change</button>
      </div>
      {short && <p className="text-sm text-peach-text">{plan.gasKeyEmpty ? "Your Nuru signing key needs a little ALKE for the network fee." : "Top up your wallet, then come back."} This price stays held until the timer ends.</p>}
      {plan?.mode === "consolidate" && (
        <p className="text-sm text-peach-text">Your Nuru Account has {toAlke(plan.account)} ALKE. {toAlke(plan.topUp)} ALKE will first move from your signer key into it, then you pay. You'll approve twice.</p>
      )}
    </section>
  );
}

export default function Checkout() {
  const { orderId } = useParams();
  const s = useStore();
  const nav = useNavigate();
  const { conn, openConnect, pay } = useWallet();
  const t = useNow();
  const [ack, setAck] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const order = s.orders.find((o) => o.id === orderId);
  const plan = usePlan(conn, order?.amount);

  if (!order) return <NotFound />;
  if (order.status !== "awaiting_payment" && !busy) return <Navigate to={`/orders/${order.id}/payment`} replace />;

  const deadline = order.holdUntil || order.payBy;
  const left = deadline - t;
  const back = order.kind === "product" ? `/products/${order.itemId}` : order.kind === "credits" ? "/credits" : `/orders/${order.id}`;
  const canPay = !!SHOP_TREASURY && conn && ack && plan !== undefined && plan?.mode !== "short" && !busy;

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { hash, payer } = await pay(
        { to: SHOP_TREASURY, value: amountWei(order.amount), data: orderCalldata(order.id) },
        `Pay ${alke(order.amount)}`,
      );
      paymentSubmitted(order.id, { txHash: hash, payer });
      nav(`/orders/${order.id}/payment`, { replace: true });
    } catch (e) {
      if (e.rejected) {
        paymentFailed(order.id, "declined");
        nav(`/orders/${order.id}/payment`, { replace: true });
      } else {
        setErr(e.shortMessage || e.message || String(e));
        setBusy(false);
      }
    }
  };

  const ackText = order.kind === "product"
    ? <>I agree to the <Link to="/terms/licenses">{(LICENSES[order.license] || LICENSES.commercial).label} license</Link> and the <Link to="/terms/refunds">refund policy</Link>.</>
    : order.kind === "service" ? <>I agree to the <Link to="/terms/buyer">buyer terms</Link> and the seller's cancellation policy.</>
      : <>I understand credits can't be withdrawn or sent to another account.</>;

  return (
    <Shell footer={false}>
      <div className="mx-auto max-w-xl">
        <header className="flex h-[60px] items-center gap-1 px-2">
          <HeaderButton to={back} label="Back" />
          <h1 className="text-xl font-extrabold">Checkout</h1>
        </header>
        <main className="flex flex-col gap-5 px-5 pb-10">
          <div role="status" className={`flex items-center gap-2 rounded-[14px] px-3.5 py-3 text-sm ${left < 5 * 60000 ? "bg-peach/10 text-peach-text" : "bg-violet/10 text-violet-text"}`}>
            <Icon name="clock" size={18} />
            {order.holdUntil
              ? <span>This price is held for <strong className="font-mono">{countdown(left)}</strong></span>
              : <span>{order.sellerName.split(" ")[0]} accepted your request. Pay within <strong>{timeLeft(left)}</strong> to start.</span>}
          </div>

          <ItemSummary order={order} s={s} />

          <dl className="rows card px-4">
            <div><dt>Price</dt><dd>{alke(order.amount)}</dd></div>
            <div><dt>Network fee</dt><dd className="!font-medium text-mute">Shown in your wallet</dd></div>
            <div><dt>Pay to</dt><dd>AlkeShop</dd></div>
            <div><dt className="!font-bold !text-ink">Total</dt><dd className="!text-lg">{alke(order.amount)} <span className="text-[13px] font-medium text-mute">+ fee</span></dd></div>
          </dl>

          {!SHOP_TREASURY && (
            <Notice tone="bad" icon="alert">Payments aren't switched on for this AlkeShop yet: no treasury address is set (VITE_SHOP_TREASURY). Nothing can be charged.</Notice>
          )}

          {conn ? <WalletBox conn={conn} plan={plan} onChange={() => openConnect().catch(() => { })} /> : (
            <section aria-label="Connect a wallet" className="card flex flex-col gap-1 p-4">
              <p className="font-bold">Connect a wallet to pay</p>
              <p className="text-sm text-mute">Scan a QR code with Nuru, or open AlkeShop in the Nuru browser. Connecting never moves funds.</p>
            </section>
          )}

          <label htmlFor="ack" className="flex min-h-[44px] cursor-pointer items-start gap-3 text-[15px] text-body">
            <input type="checkbox" id="ack" className="check mt-0.5" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>{ackText}</span>
          </label>

          {err && <Notice tone="bad" icon="alert"><span role="alert">{err}</span></Notice>}

          <div className="flex flex-col gap-2.5">
            {!conn ? (
              <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary w-full">Connect Nuru Wallet</button>
            ) : plan?.mode === "short" ? (
              <Link to={`/wallet?back=${encodeURIComponent(`/checkout/${order.id}`)}${plan.shortBy > 0n ? `&need=${encodeURIComponent(toAlke(plan.shortBy))}` : ""}`} className="btn-primary w-full">Get ALKE</Link>
            ) : (
              <button type="button" onClick={submit} disabled={!canPay} className="btn-primary w-full">
                {busy && <Spinner className="h-4 w-4 border-night/30 border-t-night" />}
                {busy ? "Waiting for your wallet…" : isNuruConn(conn) ? "Pay with Nuru Wallet" : "Pay with browser wallet"}
              </button>
            )}
            <button type="button" onClick={() => openConnect({ prefer: "other" }).catch(() => { })} className="btn-text justify-center">Pay from another wallet</button>
          </div>
          <p className="flex items-center justify-center gap-2 text-[13px] text-mute"><Icon name="lock" size={16} />AlkeShop never asks for your recovery phrase.</p>
        </main>
      </div>
    </Shell>
  );
}
