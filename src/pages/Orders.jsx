import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell, { Page } from "../components/Shell";
import { EmptyState, HeaderButton, Pill } from "../components/ui";
import { useWallet } from "../wallet/WalletProvider";
import { useStore, ordersOf } from "../lib/store";
import { withSignIn } from "../wallet/SignIn";
import { REVIEW_WINDOW_MS } from "../lib/config";
import { alke, day, timeLeft } from "../lib/format";

// Status pill for any order, in the canvas's four tones.
export function statusOf(o) {
  if (o.status === "requested") return ["Request sent", "violet"];
  if (o.status === "awaiting_payment") return o.kind === "service" ? ["Awaiting payment", "peach"] : ["Checkout open", "peach"];
  if (o.status === "confirming") return ["Confirming", "violet"];
  if (o.status === "active") return ["Active", "violet"];
  if (o.status === "delivered") return o.kind === "service" ? ["Delivered", "peach"] : ["Delivered", "ok"];
  if (o.status === "completed") return ["Completed", "ok"];
  if (o.status === "disputed") return ["Disputed", "bad"];
  if (o.status === "refunded") return ["Refunded", "plain"];
  if (o.status === "cancelled") return [o.closedReason || "Cancelled", "plain"];
  return [{ expired: "Expired", declined: "Cancelled", underpaid: "Underpaid" }[o.payment?.failure] || "Failed", "plain"];
}

const isOpen = (o) => ["requested", "awaiting_payment", "confirming", "active", "disputed"].includes(o.status) || (o.kind === "service" && o.status === "delivered");
const isDone = (o) => o.status === "completed" || (o.kind === "product" && o.status === "delivered");

function OrderCard({ o, now, action }) {
  const [label, tone] = statusOf(o);
  const note = {
    requested: `Waiting for ${o.sellerName.split(" ")[0]} to accept. Nothing has been charged.`,
    awaiting_payment: o.payBy ? `${o.sellerName.split(" ")[0]} accepted your request. Pay within ${timeLeft(o.payBy - now)} to start.` : o.holdUntil ? "Your checkout is still open." : null,
    delivered: o.kind === "service" ? `Review the delivery. It completes automatically in ${timeLeft(o.deliveredAt + REVIEW_WINDOW_MS - now)}.` : null,
    confirming: "Your payment is confirming on Alkebuleum.",
    disputed: "AlkeShop support is reviewing this order.",
  }[o.status];
  const progress = o.status === "active" && o.dueAt ? Math.min(100, Math.max(4, ((now - o.paidAt) / (o.dueAt - o.paidAt)) * 100)) : null;
  return (
    <article className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-extrabold leading-snug">
            <Link to={o.status === "confirming" || (o.kind !== "service" && o.paidAt) ? `/orders/${o.id}/payment` : `/orders/${o.id}`} className="text-ink no-underline hover:text-ink">{o.title}</Link>
          </h2>
          <p className="text-[13px] text-mute">{o.sellerName} · {o.id} · {alke(o.amount)}</p>
        </div>
        <Pill tone={tone}>{label}</Pill>
      </div>
      {note && <p className="text-sm text-body">{note}</p>}
      {progress != null && (
        <div>
          <div className="flex justify-between text-[13px] text-mute"><span>Started {day(o.paidAt)}</span><span>Due {day(o.dueAt)}</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-raised"><div className="h-full rounded-full bg-violet" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
      {action}
    </article>
  );
}

function Orders() {
  const s = useStore();
  const { conn, openConnect } = useWallet();
  const [tab, setTab] = useState("open");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);

  const mine = conn ? ordersOf(s, conn.address) : [];
  const open = mine.filter(isOpen);
  const done = mine.filter(isDone);
  const closed = mine.filter((o) => !isOpen(o) && !isDone(o));
  const needsAction = open.filter((o) => o.kind === "service" && ["delivered", "awaiting_payment"].includes(o.status));
  const inProgress = open.filter((o) => !needsAction.includes(o));
  const lists = { open, done, closed };

  const actionFor = (o) => {
    if (o.status === "delivered" && o.kind === "service") return <Link to={`/orders/${o.id}`} className="btn-primary btn-sm self-start">Review delivery</Link>;
    if (o.status === "awaiting_payment") return <Link to={`/checkout/${o.id}`} className="btn-primary btn-sm self-start">Pay {alke(o.amount)}</Link>;
    return null;
  };

  return (
    <Shell tab="none">
      <div className="mx-auto max-w-[960px]">
        <header className="flex h-[60px] items-center gap-1 px-2 md:mt-6 md:px-6">
          <span className="md:hidden"><HeaderButton to="/" label="Back" /></span>
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] md:text-[32px]">My Orders</h1>
        </header>
        {!conn ? (
          <EmptyState icon="inbox" title="Your orders will show here" action={<button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect Nuru Wallet</button>}>
            Connect the wallet you shop with to see your orders and requests.
          </EmptyState>
        ) : (
          <>
            <nav aria-label="Order lists" className="mx-5 flex border-b border-line md:mx-8">
              {[["open", `Open · ${open.length}`], ["done", `Completed · ${done.length}`], ["closed", `Closed · ${closed.length}`]].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}
                  className={`min-h-[48px] flex-1 border-b-2 text-sm font-bold md:flex-none md:px-6 ${tab === k ? "border-ink text-ink" : "border-transparent text-dim"}`}>{label}</button>
              ))}
            </nav>
            <Page className="flex flex-col gap-3 pb-6 pt-5 md:px-8">
              {tab === "open" ? (
                <>
                  {needsAction.length > 0 && <p className="eyebrow">NEEDS YOUR ACTION</p>}
                  {needsAction.map((o) => <OrderCard key={o.id} o={o} now={now} action={actionFor(o)} />)}
                  {inProgress.length > 0 && <p className="eyebrow mt-2">IN PROGRESS</p>}
                  {inProgress.map((o) => <OrderCard key={o.id} o={o} now={now} action={actionFor(o)} />)}
                </>
              ) : lists[tab].map((o) => <OrderCard key={o.id} o={o} now={now} />)}
              {!lists[tab].length && (
                <EmptyState icon="inbox" title={tab === "open" ? "No open orders" : tab === "done" ? "Nothing completed yet" : "Nothing closed"}
                  action={tab === "open" ? <Link to="/services" className="btn-secondary btn-sm">Browse services</Link> : null} />
              )}
            </Page>
          </>
        )}
      </div>
    </Shell>
  );
}

export default withSignIn(Orders, { what: "your orders" });
