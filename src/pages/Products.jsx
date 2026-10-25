import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { ProductCard } from "../components/Cards";
import { EmptyState, Icon, Sheet } from "../components/ui";
import { useStore } from "../lib/store";
import { allProducts, getSeller, search } from "../lib/market";
import { PRODUCT_CATEGORIES } from "../lib/catalog";

const PRICE_CAPS = [100, 300, 1000];
const SORTS = { popular: "Popular", newest: "Newest", "price-asc": "Price: low to high", "price-desc": "Price: high to low" };

export function SearchField({ id, value, onChange, placeholder, label }) {
  return (
    <form role="search" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="flex h-[50px] items-center gap-2.5 rounded-full border border-line bg-surface px-[18px] focus-within:border-violet">
        <Icon name="search" className="text-mute" />
        <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-dim" />
      </div>
    </form>
  );
}

export function ActiveFilter({ label, onRemove }) {
  return (
    <button type="button" onClick={onRemove} aria-label={`Remove filter: ${label}`}
      className="flex min-h-[32px] items-center gap-1.5 rounded-full bg-violet/15 px-3 text-[13px] font-bold text-violet-text">
      {label} <span aria-hidden>×</span>
    </button>
  );
}

export default function Products() {
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cat = params.get("cat") || "";
  const q = params.get("q") || "";
  const max = Number(params.get("max")) || 0;
  const format = params.get("format") || "";
  const sort = params.get("sort") || "popular";

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const all = allProducts(s);
  const formats = useMemo(() => [...new Set(all.flatMap((p) => p.formats || []))].sort(), [all]);
  let items = search(all, q).filter((p) => (!cat || p.category === cat) && (!max || p.price < max) && (!format || p.formats?.includes(format)));
  items = [...items].sort((a, b) =>
    sort === "newest" ? (b.createdAt > a.createdAt ? 1 : -1) :
      sort === "price-asc" ? a.price - b.price :
        sort === "price-desc" ? b.price - a.price : (b.sales || 0) - (a.sales || 0));
  const nFilters = (max ? 1 : 0) + (format ? 1 : 0);

  return (
    <Shell tab="products">
      <PageHeader title="Digital products" />
      <Page className="flex flex-col gap-3.5 pb-5 pt-1 md:gap-5">
        <div className="md:max-w-xl"><SearchField id="cat-search" value={q} onChange={(v) => set("q", v)} placeholder="Search templates, ebooks, kits" label="Search digital products" /></div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          <button type="button" onClick={() => set("cat", "")} aria-pressed={!cat} className={`chip ${!cat ? "chip-on" : ""}`}>All</button>
          {PRODUCT_CATEGORIES.map((c) => (
            <button type="button" key={c.id} onClick={() => set("cat", c.id)} aria-pressed={cat === c.id} className={`chip ${cat === c.id ? "chip-on" : ""}`}>{c.label}</button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-mute" aria-live="polite">{items.length} {items.length === 1 ? "result" : "results"}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setFiltersOpen(true)} className="btn-secondary btn-sm gap-1.5"><Icon name="filter" size={18} />Filters{nFilters ? ` · ${nFilters}` : ""}</button>
            <label className="relative">
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => set("sort", e.target.value === "popular" ? "" : e.target.value)}
                className="btn-secondary btn-sm cursor-pointer appearance-none bg-transparent pr-4">
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k} className="bg-surface">{v}</option>)}
              </select>
            </label>
          </div>
        </div>
        {nFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {max > 0 && <ActiveFilter label={`Under ${max.toLocaleString("en-US")} ALKE`} onRemove={() => set("max", "")} />}
            {format && <ActiveFilter label={format} onRemove={() => set("format", "")} />}
          </div>
        )}
        {items.length ? (
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 pt-1 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
            {items.map((p) => <ProductCard key={p.id} product={p} seller={getSeller(s, p.sellerId)} />)}
          </div>
        ) : (
          <EmptyState icon="search" title="Nothing matches yet" action={<Link to="/products" className="btn-secondary btn-sm">Clear search and filters</Link>}>
            Try fewer words or remove a filter.
          </EmptyState>
        )}
      </Page>

      {filtersOpen && (
        <Sheet title="Filters" onClose={() => setFiltersOpen(false)}>
          <fieldset className="mb-5">
            <legend className="label mb-2">Price</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => set("max", "")} aria-pressed={!max} className={`chip ${!max ? "chip-on" : ""}`}>Any</button>
              {PRICE_CAPS.map((c) => <button type="button" key={c} onClick={() => set("max", String(c))} aria-pressed={max === c} className={`chip ${max === c ? "chip-on" : ""}`}>Under {c.toLocaleString("en-US")}</button>)}
            </div>
          </fieldset>
          <fieldset className="mb-6">
            <legend className="label mb-2">Format</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => set("format", "")} aria-pressed={!format} className={`chip ${!format ? "chip-on" : ""}`}>Any</button>
              {formats.map((f) => <button type="button" key={f} onClick={() => set("format", f)} aria-pressed={format === f} className={`chip ${format === f ? "chip-on" : ""}`}>{f}</button>)}
            </div>
          </fieldset>
          <button type="button" onClick={() => setFiltersOpen(false)} className="btn-primary w-full">Show {items.length} {items.length === 1 ? "result" : "results"}</button>
        </Sheet>
      )}
    </Shell>
  );
}
