import React, { useState } from "react";
import { Link } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { Cover } from "../components/Cards";
import { EmptyState, Icon, Pill, Sheet } from "../components/ui";
import { useWallet } from "../wallet/WalletProvider";
import { withSignIn } from "../wallet/SignIn";
import { useStore, ordersOf, downloadFile } from "../lib/store";
import { getProduct } from "../lib/market";
import { LICENSES, PRODUCT_CATEGORIES } from "../lib/catalog";
import { date, fileSize, refTail } from "../lib/format";

// The files bought with this order; each opens a short-lived download link.
function DownloadSheet({ order, onClose }) {
  return (
    <Sheet title={order.title} subtitle={`${order.id} · ${(LICENSES[order.license] || LICENSES.commercial).label} license`} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {(order.files || []).map((f) => (
          <button key={f.path} type="button" onClick={() => downloadFile({ path: f.path, orderId: order.id })}
            className="card flex items-center gap-3 p-3 text-left hover:border-line-2">
            <Icon name="file" className="text-mute" />
            <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-bold">{f.name}</span><span className="block text-[13px] text-mute">{fileSize(f.size)}</span></span>
            <Icon name="download" size={18} className="text-violet-text" />
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-mute">Payment {refTail(order.payment.txHash)}{order.version ? ` · version ${order.version}` : ""}. Download again any time.</p>
    </Sheet>
  );
}

function Library() {
  const s = useStore();
  const { conn, openConnect } = useWallet();
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState(null);

  const owned = conn ? ordersOf(s, conn.address).filter((o) => o.kind === "product" && ["delivered", "refunded"].includes(o.status)) : [];
  const withProduct = owned.map((o) => ({ o, p: getProduct(s, o.itemId) }));
  const cats = PRODUCT_CATEGORIES.filter((c) => withProduct.some(({ p }) => p?.category === c.id));
  const shown = withProduct.filter(({ p }) => !cat || p?.category === cat);

  return (
    <Shell tab="library">
      <PageHeader title="My Library" />
      <Page className="flex flex-col gap-4 pb-6 pt-1">
        {!conn ? (
          <EmptyState icon="book" title="Your purchases will live here" action={<button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect Nuru Wallet</button>}>
            Connect the wallet you paid with to see your templates, ebooks and kits.
          </EmptyState>
        ) : !owned.length ? (
          <EmptyState icon="book" title="Your purchases will live here" action={<Link to="/products" className="btn-primary btn-sm">Browse digital products</Link>}>
            Templates, ebooks and kits you buy appear here, ready to download again any time.
          </EmptyState>
        ) : (
          <>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
              <button type="button" onClick={() => setCat("")} aria-pressed={!cat} className={`chip ${!cat ? "chip-on" : ""}`}>All · {owned.length}</button>
              {cats.map((c) => <button type="button" key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={`chip ${cat === c.id ? "chip-on" : ""}`}>{c.label}</button>)}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {shown.map(({ o, p }) => o.status === "refunded" ? (
                <article key={o.id} aria-label={`${o.title}, access removed`} className="card flex gap-3.5 p-4 opacity-70">
                  <div className="h-[72px] w-[72px] flex-none rounded-[14px] bg-raised" />
                  <div>
                    <h2 className="font-extrabold">{o.title}</h2>
                    <p className="text-[13px] text-mute">Refunded {date(o.refundedAt)} · {o.id}</p>
                    <Pill className="mt-2">Access removed</Pill>
                  </div>
                </article>
              ) : (
                <article key={o.id} className="card flex flex-col gap-3 p-4">
                  <div className="flex gap-3.5">
                    {p ? <Link to={`/products/${p.id}`} className="flex-none no-underline"><Cover product={p} className="h-[72px] w-[72px] !p-2 [&>p]:!text-[11px] [&>span]:hidden" /></Link> : <div className="h-[72px] w-[72px] rounded-[14px] bg-raised" />}
                    <div className="min-w-0">
                      <h2 className="font-extrabold leading-snug">{o.title}</h2>
                      <p className="text-[13px] text-mute">Bought {date(o.paidAt)} · {o.id}</p>
                      <div className="mt-2 flex gap-1.5">
                        <Pill tone="violet">{(LICENSES[o.license] || LICENSES.commercial).label}</Pill>
                        {o.version && <Pill>Version {o.version}</Pill>}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setOpen({ o, p })} className="btn-secondary btn-sm w-full">
                    <Icon name="download" size={18} />Download{o.size ? ` · ${fileSize(o.size)}` : ""}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </Page>
      {open && <DownloadSheet order={open.o} onClose={() => setOpen(null)} />}
    </Shell>
  );
}

export default withSignIn(Library, { what: "your library" });
