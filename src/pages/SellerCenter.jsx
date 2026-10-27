import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Shell from "../components/Shell";
import { Avatar, EmptyState, Icon, Pill } from "../components/ui";
import { statusOf } from "./Orders";
import { useWallet } from "../wallet/WalletProvider";
import { useStore, sellerOrders, earnings } from "../lib/store";
import { withSignIn } from "../wallet/SignIn";
import { colorFor } from "../lib/market";
import { sellerShare } from "../lib/config";
import { alke, initials, monthName, num, relativeDay, timeLeft, walletTail } from "../lib/format";

const LISTING_TONES = { live: ["Live", "ok"], review: ["In review", "violet"], returned: ["Returned", "peach"], draft: ["Draft", "plain"], paused: ["Paused", "plain"] };

function Stat({ label, value, sub }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] text-mute">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">{value}</p>
      {sub && <p className="mt-0.5 text-[13px] text-mute">{sub}</p>}
    </div>
  );
}

function TodoLink({ to, count, title, sub }) {
  return (
    <Link to={to} className="card flex items-center gap-3 p-3.5 text-ink no-underline hover:border-line-2 hover:text-ink">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-peach text-sm font-extrabold text-night">{count}</span>
      <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block truncate text-[13px] text-mute">{sub}</span></span>
      <Icon name="chevron" className="text-mute" />
    </Link>
  );
}

