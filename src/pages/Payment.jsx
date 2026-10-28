import React, { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { CopyButton, HeaderButton, Icon, Notice, Pill } from "../components/ui";
import { useStore } from "../lib/store";
import { withSignIn } from "../wallet/SignIn";
import { explorerTx } from "../lib/chain";
import { MIN_CONFS, SLOW_AFTER_MS } from "../lib/config";
import { alke, dateTime, fileSize, num, refTail, weekday } from "../lib/format";
import NotFound from "./NotFound";
import { appLink } from "../lib/nuruBrowser";

const STEPS = [
  ["sent", "Sent from your wallet"],
  ["seen", "Seen on Alkebuleum"],
  ["confirming", "Confirming"],
  ["confirmed", "Confirmed and delivered"],
];

function Frame({ close, title, children }) {
  return (
    <Shell footer={false}>
      <div className="mx-auto max-w-xl">
        <header className="flex h-[60px] items-center justify-between pl-5 pr-2">
          <h1 className="text-xl font-extrabold">{title}</h1>
          <HeaderButton to={close.to} icon="close" label={close.label} />
        </header>
        <main className="flex flex-col gap-6 px-5 pb-10">{children}</main>
      </div>
    </Shell>
  );
}

function Pending({ order }) {
  const [t, setT] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setT(Date.now()), 5000); return () => clearInterval(i); }, []);
  const p = order.payment;
  // "sent" and "seen" are reached as they happen; "confirming" is in progress until enough confirmations.
  const at = STEPS.findIndex(([k]) => k === p.stage);
  const currentStep = p.stage === "confirming" ? at : at + 1;
  const slow = t - p.submittedAt > SLOW_AFTER_MS;
  return (
    <Frame title="Payment" close={{ to: "/", label: "Close and keep browsing" }}>
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <span className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-violet/20 border-t-violet" />
          <Icon name="wallet" size={30} className="text-violet" />
        </span>
        <h2 role="status" className="text-2xl font-extrabold">Confirming your payment</h2>
        <p className="max-w-sm text-[15px] text-mute">This usually takes a moment. You can leave this page; we'll keep checking and update your orders when it's done.</p>
      </div>
      {slow && <Notice tone="peach" icon="clock">Taking longer than usual. Your payment is on its way and we'll keep checking. <Link to="/help">Contact support</Link></Notice>}
      <ol aria-label="Payment progress" className="card flex flex-col gap-0 p-4">
        {STEPS.map(([k, label], i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          return (
            <li key={k} aria-current={current ? "step" : undefined} className="flex items-start gap-3">
              <span className="flex flex-col items-center">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? "bg-ok text-night" : current ? "border-2 border-violet" : "border-2 border-line"}`}>
                  {done ? <Icon name="check" size={16} stroke={3} /> : current ? <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet" /> : null}
                </span>
                {i < STEPS.length - 1 && <span className={`h-6 w-0.5 ${i < currentStep ? "bg-ok" : "bg-line"}`} />}
              </span>
              <span className={`pt-0.5 text-[15px] ${current ? "font-extrabold" : done ? "font-bold" : "text-mute"}`}>
                {label}
                {current && k === "confirming" && p.confirmations != null && <span className="block text-[13px] font-medium text-mute">{p.confirmations} of {MIN_CONFS} confirmations</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <Details order={order} />
      <a href={explorerTx(p.txHash)} {...appLink()} className="btn-text justify-center">View on Alkebuleum Explorer<Icon name="external" size={16} /></a>
      <Link to="/" className="btn-secondary w-full">Keep browsing</Link>
    </Frame>
  );
}

function Details({ order, received }) {
  const p = order.payment;
  return (
    <dl className="rows card px-4">
      <div><dt>{received ? "Required" : "Amount"}</dt><dd>{alke(order.amount)}</dd></div>
      {received != null && <div><dt>Received</dt><dd>{alke(received)}</dd></div>}
      {received != null && <div><dt>Return to your wallet</dt><dd><Pill tone="peach">Queued</Pill></dd></div>}
      <div><dt>Order</dt><dd>{order.id}</dd></div>
      {p.txHash && <div><dt>Payment reference</dt><dd className="flex items-center gap-1 font-mono">{refTail(p.txHash)}<CopyButton value={p.txHash} label="Copy payment reference" /></dd></div>}
    </dl>
  );
}

function Success({ order }) {
  const p = order.payment;
  const lines = {
    product: `${order.title} is ready in your Library.`,
    service: `${order.sellerName.split(" ")[0]} has been told to start. Your delivery is due ${order.dueAt ? weekday(order.dueAt) : "soon"}.`,
    credits: `${num(order.credits)} credits were added.`,
  };
  return (
    <Frame title="" close={{ to: "/", label: "Close" }}>
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ok/15 text-ok"><Icon name="check" size={40} stroke={2.5} /></span>
        <h1 role="status" className="text-[28px] font-extrabold tracking-[-0.03em]">Payment confirmed</h1>
        <p className="max-w-sm text-base text-body">{lines[order.kind]}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {order.kind === "product" && <Link to="/library" className="btn-primary w-full"><Icon name="download" />Go to download{order.size ? ` · ${fileSize(order.size)}` : ""}</Link>}
        {order.kind === "service" && <Link to={`/orders/${order.id}`} className="btn-primary w-full">Go to your order</Link>}
        {order.kind === "credits" && <Link to="/credits" className="btn-primary w-full">Back to Nuru Credits</Link>}
        <Link to="/" className="btn-secondary w-full">Keep shopping</Link>
      </div>
      <section aria-labelledby="receipt-h" className="card flex flex-col p-4">
        <div className="flex items-center justify-between"><h2 id="receipt-h" className="font-extrabold">Receipt</h2>
          <button type="button" onClick={() => window.print()} className="btn-text">Print or save</button>
        </div>
        <dl className="rows">
          <div><dt>Order</dt><dd>{order.id}</dd></div>
          <div><dt>Item</dt><dd>{order.title}</dd></div>
          {order.kind !== "credits" && <div><dt>Seller</dt><dd>{order.sellerName}</dd></div>}
          <div><dt>Amount</dt><dd>{alke(order.amount)}</dd></div>
          <div><dt>Paid</dt><dd>{dateTime(order.paidAt)}</dd></div>
          <div><dt>Payment reference</dt><dd><a href={explorerTx(p.txHash)} {...appLink()} className="font-mono">{refTail(p.txHash)}</a></dd></div>
          <div><dt>Status</dt><dd><Pill tone="ok">{order.kind === "product" ? "Delivered" : order.kind === "service" ? "In progress" : "Credits added"}</Pill></dd></div>
        </dl>
      </section>
    </Frame>
  );
}

const FAILURES = {
  expired: { title: "This payment request expired", body: "No payment arrived within 30 minutes, so nothing was charged. Start again when you are ready.", primary: "Start a new payment", tone: "plain", icon: "clock" },
  declined: { title: "Payment cancelled", body: "You declined the request in your wallet. Nothing was sent.", primary: "Try again", tone: "plain", icon: "x" },
  failed: { title: "The network rejected this payment", body: "Your ALKE did not leave your wallet. Only the network fee, if any, was used.", primary: "Try again", tone: "bad", icon: "alert" },
  underpaid: { title: "We received less than the order total", body: "Your order was not fulfilled. We will return what you sent to the wallet it came from.", primary: "Start a new payment", tone: "bad", icon: "alert" },
};
const ICON_TONES = { plain: "bg-raised text-body", bad: "bg-bad/20 text-bad", peach: "bg-peach/20 text-peach" };

function Failure({ order }) {
  const f = FAILURES[order.payment.failure] || FAILURES.failed;
  const retry = order.kind === "service" && order.status === "awaiting_payment" ? `/checkout/${order.id}`
    : order.kind === "product" ? `/products/${order.itemId}` : order.kind === "credits" ? "/credits" : `/orders/${order.id}`;
  const back = order.kind === "product" ? `/products/${order.itemId}` : order.kind === "credits" ? "/credits" : `/orders/${order.id}`;
  return (
    <Frame title="" close={{ to: back, label: "Close" }}>
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <span className={`flex h-20 w-20 items-center justify-center rounded-full ${ICON_TONES[f.tone]}`}><Icon name={f.icon} size={36} /></span>
        <h1 role="alert" className="text-[26px] font-extrabold leading-tight tracking-[-0.03em]">{f.title}</h1>
        <p className="max-w-sm text-base text-body">{f.body}</p>
      </div>
      {order.payment.failure === "underpaid" && <Details order={order} received={order.payment.received} />}
      <div className="flex flex-col gap-2.5">
        <Link to={retry} className="btn-primary w-full">{f.primary}</Link>
        <Link to={back} className="btn-secondary w-full">{order.kind === "product" ? "Back to the product" : order.kind === "credits" ? "Back to Nuru Credits" : "Back to the order"}</Link>
      </div>
      <p className="text-center text-sm text-mute">Something not right? <Link to="/help">Contact support</Link> with order {order.id}.</p>
    </Frame>
  );
}

function Payment() {
  const { orderId } = useParams();
  const s = useStore();
  const order = s.orders.find((o) => o.id === orderId);
  if (!order) return <NotFound />;
  if (order.status === "confirming") return <Pending order={order} />;
  if (order.payment?.stage === "confirmed" && order.paidAt) return <Success order={order} />;
  if (order.payment?.failure) return <Failure order={order} />;
  if (order.status === "awaiting_payment") return <Navigate to={`/checkout/${order.id}`} replace />;
  return <Navigate to={`/orders/${order.id}`} replace />;
}

export default withSignIn(Payment, { what: "this payment", connect: true });
