import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Shell, { Page } from "../components/Shell";
import { Cover } from "../components/Cards";
import { Avatar, HeaderButton, Icon, Notice, Stars } from "../components/ui";
import { useWallet } from "../wallet/WalletProvider";
import { useStore, startCheckout, toggleFavorite, ordersOf } from "../lib/store";
import { getProduct, getSeller } from "../lib/market";
import { LICENSES, PRODUCT_CATEGORIES } from "../lib/catalog";
import { alke, fileSize, initials, monthYear } from "../lib/format";
import NotFound from "./NotFound";

// Back, share and save, floating over the cover on phones.
export function DetailActions({ back, backLabel, id, title }) {
  const s = useStore();
  const saved = s.favorites.includes(id);
  const [shared, setShared] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1500); }
    } catch { }
  };
  const round = "flex h-11 w-11 items-center justify-center rounded-full bg-night/60 text-ink backdrop-blur hover:bg-night hover:text-ink";
  return (
    <div className="flex items-center justify-between">
      <span className="rounded-full bg-night/60 backdrop-blur md:bg-transparent"><HeaderButton to={back} label={backLabel} /></span>
      <div className="flex gap-2">
        <button type="button" onClick={share} aria-label={shared ? "Link copied" : "Share"} className={round}><Icon name={shared ? "check" : "share"} /></button>
        <button type="button" onClick={() => toggleFavorite(id)} aria-label={saved ? "Remove from favorites" : "Save to favorites"} aria-pressed={saved} className={round}>
          <Icon name="heart" className={saved ? "fill-peach text-peach" : ""} />
        </button>
      </div>
    </div>
  );
}

export function SellerLink({ seller, line }) {
  return (
    <Link to={`/sellers/${seller.id}`} className="card flex items-center gap-3 p-3 text-ink no-underline hover:border-line-2 hover:text-ink">
      <Avatar initials={initials(seller.name)} color={seller.color} dark={seller.dark} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{seller.name}</span>
        <span className="block text-[13px] text-mute">{line}</span>
      </span>
      <Icon name="chevron" className="text-mute" />
    </Link>
  );
}

export function Reviews({ id, rating, count, reviews, verifiedLabel }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between"><h2 id={id} className="h-section">Reviews</h2><p className="text-sm font-bold"><Stars rating={rating} />{rating ? ` · ${count}` : ""}</p></div>
      {reviews.length ? reviews.map((r) => (
        <article key={r.name} className="card p-4">
          <p className="text-sm font-bold">{r.name} <span className="font-medium text-mute">· {verifiedLabel}</span></p>
          <p className="mt-1 text-[15px] leading-relaxed text-body">{r.text}</p>
        </article>
      )) : <p className="text-[15px] text-mute">No reviews yet.</p>}
    </section>
  );
}

export function BuyBar({ price, sub, children }) {
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-night/95 backdrop-blur md:static md:mt-6 md:rounded-[18px] md:border md:bg-surface">
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-5 py-3 md:p-5">
        <p className="flex flex-col"><span className="text-lg font-extrabold">{price}</span><span className="text-[13px] text-mute">{sub}</span></p>
        <div className="ml-auto flex-1 md:flex-none">{children}</div>
      </div>
    </div>
  );
}

function Previews() {
  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div role="img" aria-label="Preview: plan outline" className="flex h-40 w-[130px] flex-none flex-col gap-2 rounded-[14px] bg-white/90 p-3">
        <div className="h-2 w-3/4 rounded bg-[#2B2D73]" />{[1, 2, 3].map((i) => <div key={i} className="h-1.5 rounded bg-[#D6D8E8]" />)}
      </div>
      <div role="img" aria-label="Preview: forecast sheet" className="grid h-40 w-[130px] flex-none grid-cols-3 content-start gap-1 rounded-[14px] bg-white/90 p-3">
        {Array.from({ length: 15 }, (_, i) => <div key={i} className="h-3 rounded-sm" style={{ background: i < 3 ? "#2B2D73" : "#DCE3EC" }} />)}
      </div>
      <div role="img" aria-label="Preview: summary page" className="flex h-40 w-[130px] flex-none flex-col justify-end gap-2 rounded-[14px] bg-[#2B2D73] p-3">
        <div className="h-2 w-2/3 rounded bg-white/80" /><div className="h-1.5 w-1/2 rounded bg-white/40" />
      </div>
    </div>
  );
}

