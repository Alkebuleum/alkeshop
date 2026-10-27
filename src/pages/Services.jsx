import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { ServiceCard } from "../components/Cards";
import { EmptyState, Icon, Sheet } from "../components/ui";
import { SearchField, ActiveFilter } from "./Products";
import { useStore } from "../lib/store";
import { allServices, getSeller, search } from "../lib/market";
import { SERVICE_CATEGORIES } from "../lib/catalog";
import { useTitle } from "../lib/useTitle";

const DAYS = [2, 4, 7];
const BUDGETS = [200, 500, 1000];

export default function Services() {
  useTitle("Freelance services");
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const [sheet, setSheet] = useState(null); // "filters" | "days" | "budget"
  const cat = params.get("cat") || "";
  const q = params.get("q") || "";
  const days = Number(params.get("days")) || 0;
  const budget = Number(params.get("budget")) || 0;
  const available = params.get("available") === "1";

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const items = search(allServices(s), q).filter((x) => {
    const seller = getSeller(s, x.sellerId);
    return (!cat || x.category === cat) && (!days || x.days <= days) && (!budget || x.price <= budget) && (!available || !seller?.away);
  });
  const catLabel = SERVICE_CATEGORIES.find((c) => c.id === cat)?.label;

  const Options = ({ k, values, fmt, current }) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => { set(k, ""); setSheet(null); }} aria-pressed={!current} className={`chip ${!current ? "chip-on" : ""}`}>Any</button>
      {values.map((v) => <button type="button" key={v} onClick={() => { set(k, String(v)); setSheet(null); }} aria-pressed={current === v} className={`chip ${current === v ? "chip-on" : ""}`}>{fmt(v)}</button>)}
    </div>
  );

  return (
    <Shell tab="services">
      <PageHeader title="Services" />
      <Page className="flex flex-col gap-3.5 pb-5 pt-1 md:gap-5">
        <div className="md:max-w-xl"><SearchField id="svc-search" value={q} onChange={(v) => set("q", v)} placeholder="Logo design, websites, tutoring" label="Search services" /></div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          <button type="button" onClick={() => set("cat", "")} aria-pressed={!cat} className={`chip ${!cat ? "chip-on" : ""}`}>All</button>
          {SERVICE_CATEGORIES.map((c) => (
            <button type="button" key={c.id} onClick={() => set("cat", c.id)} aria-pressed={cat === c.id} className={`chip ${cat === c.id ? "chip-on" : ""}`}>{c.label}</button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button type="button" onClick={() => setSheet("filters")} className="btn-secondary btn-sm flex-none gap-1.5"><Icon name="filter" size={18} />Filters</button>
          <button type="button" onClick={() => setSheet("days")} className="btn-secondary btn-sm flex-none">{days ? `Up to ${days} days` : "Delivery time"}</button>
          <button type="button" onClick={() => setSheet("budget")} className="btn-secondary btn-sm flex-none">{budget ? `Up to ${budget} ALKE` : "Budget"}</button>
        </div>
        {(available || days > 0 || budget > 0) && (
          <div className="flex flex-wrap gap-2">
            {available && <ActiveFilter label="Available now" onRemove={() => set("available", "")} />}
            {days > 0 && <ActiveFilter label={`Up to ${days} days`} onRemove={() => set("days", "")} />}
            {budget > 0 && <ActiveFilter label={`Up to ${budget} ALKE`} onRemove={() => set("budget", "")} />}
          </div>
        )}
        <p className="text-sm text-mute" aria-live="polite">{items.length} {items.length === 1 ? "service" : "services"}{catLabel ? ` in ${catLabel}` : ""}</p>
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {items.map((x) => <ServiceCard key={x.id} service={x} seller={getSeller(s, x.sellerId)} />)}
          </div>
        ) : (
          <EmptyState icon="search" title="No services match" action={<Link to="/services" className="btn-secondary btn-sm">Clear search and filters</Link>}>
            Try another category or a bigger budget.
          </EmptyState>
        )}
      </Page>

      {sheet === "filters" && (
        <Sheet title="Filters" onClose={() => setSheet(null)}>
          <label className="mb-6 flex min-h-[44px] items-center justify-between gap-3">
            <span className="label">Only sellers taking orders now</span>
            <input type="checkbox" role="switch" className="check" checked={available} onChange={(e) => set("available", e.target.checked ? "1" : "")} />
          </label>
          <button type="button" onClick={() => setSheet(null)} className="btn-primary w-full">Show {items.length} {items.length === 1 ? "service" : "services"}</button>
        </Sheet>
      )}
      {sheet === "days" && <Sheet title="Delivery time" onClose={() => setSheet(null)}><Options k="days" values={DAYS} current={days} fmt={(v) => `Up to ${v} days`} /></Sheet>}
      {sheet === "budget" && <Sheet title="Budget" onClose={() => setSheet(null)}><Options k="budget" values={BUDGETS} current={budget} fmt={(v) => `Up to ${v.toLocaleString("en-US")} ALKE`} /></Sheet>}
    </Shell>
  );
}
