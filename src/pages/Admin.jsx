import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, Icon, LogoMark, Pill } from "../components/ui";
import { statusOf } from "./Orders";
import { useWallet } from "../wallet/WalletProvider";
import AccountMenu, { accountName, isAdmin } from "../wallet/AccountMenu";
import {
  useStore, reviewSeller, reviewListing, resolveDispute, refundOrder, setCreditsEnabled, recordPayout, markReconciled, earnings,
} from "../lib/store";
import { rpc, explorerTx } from "../lib/chain";
import { ADMIN_ADDRESSES, SHOP_TREASURY, feeOf } from "../lib/config";
import { alke, date, num, refTail, time } from "../lib/format";

const WATCHER_BEHIND_S = 5 * 60;

// The chain watcher: is Alkebuleum producing blocks we can see?
function useChainHealth() {
  const [h, setH] = useState(null);
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const b = await rpc("eth_getBlockByNumber", ["latest", false]);
        if (live) setH({ ok: true, lag: Math.floor(Date.now() / 1000) - parseInt(b.timestamp, 16), block: parseInt(b.number, 16), at: Date.now() });
      } catch (e) {
        if (live) setH({ ok: false, error: e.message, at: Date.now() });
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, []);
  return h;
}

function Figure({ label, value, unit }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] text-mute">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">{value}{unit && <span className="text-sm font-bold text-mute"> {unit}</span>}</p>
    </div>
  );
}

