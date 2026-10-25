import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, EmptyState, HeaderButton, Icon, Notice, Pill, Sheet } from "../components/ui";
import { statusOf } from "./Orders";
import { useWallet } from "../wallet/WalletProvider";
import {
  useStore, sendMessage, acceptDelivery, requestRevision, openDispute,
  sellerAccept, sellerDecline, sellerDeliver,
} from "../lib/store";
import { getSeller } from "../lib/market";
import { REVIEW_WINDOW_MS, sellerShare } from "../lib/config";
import { alke, day, dateTime, fileSize, initials, timeLeft } from "../lib/format";
import { sellers as seedSellers } from "../lib/catalog";
import NotFound from "./NotFound";

const pickFiles = (list) => [...list].map((f) => ({ name: f.name, size: f.size }));

function FileChip({ f }) {
  return (
    <span className="mt-2 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-[13px]">
      <Icon name="file" size={18} className="text-mute" />
      <span className="min-w-0 flex-1 truncate">{f.name} · {fileSize(f.size)}</span>
    </span>
  );
}

// One-field sheet for revisions, disputes and deliveries.
function TextSheet({ title, label, cta, withFiles, required = true, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  return (
    <Sheet title={title} onClose={onClose} wide>
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit(text.trim(), files); onClose(); }}>
        <label htmlFor="sheet-text" className="label">{label}</label>
        <textarea id="sheet-text" rows={4} className="field" value={text} onChange={(e) => setText(e.target.value)} />
        {withFiles && (
          <>
            <label htmlFor="sheet-files" className="label">Files</label>
            <input id="sheet-files" type="file" multiple onChange={(e) => setFiles(pickFiles(e.target.files))}
              className="text-sm text-body file:mr-3 file:min-h-[40px] file:rounded-full file:border file:border-line-2 file:bg-transparent file:px-4 file:font-bold file:text-ink" />
          </>
        )}
        <button type="submit" disabled={required && !text} className="btn-primary w-full">{cta}</button>
      </form>
    </Sheet>
  );
}

