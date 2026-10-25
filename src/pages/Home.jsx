import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { ProductCard, ProductRow, SellerChip, ServiceRow } from "../components/Cards";
import { Icon } from "../components/ui";
import { useStore } from "../lib/store";
import { allProducts, allServices, getSeller } from "../lib/market";
import { PRODUCT_CATEGORIES, sellers } from "../lib/catalog";

const DIVISIONS = [
  { to: "/products", icon: "grid", bg: "#2B2D73", title: "Digital products", sub: "Templates, ebooks, kits, instant download" },
  { to: "/services", icon: "briefcase", bg: "#0F4C5C", title: "Hire a freelancer", sub: "Design, tech, writing, tutoring" },
  { to: "/credits", icon: "sparkle", bg: "#FFB38A", dark: true, title: "Nuru Credits", sub: "Power advanced Nuru AI features" },
];

function SectionHead({ id, title, to, linkText = "See all" }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 id={id} className="h-section">{title}</h2>
      {to && <Link to={to} className="text-sm font-semibold no-underline">{linkText}</Link>}
    </div>
  );
}

export default function Home() {
  const s = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const products = allProducts(s);
  const featured = products.filter((p) => p.featured);
  const newest = [...products].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 2);
  const popular = allServices(s).filter((x) => x.popular);
  const creators = ["kente-studio", "kofi-mensah", "aicha-diallo"].map((id) => sellers.find((x) => x.id === id));
  const seller = (id) => getSeller(s, id);

  return (
    <Shell tab="home">
      <PageHeader logo />
      <Page className="flex flex-col gap-7 pb-7 pt-2.5 md:gap-14 md:pt-12">
        {/* minmax(0, …): let columns shrink below the scrolling chip row's width on phones */}
        <section className="grid grid-cols-[minmax(0,1fr)] gap-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-12">
          <div className="flex flex-col gap-3 md:gap-5">
            <h1 className="text-[38px] font-extrabold leading-[1.03] tracking-[-0.04em] md:text-[64px]">Create. Sell.<br /><span className="text-violet-text">Earn ALKE.</span></h1>
            <p className="text-base leading-normal text-mute md:text-lg">Discover digital products, hire talented people, and power your Nuru experience, all with ALKE.</p>
            <form role="search" className="mt-1.5 md:hidden" onSubmit={(e) => { e.preventDefault(); nav(`/search?q=${encodeURIComponent(q)}`); }}>
              <label htmlFor="home-search" className="sr-only">Search AlkeShop</label>
              <div className="flex h-[52px] items-center gap-2.5 rounded-full border border-line bg-surface px-[18px] focus-within:border-violet">
                <Icon name="search" className="text-mute" />
                <input id="home-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Templates, logo design, tutoring"
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-dim" />
              </div>
            </form>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
              {PRODUCT_CATEGORIES.map((c, i) => (
                <Link key={c.id} to={`/products?cat=${c.id}`} className={`chip ${i === 0 ? "chip-on" : ""}`}>{c.label}</Link>
              ))}
              <Link to="/services?cat=design" className="chip hidden md:inline-flex">Logo design</Link>
              <Link to="/services?cat=technology" className="chip hidden md:inline-flex">Websites</Link>
            </div>
          </div>
          <nav aria-label="Divisions" className="grid grid-cols-3 gap-2.5 md:order-none md:grid-cols-1 md:gap-3">
            {DIVISIONS.map((d) => (
              <Link key={d.to} to={d.to} className="card flex flex-col gap-3 px-3 py-3.5 text-ink no-underline hover:border-line-2 hover:text-ink md:flex-row md:items-center md:gap-4 md:p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl md:h-12 md:w-12" style={{ background: d.bg, color: d.dark ? "#0B0B0F" : "#F5F5F7" }}>
                  <Icon name={d.icon} stroke={1.8} />
                </span>
                <span>
                  <span className="block text-sm font-bold leading-tight md:text-lg">{d.title}</span>
                  <span className="hidden text-sm text-mute md:block">{d.sub}</span>
                </span>
              </Link>
            ))}
          </nav>
        </section>

        <section aria-labelledby="featured-h" className="flex flex-col gap-3.5">
          <SectionHead id="featured-h" title="Featured products" to="/products" />
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-6">
            {featured.slice(0, 4).map((p, i) => (
              <div key={p.id} className={i > 1 ? "hidden md:block" : ""}><ProductCard product={p} seller={seller(p.sellerId)} /></div>
            ))}
          </div>
        </section>

        <section aria-labelledby="services-h" className="flex flex-col gap-2.5">
          <SectionHead id="services-h" title="Popular services" to="/services" />
          <div className="grid gap-2.5 md:grid-cols-3 md:gap-4">
            {popular.map((x, i) => <div key={x.id} className={i > 1 ? "hidden md:block" : ""}><ServiceRow service={x} seller={seller(x.sellerId)} /></div>)}
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-7 md:grid-cols-2 md:gap-6">
          <section aria-labelledby="credits-h" className="flex flex-col gap-2 rounded-[22px] border border-violet-edge bg-surface p-5 md:p-8">
            <span className="self-start rounded-full bg-peach px-2.5 py-[3px] text-xs font-extrabold text-night">Nuru Credits</span>
            <h2 id="credits-h" className="text-[19px] font-extrabold md:text-2xl">Do more with Nuru AI</h2>
            <p className="text-sm leading-normal text-mute md:text-base">Prepaid credits for advanced models, voice and document analysis. Paid in ALKE.</p>
            <Link to="/credits" className="btn-primary btn-sm mt-1 self-start">See credit packages</Link>
          </section>
          <section aria-labelledby="sell-h" className="order-last flex flex-col gap-2 rounded-[22px] bg-violet p-5 text-night md:order-none md:p-8">
            <h2 id="sell-h" className="text-xl font-extrabold md:text-2xl">Turn your skills into ALKE</h2>
            <p className="text-sm font-medium leading-normal md:text-base">Sell templates, guides and services to the Nuru community. No inventory needed.</p>
            <Link to="/sell" className="btn-dark btn-sm mt-1 self-start">Become a Seller</Link>
          </section>

          <section aria-labelledby="new-h" className="flex flex-col gap-3">
            <h2 id="new-h" className="h-section">New arrivals</h2>
            {newest.map((p) => <ProductRow key={p.id} product={p} seller={seller(p.sellerId)} />)}
          </section>
          <section aria-labelledby="creators-h" className="flex flex-col gap-3">
            <h2 id="creators-h" className="h-section">Recommended creators</h2>
            <div className="grid grid-cols-3 gap-2.5">{creators.map((c) => <SellerChip key={c.id} seller={c} />)}</div>
          </section>
        </div>
      </Page>
    </Shell>
  );
}
