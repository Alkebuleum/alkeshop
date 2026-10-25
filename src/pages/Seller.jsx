import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell, { Page } from "../components/Shell";
import { ProductCard, ServiceCard } from "../components/Cards";
import { Avatar, EmptyState, HeaderButton, Icon } from "../components/ui";
import { Reviews } from "./Product";
import { useStore } from "../lib/store";
import { allProducts, allServices, getSeller } from "../lib/market";
import { initials, monthYear } from "../lib/format";
import NotFound from "./NotFound";

export default function Seller() {
  const { id } = useParams();
  const s = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState("products");
  const seller = getSeller(s, id);
  if (!seller) return <NotFound />;
  const products = allProducts(s).filter((p) => p.sellerId === seller.id);
  const services = allServices(s).filter((x) => x.sellerId === seller.id);
  const reviews = [...products, ...services].flatMap((x) => x.reviews || []);
  const tabs = [["products", `Products · ${products.length}`], ["services", `Services · ${services.length}`], ["reviews", `Reviews · ${seller.reviews}`]];

  const share = () => navigator.share ? navigator.share({ title: seller.name, url: window.location.href }).catch(() => { }) : navigator.clipboard?.writeText(window.location.href);

  return (
    <Shell tab="none">
      <header className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between px-2 md:px-6">
        <HeaderButton onClick={() => nav(-1)} label="Back" />
        <button type="button" onClick={share} aria-label="Share profile" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"><Icon name="share" /></button>
      </header>
      <Page className="flex flex-col gap-5 pb-6 md:max-w-[960px]">
        <section className="flex flex-col items-center gap-2 text-center">
          <Avatar initials={initials(seller.name)} color={seller.color} dark={seller.dark} size={88} />
          <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em]">{seller.name}</h1>
          {seller.verified && <span className="flex items-center gap-1.5 rounded-full bg-violet/15 px-3 py-1 text-[13px] font-bold text-violet-text"><Icon name="shieldCheck" size={16} />Verified seller</span>}
          <p className="text-sm text-mute">{seller.type} · {seller.country}{seller.langs ? ` · ${seller.langs}` : ""} · Joined {monthYear(seller.joined)}</p>
        </section>
        <dl className="card grid grid-cols-3 divide-x divide-line py-3 text-center">
          <div><dt className="text-[13px] text-mute">Rating</dt><dd className="text-lg font-extrabold">{seller.rating ? `★ ${seller.rating}` : "New"}</dd></div>
          <div><dt className="text-[13px] text-mute">Completed</dt><dd className="text-lg font-extrabold">{seller.completed}</dd></div>
          <div><dt className="text-[13px] text-mute">Listings</dt><dd className="text-lg font-extrabold">{products.length + services.length}</dd></div>
        </dl>
        {seller.bio && <p className="text-base leading-relaxed text-body">{seller.bio}</p>}
        {seller.tags?.length > 0 && <div className="flex flex-wrap gap-2">{seller.tags.map((t) => <span key={t} className="rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold">{t}</span>)}</div>}
        <nav aria-label="Profile sections" className="flex border-b border-line">
          {tabs.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}
              className={`min-h-[48px] flex-1 border-b-2 text-sm font-bold ${tab === k ? "border-ink text-ink" : "border-transparent text-dim"}`}>{label}</button>
          ))}
        </nav>
        {tab === "products" && (products.length
          ? <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 md:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} seller={seller} showRating={false} />)}</div>
          : <EmptyState icon="grid" title="No products yet" />)}
        {tab === "services" && (services.length
          ? <div className="grid gap-3 md:grid-cols-2">{services.map((x) => <ServiceCard key={x.id} service={x} seller={seller} />)}</div>
          : <EmptyState icon="briefcase" title="No services yet" />)}
        {tab === "reviews" && <Reviews id="seller-reviews" rating={seller.rating} count={seller.reviews} reviews={reviews} verifiedLabel="Verified buyer" />}
      </Page>
    </Shell>
  );
}