function SellerCenter() {
  const s = useStore();
  const { conn } = useWallet();
  const [view, setView] = useState("overview"); // overview | listings | orders
  if (!conn) return <Navigate to="/sell" replace />;
  const me = conn.address.toLowerCase();
  const profile = s.sellers[me];
  if (!profile || profile.status !== "approved") return <Navigate to="/sell" replace />;

  const orders = sellerOrders(s, me).filter((o) => o.status !== "failed");
  const listings = s.listings.filter((l) => l.sellerId === me);
  const money = earnings(s, me);
  const now = Date.now();
  const requests = orders.filter((o) => o.status === "requested");
  const dueSoon = orders.filter((o) => o.status === "active" && o.dueAt - now < 2 * 86400000);
  const returned = listings.filter((l) => l.status === "returned");
  const monthSales = orders.filter((o) => o.paidAt && new Date(o.paidAt).getMonth() === new Date().getMonth());
  const count = (st) => listings.filter((l) => l.status === st).length;

  const NAV = [["overview", "Overview", "chart"], ["listings", "Listings", "grid"], ["orders", "Orders", "inbox"]];

  return (
    <Shell footer={false}>
      <div className="mx-auto max-w-[1280px] pb-24 md:flex md:gap-8 md:px-8 md:pb-10 md:pt-6">
        <nav aria-label="Seller center" className="hidden w-60 flex-none flex-col gap-1 md:flex">
          <div className="mb-4 flex items-center gap-3">
            <Avatar initials={initials(profile.name)} color={colorFor(me)} size={40} />
            <span><span className="block font-extrabold">{profile.name}</span><span className="block text-[13px] text-mute">Seller center</span></span>
          </div>
          {NAV.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setView(k)} aria-current={view === k ? "page" : undefined}
              className={`flex min-h-[44px] items-center justify-between rounded-xl px-3 text-left font-bold ${view === k ? "bg-surface text-ink" : "text-body hover:bg-surface"}`}>
              {label}{k === "orders" && requests.length > 0 && <span className="rounded-full bg-peach px-2 text-xs font-extrabold text-night">{requests.length}</span>}
            </button>
          ))}
          <Link to={`/sellers/${me}`} className="flex min-h-[44px] items-center rounded-xl px-3 font-bold text-body no-underline hover:bg-surface hover:text-ink">Public profile</Link>
          <Link to="/" className="flex min-h-[44px] items-center rounded-xl px-3 font-bold text-body no-underline hover:bg-surface hover:text-ink">Back to the shop</Link>
        </nav>

        <main className="min-w-0 flex-1">
          <header className="flex h-[64px] items-center justify-between px-5 md:h-auto md:px-0 md:pb-6">
            <div className="flex items-center gap-3 md:hidden">
              <Avatar initials={initials(profile.name)} color={colorFor(me)} size={36} />
              <div><h1 className="font-extrabold">Seller center</h1><p className="text-[13px] text-mute">{profile.name}</p></div>
            </div>
            <h1 className="hidden text-[32px] font-extrabold tracking-[-0.03em] md:block">{NAV.find(([k]) => k === view)[1]}</h1>
            <div className="flex gap-2">
              <Link to="/seller/new-product" className="btn-primary btn-sm"><Icon name="plus" size={18} /><span className="hidden sm:inline">New product</span><span className="sm:hidden">Product</span></Link>
              <Link to="/seller/new-service" className="btn-secondary btn-sm"><Icon name="plus" size={18} /><span className="hidden sm:inline">New service</span><span className="sm:hidden">Service</span></Link>
            </div>
          </header>

          <div className="flex flex-col gap-6 px-5 md:px-0">
            {view === "overview" && (
              <>
                <section aria-label="Earnings" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="col-span-2 rounded-[22px] bg-violet p-5 text-night lg:col-span-1">
                    <h2 className="text-sm font-bold">Available for payout</h2>
                    <p className="mt-1 text-[32px] font-extrabold tracking-[-0.03em]">{alke(money.available)}</p>
                    <p className="text-[13px] font-semibold">Paid weekly to {walletTail(profile.payout)}</p>
                  </div>
                  <Stat label="Pending" value={alke(money.pending)} sub="In progress or in the review window" />
                  <Stat label={`Sales in ${monthName(now)}`} value={alke(monthSales.reduce((t, o) => t + o.amount, 0))} sub={`${monthSales.length} orders`} />
                  <Stat label="Paid out" value={alke(money.paidOut)} sub="All time" />
                </section>

                <section aria-labelledby="todo-h" className="flex flex-col gap-2.5">
                  <h2 id="todo-h" className="h-section">To do</h2>
                  {requests.length > 0 && <TodoLink to={`/orders/${requests[0].id}`} count={requests.length} title="Requests to accept" sub={`${requests[0].title} · ${requests[0].id}`} />}
                  {dueSoon.length > 0 && <TodoLink to={`/orders/${dueSoon[0].id}`} count={dueSoon.length} title="Delivery due soon" sub={`${dueSoon[0].title} · due in ${timeLeft(dueSoon[0].dueAt - now)}`} />}
                  {returned.length > 0 && <TodoLink to={`/seller/${returned[0].kind === "product" ? "new-product" : "new-service"}?edit=${returned[0].id}`} count={returned.length} title="Listing returned with notes" sub={`${returned[0].title}${returned[0].reviewNote ? ` · ${returned[0].reviewNote}` : ""}`} />}
                  {!requests.length && !dueSoon.length && !returned.length && <p className="text-[15px] text-mute">Nothing needs you right now.</p>}
                </section>

                <section aria-labelledby="recent-h" className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between"><h2 id="recent-h" className="h-section">Recent orders</h2><button type="button" onClick={() => setView("orders")} className="btn-text">All orders</button></div>
                  {orders.slice(0, 4).map((o) => <OrderRow key={o.id} o={o} />)}
                  {!orders.length && <p className="text-[15px] text-mute">No orders yet. Share your listings to get your first sale.</p>}
                </section>

                <section aria-label="Listings and reputation" className="grid grid-cols-2 gap-3">
                  <div className="card p-4"><p className="text-[13px] text-mute">Listings</p><p className="mt-1 text-[15px] leading-relaxed"><strong>{count("live")}</strong> live<br /><strong>{count("review")}</strong> in review<br /><strong>{count("returned")}</strong> returned</p></div>
                  <div className="card p-4"><p className="text-[13px] text-mute">Reputation</p><p className="mt-1 text-[15px] leading-relaxed"><strong>New</strong> seller<br /><strong>{orders.filter((o) => o.status === "disputed").length}</strong> open disputes<br /><strong>{orders.filter((o) => o.status === "refunded").length}</strong> refunds</p></div>
                </section>
              </>
            )}

            {view === "listings" && (
              listings.length ? (
                <div className="flex flex-col gap-2.5">
                  {listings.map((l) => {
                    const [label, tone] = LISTING_TONES[l.status] || LISTING_TONES.draft;
                    return (
                      <div key={l.id} className="card flex items-center gap-3 p-3.5">
                        <span className="h-12 w-12 flex-none rounded-xl" style={{ background: colorFor(l.id) }} />
                        <span className="min-w-0 flex-1">
                          <Link to={`/${l.kind === "product" ? "products" : "services"}/${l.id}`} className="block truncate font-bold text-ink no-underline hover:text-ink">{l.title || "Untitled"}</Link>
                          <span className="block text-[13px] text-mute">{l.kind === "product" ? "Digital product" : "Service"} · {alke(l.price || 0)}{l.reviewNote ? ` · ${l.reviewNote}` : ""}</span>
                        </span>
                        <Pill tone={tone}>{label}</Pill>
                        <Link to={`/seller/${l.kind === "product" ? "new-product" : "new-service"}?edit=${l.id}`} className="btn-text">Edit</Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon="grid" title="No listings yet" action={<Link to="/seller/new-product" className="btn-primary btn-sm">Create a listing</Link>}>
                  Products and services you create show here while they're reviewed and once they're live.
                </EmptyState>
              )
            )}

            {view === "orders" && (
              orders.length ? (
                <div className="card overflow-x-auto">
                  <table className="table-base">
                    <thead><tr><th scope="col">Order</th><th scope="col">Item</th><th scope="col">When</th><th scope="col">Gross</th><th scope="col">You get</th><th scope="col">Status</th></tr></thead>
                    <tbody>
                      {orders.map((o) => {
                        const [label, tone] = statusOf(o);
                        return (
                          <tr key={o.id}>
                            <td>{o.kind === "service" ? <Link to={`/orders/${o.id}`}>{o.id}</Link> : o.id}</td>
                            <td className="max-w-[240px] truncate">{o.title}</td>
                            <td>{relativeDay(o.paidAt || o.createdAt)}</td>
                            <td>{num(o.amount)}</td>
                            <td>{num(sellerShare(o.amount))}</td>
                            <td><Pill tone={tone}>{label}</Pill></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState icon="inbox" title="No orders yet" />
            )}
          </div>
        </main>
      </div>

      <nav aria-label="Seller center" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night md:hidden">
        <div className="flex h-[72px] items-stretch justify-around px-1 pb-2 pt-1.5">
          {NAV.map(([k, label, icon]) => (
            <button key={k} type="button" onClick={() => setView(k)} aria-current={view === k ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${view === k ? "font-extrabold text-ink" : "font-semibold text-dim"}`}>
              <Icon name={icon} size={24} />{label}
            </button>
          ))}
          <Link to="/" className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-dim no-underline hover:text-body"><Icon name="store" size={24} />Shop</Link>
        </div>
      </nav>
    </Shell>
  );
}

function OrderRow({ o }) {
  const [label, tone] = statusOf(o);
  const inner = (
    <>
      <span className="min-w-0 flex-1"><span className="block truncate font-bold">{o.title}</span><span className="block text-[13px] text-mute">{relativeDay(o.paidAt || o.createdAt)} · {o.id}</span></span>
      <span className="font-extrabold">{num(o.amount)}</span>
      <Pill tone={tone}>{label}</Pill>
    </>
  );
  return o.kind === "service"
    ? <Link to={`/orders/${o.id}`} className="flex items-center gap-3 border-b border-line py-3 text-ink no-underline last:border-b-0 hover:text-ink">{inner}</Link>
    : <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">{inner}</div>;
}

export default withSignIn(SellerCenter, { what: "your seller center", connect: true });
