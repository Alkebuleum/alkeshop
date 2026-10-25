import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell, { Page } from "../components/Shell";
import { ServiceThumb } from "../components/Cards";
import { Icon, Notice, Sheet, Stars } from "../components/ui";
import { DetailActions, SellerLink, Reviews, BuyBar } from "./Product";
import { useWallet } from "../wallet/WalletProvider";
import { useStore, requestService, ordersOf } from "../lib/store";
import { getService, getSeller } from "../lib/market";
import { SERVICE_CATEGORIES } from "../lib/catalog";
import { alke, fileSize } from "../lib/format";
import NotFound from "./NotFound";

// The seller's questions, answered before the request is sent.
function RequestSheet({ service, seller, onClose, onSent }) {
  const [answers, setAnswers] = useState(service.needs.map((n) => ({ q: n.q, a: "", files: [] })));
  const missing = service.needs.some((n, i) => !n.optional && (n.type === "file" ? !answers[i].files.length : !answers[i].a.trim()));
  const setAt = (i, patch) => setAnswers((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const first = seller.name.split(" ")[0];

  return (
    <Sheet title={`What ${first} needs from you`} subtitle={`${service.packageName} · ${alke(service.price)}`} onClose={onClose} wide>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (!missing) onSent(answers); }}>
        {service.needs.map((n, i) => (
          <div key={n.q} className="flex flex-col gap-2">
            <label htmlFor={`need-${i}`} className="label">{n.q}{n.optional && <span className="font-medium text-mute"> (optional)</span>}</label>
            {n.type === "file" ? (
              <>
                <input id={`need-${i}`} type="file" multiple
                  onChange={(e) => setAt(i, { files: [...e.target.files].map((f) => ({ name: f.name, size: f.size })) })}
                  className="text-sm text-body file:mr-3 file:min-h-[40px] file:rounded-full file:border file:border-line-2 file:bg-transparent file:px-4 file:font-bold file:text-ink" />
                {answers[i].files.map((f) => <span key={f.name} className="hint">{f.name} · {fileSize(f.size)}</span>)}
              </>
            ) : (
              <textarea id={`need-${i}`} rows={2} className="field" value={answers[i].a} onChange={(e) => setAt(i, { a: e.target.value })} />
            )}
          </div>
        ))}
        <Notice tone="plain" icon="info">You pay only after {first} accepts your request. Nothing is charged now.</Notice>
        <button type="submit" disabled={missing} className="btn-primary w-full">Send request</button>
      </form>
    </Sheet>
  );
}