function Panel({ id, title, action, children }) {
  return (
    <section aria-labelledby={id} className="card flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between"><h2 id={id} className="text-lg font-extrabold">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

const Empty = ({ children }) => <p className="text-[15px] text-mute">{children}</p>;

export default function Admin() {
  const s = useStore();
  const { conn, openConnect } = useWallet();
  const health = useChainHealth();
  const [view, setView] = useState("dashboard");
  const [days, setDays] = useState(7);

  if (!conn || !isAdmin(conn)) {
    return (
      <div className="min-h-screen">
        <EmptyState icon="shield" title="AlkeShop Admin" action={!conn && <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect a staff wallet</button>}>
          {conn ? "This wallet isn't on the staff list." : "Connect a staff wallet to continue."}
        </EmptyState>
      </div>
    );
  }
  const staff = accountName(conn);
  const since = Date.now() - days * 86400000;
  const paid = s.orders.filter((o) => o.paidAt && o.paidAt >= since);
  const sum = (xs) => xs.reduce((t, o) => t + o.amount, 0);
  const marketSales = paid.filter((o) => o.kind !== "credits");
  const applications = Object.values(s.sellers).filter((p) => p.status === "review");
  const toReview = s.listings.filter((l) => l.status === "review");
  const disputes = s.orders.filter((o) => o.status === "disputed");
  const exceptions = s.orders.filter((o) => o.payment?.failure === "underpaid" || (o.paidAt && o.payment?.verified === false && !o.reconciled));
  const sellerIds = [...new Set(s.orders.filter((o) => o.kind !== "credits").map((o) => o.sellerId))];
  const payable = sellerIds.map((id) => ({ id, name: s.orders.find((o) => o.sellerId === id)?.sellerName, ...earnings(s, id) })).filter((x) => x.available > 0);
  const behind = health && (!health.ok || health.lag > WATCHER_BEHIND_S);

  const NAV = [
    ["dashboard", "Dashboard"],
    ["applications", "Seller applications", applications.length],
    ["listings", "Listing moderation", toReview.length],
    ["disputes", "Orders and disputes", disputes.length],
    ["payments", "Payment reconciliation", exceptions.length],
    ["credits", "Credit fulfillment"],
    ["payouts", "Refunds and payouts", payable.length],
    ["audit", "Audit log"],
  ];

  const queues = [
    ["payments", "Payment exceptions", exceptions.length],
    ["payouts", "Payouts to approve", payable.length],
    ["applications", "Seller applications", applications.length],
    ["listings", "Listings to review", toReview.length],
    ["disputes", "Disputes", disputes.length],
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="flex h-16 items-center justify-between px-5 md:px-8">
          <Link to="/" className="flex items-center gap-2 text-ink no-underline hover:text-ink">
            <LogoMark size={26} /><span className="font-extrabold">AlkeShop Admin</span><Pill tone="peach" className="ml-1">Pilot</Pill>
          </Link>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-mute sm:inline">{staff}</span><AccountMenu /></div>
        </div>
      </header>
      <div className="md:flex">
        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:w-64 md:flex-none md:flex-col md:border-b-0 md:border-r md:px-4 md:py-6">
          {NAV.map(([k, label, n]) => (
            <button key={k} type="button" onClick={() => setView(k)} aria-current={view === k ? "page" : undefined}
              className={`flex min-h-[44px] flex-none items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3 text-left text-sm font-bold ${view === k ? "bg-surface text-ink" : "text-body hover:bg-surface"}`}>
              {label}{n > 0 && <span className="rounded-full bg-peach px-2 text-xs font-extrabold text-night">{n}</span>}
            </button>
          ))}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-6 p-5 md:p-8">
          {!ADMIN_ADDRESSES.length && <div className="rounded-[14px] border border-peach/35 bg-peach/10 px-4 py-3 text-sm text-peach-text">No staff list is set (VITE_ADMIN_ADDRESSES), so any wallet can open this page. Set it before going live.</div>}
          {!SHOP_TREASURY && <div className="rounded-[14px] border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-[#FCA5A5]">No treasury address is set (VITE_SHOP_TREASURY), so checkout can't take payments.</div>}
          {health && (behind ? (
            <div role="alert" className="flex items-center gap-2.5 rounded-[14px] border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-[#FCA5A5]">
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-bad" />
              {health.ok ? `Chain watcher is ${Math.round(health.lag / 60)} minutes behind. New payments are not being confirmed.` : `Can't reach Alkebuleum: ${health.error}`}
            </div>
          ) : (
            <div role="status" className="flex items-center gap-2.5 rounded-[14px] border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-ok" />Chain watcher in sync with Alkebuleum · block {num(health.block)} · last checked {time(health.at)}
            </div>
          ))}

          {view === "dashboard" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Marketplace overview</h1>
                <label className="flex items-center gap-2 text-sm font-bold">Period
                  <select className="field !min-h-[40px] !w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                    <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={3650}>All time</option>
                  </select>
                </label>
              </div>
              <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
                <Figure label="Sales volume" value={num(sum(paid))} unit="ALKE" />
                <Figure label="Marketplace revenue" value={num(marketSales.reduce((t, o) => t + feeOf(o.amount), 0))} unit="ALKE" />
                <Figure label="Digital product sales" value={paid.filter((o) => o.kind === "product").length} />
                <Figure label="Service orders" value={paid.filter((o) => o.kind === "service").length} />
                <Figure label="Nuru Credit sales" value={num(sum(paid.filter((o) => o.kind === "credits")))} unit="ALKE" />
                <Figure label="Active buyers / sellers" value={`${new Set(paid.map((o) => o.buyer)).size} / ${new Set(marketSales.map((o) => o.sellerId)).size}`} />
                <Figure label="Refunds" value={s.orders.filter((o) => o.status === "refunded").length} />
                <Figure label="Open disputes" value={disputes.length} />
                <Figure label="Payment exceptions" value={exceptions.length} />
              </section>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel id="queues-h" title="Work queues">
                  <table className="table-base">
                    <thead><tr><th scope="col">Queue</th><th scope="col">Waiting</th></tr></thead>
                    <tbody>{queues.map(([k, label, n]) => <tr key={k}><td><button type="button" onClick={() => setView(k)} className="font-semibold text-violet-text hover:text-violet-hover">{label}</button></td><td>{n}</td></tr>)}</tbody>
                  </table>
                </Panel>
                <Panel id="audit-h" title="Recent staff actions" action={<button type="button" onClick={() => setView("audit")} className="btn-text">Full audit log</button>}>
                  {s.audit.slice(0, 5).map((a, i) => <p key={i} className="text-sm"><span className="text-mute">{time(a.at)} ·</span> <strong>{a.who}</strong> {a.text}</p>)}
                  {!s.audit.length && <Empty>No actions yet.</Empty>}
                </Panel>
              </div>
            </>
          )}

          {view === "applications" && (
            <Panel id="apps-h" title="Seller applications">
              {applications.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 border-b border-line pb-4 last:border-b-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-extrabold">{p.name} <span className="font-medium text-mute">· {p.type} · {p.country}</span></p>
                    <span className="text-[13px] text-mute">Applied {date(p.appliedAt)}</span>
                  </div>
                  <p className="text-sm text-body">{p.bio}</p>
                  <p className="text-[13px] text-mute">Sells {p.sells.join(" and ")} · {p.email} · payout {refTail(p.payout)}{p.portfolio && <> · <a href={p.portfolio} target="_blank" rel="noreferrer">portfolio</a></>}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => reviewSeller(p.id, true, staff)} className="btn-primary btn-sm">Approve</button>
                    <button type="button" onClick={() => reviewSeller(p.id, false, staff)} className="btn-secondary btn-sm">Reject</button>
                  </div>
                </div>
              ))}
              {!applications.length && <Empty>No applications waiting.</Empty>}
            </Panel>
          )}

          {view === "listings" && (
            <Panel id="mod-h" title="Listing moderation">
              {toReview.map((l) => <ListingReview key={l.id} l={l} seller={s.sellers[l.sellerId]} staff={staff} />)}
              {!toReview.length && <Empty>No listings waiting for review.</Empty>}
            </Panel>
          )}

          {view === "disputes" && (
            <Panel id="disp-h" title="Orders and disputes">
              {disputes.map((o) => (
                <div key={o.id} className="flex flex-col gap-2 border-b border-line pb-4 last:border-b-0">
                  <p className="font-extrabold">{o.id} · {o.title} <span className="font-medium text-mute">· {o.sellerName} · {alke(o.amount)}</span></p>
                  <p className="text-sm text-body">Buyer says: {o.dispute}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/orders/${o.id}`} className="btn-secondary btn-sm">Read conversation</Link>
                    <button type="button" onClick={() => resolveDispute(o.id, true, staff)} className="btn-primary btn-sm">Refund buyer</button>
                    <button type="button" onClick={() => resolveDispute(o.id, false, staff)} className="btn-secondary btn-sm">Close for seller</button>
                  </div>
                </div>
              ))}
              {!disputes.length && <Empty>No open disputes.</Empty>}
              <h3 className="mt-2 font-extrabold">All orders</h3>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th scope="col">Order</th><th scope="col">Item</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Reference</th></tr></thead>
                  <tbody>
                    {s.orders.slice(0, 50).map((o) => {
                      const [label, tone] = statusOf(o);
                      return <tr key={o.id}><td>{o.id}</td><td className="max-w-[260px] truncate">{o.title}</td><td>{num(o.amount)}</td><td><Pill tone={tone}>{label}</Pill></td>
                        <td>{o.payment?.txHash ? <a href={explorerTx(o.payment.txHash)} target="_blank" rel="noreferrer" className="font-mono">{refTail(o.payment.txHash)}</a> : "-"}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {view === "payments" && (
            <Panel id="exc-h" title="Payment exceptions">
              <p className="text-sm text-mute">Underpayments, and payments made through a relayed Nuru call whose amount can't be read from the transaction. Check those against the treasury's incoming transfers.</p>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th scope="col">Order</th><th scope="col">Type</th><th scope="col">Expected</th><th scope="col">Received</th><th scope="col">Reference</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                  <tbody>
                    {exceptions.map((o) => (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td><Pill tone={o.payment.failure ? "bad" : "peach"}>{o.payment.failure ? "Underpaid" : "Amount unverified"}</Pill></td>
                        <td>{num(o.amount)}</td>
                        <td>{o.payment.received != null ? num(o.payment.received) : "?"}</td>
                        <td><a href={explorerTx(o.payment.txHash)} target="_blank" rel="noreferrer" className="font-mono">{refTail(o.payment.txHash)}</a></td>
                        <td>{o.payment.failure ? <button type="button" onClick={() => refundOrder(o.id, staff, "underpaid")} className="btn-text">Mark refunded</button> : <ReconcileButton o={o} staff={staff} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!exceptions.length && <Empty>No exceptions. Reconciliation is clean.</Empty>}
            </Panel>
          )}

          {view === "credits" && (
            <Panel id="cred-h" title="Credit fulfillment">
              <label className="flex min-h-[44px] items-center justify-between gap-3">
                <span><span className="block font-bold">Sell credit packages</span><span className="block text-[13px] text-mute">When off, the Credits page shows balances only.</span></span>
                <input type="checkbox" role="switch" className="check" checked={s.settings.creditsEnabled} onChange={(e) => setCreditsEnabled(e.target.checked, staff)} />
              </label>
              <table className="table-base">
                <thead><tr><th scope="col">Order</th><th scope="col">Credits</th><th scope="col">Paid</th><th scope="col">Buyer</th></tr></thead>
                <tbody>{s.orders.filter((o) => o.kind === "credits" && o.paidAt).map((o) => <tr key={o.id}><td>{o.id}</td><td>{num(o.credits)}</td><td>{alke(o.amount)}</td><td className="font-mono">{refTail(o.buyer)}</td></tr>)}</tbody>
              </table>
              <p className="text-[13px] text-mute">Granting credits to a Nuru account needs the Nuru credits API. Until it's connected, balances are tracked by AlkeShop.</p>
            </Panel>
          )}

          {view === "payouts" && (
            <Panel id="pay-h" title="Refunds and payouts">
              <table className="table-base">
                <thead><tr><th scope="col">Seller</th><th scope="col">Available</th><th scope="col">Pending</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {payable.map((p) => (
                    <tr key={p.id}><td>{p.name}</td><td>{alke(p.available)}</td><td>{alke(p.pending)}</td>
                      <td><button type="button" onClick={() => recordPayout(p.id, p.available, staff)} className="btn-text">Record payout</button></td></tr>
                  ))}
                </tbody>
              </table>
              {!payable.length && <Empty>No balances ready for payout.</Empty>}
              <p className="text-[13px] text-mute">Recording a payout marks the balance as paid. Send the ALKE from the treasury wallet itself; this page doesn't hold its keys.</p>
            </Panel>
          )}

          {view === "audit" && (
            <Panel id="log-h" title="Audit log">
              {s.audit.map((a, i) => <p key={i} className="text-sm"><span className="text-mute">{date(a.at)} {time(a.at)} ·</span> <strong>{a.who}</strong> {a.text}</p>)}
              {!s.audit.length && <Empty>No actions yet.</Empty>}
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}

function ListingReview({ l, seller, staff }) {
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-2 border-b border-line pb-4 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-extrabold">{l.title} <span className="font-medium text-mute">· {l.kind === "product" ? "Digital product" : "Service"} · {seller?.name} · {alke(l.price)}</span></p>
        <Link to={`/${l.kind === "product" ? "products" : "services"}/${l.id}`} className="btn-text">Preview<Icon name="external" size={14} /></Link>
      </div>
      <p className="text-sm text-body">{l.about || l.scope}</p>
      {l.files?.length > 0 && <p className="text-[13px] text-mute">Files: {l.files.map((f) => f.name).join(", ")}</p>}
      <label htmlFor={`note-${l.id}`} className="sr-only">Note to the seller</label>
      <input id={`note-${l.id}`} className="field" placeholder="Note to the seller (needed to return it)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" onClick={() => reviewListing(l.id, true, staff)} className="btn-primary btn-sm">Approve and publish</button>
        <button type="button" disabled={!note.trim()} onClick={() => reviewListing(l.id, false, staff, note.trim())} className="btn-secondary btn-sm">Return with notes</button>
      </div>
    </div>
  );
}

function ReconcileButton({ o, staff }) {
  return <button type="button" onClick={() => markReconciled(o.id, staff)} className="btn-text">Mark checked</button>;
}