export default function Product() {
  const { id } = useParams();
  const s = useStore();
  const nav = useNavigate();
  const { conn, ensureConnected } = useWallet();
  const [err, setErr] = useState(null);
  const p = getProduct(s, id);
  if (!p) return <NotFound />;
  const seller = getSeller(s, p.sellerId);
  const license = LICENSES[p.license] || LICENSES.commercial;
  const cat = PRODUCT_CATEGORIES.find((c) => c.id === p.category);
  const owned = conn && ordersOf(s, conn.address).find((o) => o.itemId === p.id && o.status === "delivered");
  const isOwn = conn && p.sellerId === conn.address.toLowerCase();
  const notLive = p.status && p.status !== "live";

  const buy = async () => {
    setErr(null);
    try {
      const c = await ensureConnected();
      nav(`/checkout/${startCheckout({ kind: "product", item: p, buyer: c.address })}`);
    } catch (e) {
      if (!/cancelled/.test(e.message)) setErr(e.message);
    }
  };

  return (
    <Shell>
      <Page className="px-0 pb-28 md:px-8 md:pb-0 md:pt-6">
        <div className="md:grid md:grid-cols-[1fr_440px] md:gap-12">
          <div className="md:sticky md:top-[96px] md:self-start">
            <div className="relative">
              <div className="absolute inset-x-4 top-3 z-10 md:static md:mb-4"><DetailActions back="/products" backLabel="Back to products" id={p.id} title={p.title} /></div>
              <Cover product={p} big className="h-[300px] rounded-none p-6 pt-20 md:h-[440px] md:rounded-[22px] md:p-8" />
            </div>
            <section aria-labelledby="preview-h" className="hidden flex-col gap-3 md:mt-8 md:flex">
              <h2 id="preview-h" className="h-section">Previews</h2>
              <Previews />
            </section>
          </div>

          <div className="flex flex-col gap-6 px-5 pt-5 md:px-0 md:pt-14">
            {notLive && <Notice tone="violet" icon="info">This is a preview of your listing. Buyers can't see it until it's approved.</Notice>}
            <div className="flex flex-col gap-3">
              {cat && <Link to={`/products?cat=${cat.id}`} className="text-sm font-bold no-underline">{cat.label}</Link>}
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] md:text-4xl">{p.title}</h1>
              {seller && <SellerLink seller={seller} line={<><Stars rating={seller.rating} />{seller.reviews ? ` · ${seller.reviews} reviews` : ""}{seller.verified ? " · Verified seller" : ""}</>} />}
            </div>
            <div>
              <p className="text-[32px] font-extrabold leading-none tracking-[-0.02em]">{alke(p.price)}</p>
              <p className="mt-2 text-[13px] text-mute">The network fee is shown in your wallet before you approve.</p>
            </div>
            <dl className="rows card px-4">
              <div><dt>Formats</dt><dd>{(p.formats || []).join(", ")}</dd></div>
              <div><dt>Files</dt><dd>{p.files} {p.files === 1 ? "file" : "files"}{p.size ? ` · ${fileSize(p.size)}` : ""}</dd></div>
              {p.version && <div><dt>Version</dt><dd>{p.version}{p.updated ? ` · ${monthYear(p.updated)}` : ""}</dd></div>}
              <div><dt>Delivery</dt><dd>Instant, in Library</dd></div>
            </dl>
            <section aria-labelledby="license-h" className="card flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2"><Icon name="shieldCheck" className="text-violet" /><h2 id="license-h" className="font-extrabold">{license.label} license</h2></div>
              <p className="text-[15px] leading-relaxed text-body">{license.text}</p>
              <Link to="/terms/licenses" className="text-sm font-semibold no-underline">Read the full license</Link>
            </section>
            <section aria-labelledby="about-h" className="flex flex-col gap-2">
              <h2 id="about-h" className="h-section">About this product</h2>
              <p className="text-base leading-relaxed text-body">{p.about}</p>
              {p.bullets?.length > 0 && (
                <ul className="mt-1 flex flex-col gap-2">
                  {p.bullets.map((b) => <li key={b} className="flex gap-2 text-[15px] text-body"><Icon name="check" size={18} className="mt-0.5 text-ok" />{b}</li>)}
                </ul>
              )}
            </section>
            <section aria-labelledby="preview-h-m" className="flex flex-col gap-3 md:hidden">
              <h2 id="preview-h-m" className="h-section">Previews</h2>
              <Previews />
            </section>
            <section aria-labelledby="refund-h" className="flex gap-3 rounded-[18px] bg-surface p-4">
              <Icon name="revise" className="mt-0.5 text-mute" />
              <div><h2 id="refund-h" className="font-extrabold">Refund policy</h2><p className="text-[15px] text-body">Refunds within 7 days if files are missing, broken or not as described.</p></div>
            </section>
            <Reviews id="reviews-h" rating={p.rating} count={p.reviewCount} reviews={p.reviews || []} verifiedLabel="Verified purchase" />
            {err && <p role="alert" className="text-sm text-bad">{err}</p>}
            <BuyBar price={alke(p.price)} sub={`${license.label} license`}>
              {owned ? <Link to="/library" className="btn-secondary w-full">In your Library</Link>
                : isOwn || notLive ? <span className="btn w-full bg-raised font-bold text-dim">Your listing</span>
                  : <button type="button" onClick={buy} className="btn-primary w-full md:px-10">Buy with ALKE</button>}
            </BuyBar>
          </div>
        </div>
      </Page>
    </Shell>
  );
}
