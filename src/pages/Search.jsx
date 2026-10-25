import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { ProductCard, ServiceCard, SellerChip } from "../components/Cards";
import { EmptyState } from "../components/ui";
import { SearchField } from "./Products";
import { useStore } from "../lib/store";
import { allProducts, allSellers, allServices, getSeller, search } from "../lib/market";

export default function Search() {
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const products = q ? search(allProducts(s), q) : [];
  const services = q ? search(allServices(s), q) : [];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const creators = q ? allSellers(s).filter((x) => words.every((w) => `${x.name} ${(x.tags || []).join(" ")}`.toLowerCase().includes(w))) : [];

  return (
    <Shell tab="home">
      <PageHeader title="Search" back="/" />
      <Page className="flex flex-col gap-6 pb-6 pt-1">
        <div className="md:max-w-xl"><SearchField id="all-search" value={q} onChange={(v) => setParams(v ? { q: v } : {}, { replace: true })} placeholder="Templates, logo design, tutoring" label="Search AlkeShop" /></div>
        {creators.length > 0 && (
          <section aria-labelledby="s-creators" className="flex flex-col gap-3">
            <h2 id="s-creators" className="h-section">Creators</h2>
            <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6">{creators.slice(0, 6).map((c) => <SellerChip key={c.id} seller={c} />)}</div>
          </section>
        )}
        {products.length > 0 && (
          <section aria-labelledby="s-products" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between"><h2 id="s-products" className="h-section">Digital products · {products.length}</h2><Link to={`/products?q=${encodeURIComponent(q)}`} className="text-sm font-semibold no-underline">See all</Link></div>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 md:grid-cols-4">{products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} seller={getSeller(s, p.sellerId)} />)}</div>
          </section>
        )}
        {services.length > 0 && (
          <section aria-labelledby="s-services" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between"><h2 id="s-services" className="h-section">Services · {services.length}</h2><Link to={`/services?q=${encodeURIComponent(q)}`} className="text-sm font-semibold no-underline">See all</Link></div>
            <div className="grid gap-3 md:grid-cols-3">{services.slice(0, 6).map((x) => <ServiceCard key={x.id} service={x} seller={getSeller(s, x.sellerId)} />)}</div>
          </section>
        )}
        {q && !products.length && !services.length && !creators.length && (
          <EmptyState icon="search" title={`Nothing for "${q}"`}>Try fewer or different words.</EmptyState>
        )}
      </Page>
    </Shell>
  );
}