export default function Gig() {
  const { id } = useParams();
  const s = useStore();
  const nav = useNavigate();
  const { conn, ensureConnected } = useWallet();
  const [asking, setAsking] = useState(false);
  const x = getService(s, id);
  if (!x) return <NotFound />;
  const seller = getSeller(s, x.sellerId);
  const first = seller?.name.split(" ")[0];
  const cat = SERVICE_CATEGORIES.find((c) => c.id === x.category);
  const open = conn && ordersOf(s, conn.address).find((o) => o.itemId === x.id && ["requested", "awaiting_payment", "confirming", "active", "delivered"].includes(o.status));
  const isOwn = conn && x.sellerId === conn.address.toLowerCase();
  const notLive = x.status && x.status !== "live";

  const start = async () => {
    try {
      await ensureConnected();
      setAsking(true);
    } catch { }
  };
  const send = (answers) => nav(`/orders/${requestService({ service: x, buyer: conn.address, answers })}`);

  return (
    <Shell>
      <Page className="px-0 pb-28 md:px-8 md:pb-0 md:pt-6">
        <div className="md:grid md:grid-cols-[1fr_440px] md:gap-12">
          <div className="md:sticky md:top-[96px] md:self-start">
            <div className="relative">
              <div className="absolute inset-x-4 top-3 z-10 md:static md:mb-4"><DetailActions back="/services" backLabel="Back to services" id={x.id} title={x.title} /></div>
              <div role="img" aria-label={`Portfolio sample: ${x.sub || x.title}`} className="flex h-[280px] items-center justify-center md:h-[440px] md:rounded-[22px]" style={{ background: x.thumb?.bg }}>
                <ServiceThumb service={x} className="h-32 w-32 rounded-[28px] bg-white/10 text-5xl" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 px-5 pt-5 md:px-0 md:pt-14">
            {notLive && <Notice tone="violet" icon="info">This is a preview of your listing. Buyers can't see it until it's approved.</Notice>}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-violet-text">{cat?.label}{x.sub ? ` · ${x.sub}` : ""}</p>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] md:text-4xl">{x.title}</h1>
            </div>
            {seller && <SellerLink seller={seller} line={<>{seller.country}{seller.langs ? ` · ${seller.langs}` : ""}<br /><Stars rating={seller.rating} count={seller.reviews} /> · {seller.completed} orders completed</>} />}

            <section aria-labelledby="pkg-h" className="card flex flex-col gap-3 p-4">
              <div className="flex items-baseline justify-between"><h2 id="pkg-h" className="font-extrabold">{x.packageName}</h2><p className="text-xl font-extrabold">{alke(x.price)}</p></div>
              <div className="flex gap-4 text-sm font-bold text-body">
                <span className="flex items-center gap-1.5"><Icon name="clock" size={18} className="text-mute" />{x.days}-day delivery</span>
                <span className="flex items-center gap-1.5"><Icon name="revise" size={18} className="text-mute" />{x.revisions} {x.revisions === 1 ? "revision" : "revisions"}</span>
              </div>
              <ul className="flex flex-col gap-2">
                {(x.deliverables || []).map((d) => <li key={d} className="flex gap-2 text-[15px] text-body"><Icon name="check" size={18} className="mt-0.5 text-ok" />{d}</li>)}
              </ul>
              <p className="border-t border-line pt-3 text-[13px] text-mute">You pay only after {first} accepts your request. Nothing is charged now.</p>
            </section>

            <section aria-labelledby="scope-h" className="flex flex-col gap-2">
              <h2 id="scope-h" className="h-section">Scope of work</h2>
              <p className="text-base leading-relaxed text-body">{x.scope}</p>
            </section>
            <section aria-labelledby="needs-h" className="flex flex-col gap-2">
              <h2 id="needs-h" className="h-section">What {first} needs from you</h2>
              <ol className="ml-5 list-decimal space-y-1 text-[15px] text-body">
                {(x.needs || []).map((n) => <li key={n.q}>{n.q}{n.optional ? " (optional)" : ""}</li>)}
              </ol>
            </section>
            <dl className="rows card px-4">
              <div><dt>Availability</dt><dd className={seller?.away ? "text-peach" : ""}>{seller?.away || "Taking orders"}</dd></div>
              <div className="flex-col !items-start gap-1"><dt>Cancellation</dt><dd className="!text-left !font-medium text-body">{x.cancellation}</dd></div>
            </dl>
            <Reviews id="gig-reviews-h" rating={x.rating} count={x.reviewCount} reviews={x.reviews || []} verifiedLabel="Verified order" />

            <BuyBar price={alke(x.price)} sub={`${x.days}-day delivery`}>
              {open ? <Link to={`/orders/${open.id}`} className="btn-secondary w-full">View your order</Link>
                : isOwn || notLive ? <span className="btn w-full bg-raised font-bold text-dim">Your listing</span>
                  : seller?.away ? <span className="btn w-full bg-raised font-bold text-dim">{seller.away}</span>
                    : <button type="button" onClick={start} className="btn-primary w-full md:px-10">Request this service</button>}
            </BuyBar>
          </div>
        </div>
      </Page>
      {asking && <RequestSheet service={x} seller={seller} onClose={() => setAsking(false)} onSent={send} />}
    </Shell>
  );
}