function DeliveryCard({ m, order, role, onSheet }) {
  const latest = order.status === "delivered" && m.delivery === order.deliveries;
  return (
    <section aria-label={`Delivery ${m.delivery}`} className="flex flex-col gap-2 rounded-[18px] border border-violet-edge bg-surface p-4">
      <div className="flex items-baseline justify-between"><h2 className="font-extrabold">Delivery {m.delivery} from {order.sellerName.split(" ")[0]}</h2><span className="text-[13px] text-mute">{day(m.at)}, {new Date(m.at).toTimeString().slice(0, 5)}</span></div>
      <p className="text-[15px] text-body">{m.text}</p>
      {(m.files || []).map((f) => <FileChip key={f.name} f={f} />)}
      {m.files?.some((f) => f.sample) && <p className="text-[13px] text-mute">Sample delivery from a demo seller. There's no real file.</p>}
      {latest && role === "buyer" && (
        <div className="mt-2 flex flex-col gap-2">
          <button type="button" onClick={() => acceptDelivery(order.id)} className="btn-primary w-full">Accept and complete</button>
          <button type="button" disabled={!order.revisionsLeft} onClick={() => onSheet("revision")} className="btn-secondary w-full">
            Request a revision · {order.revisionsLeft || 0} left
          </button>
          <button type="button" onClick={() => onSheet("dispute")} className="btn-text justify-center text-bad hover:text-bad">Something wrong? Open a dispute</button>
        </div>
      )}
    </section>
  );
}

export default function Order() {
  const { orderId } = useParams();
  const s = useStore();
  const { conn, openConnect } = useWallet();
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sheet, setSheet] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const order = s.orders.find((o) => o.id === orderId);
  const msgs = s.messages[orderId] || [];

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  if (!order) return <NotFound />;
  if (order.kind !== "service") return <Navigate to={`/orders/${order.id}/payment`} replace />;
  const me = conn?.address.toLowerCase();
  const role = me === order.buyer ? "buyer" : me === order.sellerId ? "seller" : null;
  if (!conn || !role) {
    return (
      <Shell tab="none">
        <EmptyState icon="lock" title="Connect the wallet on this order" action={!conn && <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect Nuru Wallet</button>}>
          Only the buyer and the seller can see this conversation.
        </EmptyState>
      </Shell>
    );
  }

  const seller = getSeller(s, order.sellerId);
  const other = role === "buyer" ? { name: order.sellerName, color: seller?.color, dark: seller?.dark } : { name: `Buyer ${order.buyer.slice(-4).toUpperCase()}`, color: "#22232A" };
  const sample = seedSellers.find((x) => x.id === order.sellerId)?.sample;
  const [label, tone] = statusOf(order);
  const banner = {
    requested: role === "seller" ? "New request · accept or decline" : "Request sent · waiting for the seller",
    awaiting_payment: role === "seller" ? "Accepted · waiting for payment" : `Accepted · pay within ${timeLeft(order.payBy - Date.now())}`,
    active: order.dueAt ? `In progress · due ${day(order.dueAt)}` : "In progress",
    delivered: `Delivered · completes in ${timeLeft(order.deliveredAt + REVIEW_WINDOW_MS - Date.now())}`,
  }[order.status] || label;
  const closed = ["completed", "cancelled", "refunded", "failed"].includes(order.status);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() && !files.length) return;
    sendMessage(order.id, role, text.trim(), files);
    setText("");
    setFiles([]);
  };

  return (
    <Shell footer={false}>
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col md:min-h-[calc(100vh-72px)]">
        <header className="sticky top-0 z-20 flex h-[64px] items-center gap-2 border-b border-line bg-night px-2 md:top-[72px]">
          <HeaderButton to={role === "seller" ? "/seller" : "/orders"} label={role === "seller" ? "Back to seller center" : "Back to orders"} />
          <Avatar initials={initials(other.name)} color={other.color} dark={other.dark} size={36} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-extrabold">{other.name}</h1>
            <p className="truncate text-[13px] text-mute">{order.title} · {order.id}</p>
          </div>
          <button type="button" onClick={() => setSheet("details")} aria-label="Order details and help" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"><Icon name="more" /></button>
        </header>
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-2.5">
          <Pill tone={tone}>{banner}</Pill>
          <button type="button" onClick={() => setSheet("details")} className="btn-text">Order details</button>
        </div>

        <main aria-label="Conversation" className="flex flex-1 flex-col gap-3 px-5 py-5">
          {sample && role === "buyer" && <Notice tone="plain" icon="info">{order.sellerName} is a sample seller: replies and deliveries are simulated so you can try the whole flow.</Notice>}
          {order.paidAt && <p className="text-center text-[13px] text-mute">Paid {day(order.paidAt)}{order.dueAt ? ` · due ${day(order.dueAt)}` : ""}</p>}
          {msgs.map((m) => {
            if (m.delivery) return <DeliveryCard key={m.id} m={m} order={order} role={role} onSheet={setSheet} />;
            if (m.from === "system") return <p key={m.id} className="mx-auto max-w-sm text-center text-[13px] text-mute">{m.text}</p>;
            const mine = m.from === role;
            return (
              <div key={m.id} className={`flex max-w-[85%] flex-col ${mine ? "self-end items-end" : "self-start items-start"}`}>
                <div className={`whitespace-pre-line rounded-[18px] px-4 py-2.5 text-[15px] leading-snug ${mine ? "rounded-br-md bg-violet text-night" : "rounded-bl-md bg-surface text-ink"}`}>
                  {m.text}
                  {(m.files || []).map((f) => <FileChip key={f.name} f={f} />)}
                </div>
                <span className="mt-1 text-[12px] text-mute">{dateTime(m.at)}</span>
              </div>
            );
          })}

          {role === "seller" && order.status === "requested" && (
            <div className="card flex flex-col gap-2 p-4">
              <p className="font-bold">Accept this request for {alke(order.amount)}?</p>
              <p className="text-sm text-mute">You receive {alke(sellerShare(order.amount))} after the marketplace fee. The buyer then has 18 hours to pay.</p>
              <div className="mt-1 flex gap-2">
                <button type="button" onClick={() => sellerAccept(order.id)} className="btn-primary btn-sm flex-1">Accept</button>
                <button type="button" onClick={() => sellerDecline(order.id)} className="btn-secondary btn-sm flex-1">Decline</button>
              </div>
            </div>
          )}
          {role === "seller" && order.status === "active" && (
            <button type="button" onClick={() => setSheet("deliver")} className="btn-primary w-full">Deliver work</button>
          )}
          {role === "buyer" && order.status === "awaiting_payment" && (
            <Link to={`/checkout/${order.id}`} className="btn-primary w-full">Pay {alke(order.amount)}</Link>
          )}
          <p className="mt-2 flex items-center justify-center gap-2 text-center text-[13px] text-mute"><Icon name="shield" size={16} />Keep payments and files on AlkeShop so support can help if something goes wrong.</p>
          <div ref={endRef} />
        </main>

        {!closed && (
          <form onSubmit={send} className="pb-safe sticky bottom-0 border-t border-line bg-night px-3 py-2">
            {files.length > 0 && <p className="px-2 pb-1 text-[13px] text-mute">{files.map((f) => f.name).join(", ")}</p>}
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => setFiles(pickFiles(e.target.files))} />
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a file" className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-ink"><Icon name="paperclip" /></button>
              <label htmlFor="msg" className="sr-only">Message {other.name}</label>
              <input id="msg" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${other.name.split(" ")[0]}`}
                className="min-h-[44px] min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-dim focus:border-violet" />
              <button type="submit" aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-night"><Icon name="send" size={18} /></button>
            </div>
          </form>
        )}
      </div>

      {sheet === "revision" && <TextSheet title="Request a revision" label="What should change?" cta="Send revision request" onClose={() => setSheet(null)} onSubmit={(t) => requestRevision(order.id, t)} />}
      {sheet === "dispute" && <TextSheet title="Open a dispute" label="What went wrong?" cta="Open dispute" onClose={() => setSheet(null)} onSubmit={(t) => openDispute(order.id, t)} />}
      {sheet === "deliver" && <TextSheet title="Deliver work" label="Message to the buyer" cta="Send delivery" withFiles onClose={() => setSheet(null)} onSubmit={(t, f) => sellerDeliver(order.id, t, f)} />}
      {sheet === "details" && (
        <Sheet title="Order details" subtitle={order.id} onClose={() => setSheet(null)}>
          <dl className="rows">
            <div><dt>Service</dt><dd>{order.title}</dd></div>
            <div><dt>Seller</dt><dd>{order.sellerName}</dd></div>
            <div><dt>Price</dt><dd>{alke(order.amount)}</dd></div>
            <div><dt>Status</dt><dd><Pill tone={tone}>{label}</Pill></dd></div>
            <div><dt>Requested</dt><dd>{dateTime(order.createdAt)}</dd></div>
            {order.paidAt && <div><dt>Paid</dt><dd><Link to={`/orders/${order.id}/payment`}>{dateTime(order.paidAt)}</Link></dd></div>}
            {order.dueAt && <div><dt>Due</dt><dd>{dateTime(order.dueAt)}</dd></div>}
            <div><dt>Revisions left</dt><dd>{order.revisionsLeft ?? 0}</dd></div>
          </dl>
          <Link to="/help" className="btn-secondary mt-4 w-full">Contact support</Link>
        </Sheet>
      )}
    </Shell>
  );
}
