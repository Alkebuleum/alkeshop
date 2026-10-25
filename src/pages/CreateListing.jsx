// New product (canvas 16) and new service (canvas 17) forms.
import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Cover } from "../components/Cards";
import { HeaderButton, Icon, Notice } from "../components/ui";
import { useWallet } from "../wallet/WalletProvider";
import { useStore, saveListing } from "../lib/store";
import { colorFor } from "../lib/market";
import { LICENSES, PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from "../lib/catalog";
import { FEE_LABEL, feeOf, sellerShare } from "../lib/config";
import { alke, fileSize } from "../lib/format";

const FORMAT_OF = (name) => (name.split(".").pop() || "").toUpperCase().slice(0, 6);

function Section({ id, n, title, children }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-b border-line pb-7">
      <h2 id={id} className="eyebrow">{n} · {title}</h2>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

function Frame({ title, onSaveDraft, children }) {
  return (
    <Shell footer={false}>
      <div className="mx-auto max-w-xl">
        <header className="flex h-[60px] items-center justify-between px-2">
          <div className="flex items-center gap-1"><HeaderButton to="/seller" icon="close" label="Close" /><h1 className="text-xl font-extrabold">{title}</h1></div>
          <button type="button" onClick={onSaveDraft} className="btn-text pr-3">Save draft</button>
        </header>
        {children}
      </div>
    </Shell>
  );
}

// Seller gate shared by both forms; returns the listing being edited, if any.
function useListingForm(kind) {
  const s = useStore();
  const { conn } = useWallet();
  const [params] = useSearchParams();
  const me = conn?.address.toLowerCase();
  const editing = s.listings.find((l) => l.id === params.get("edit") && l.sellerId === me && l.kind === kind);
  const ok = !!conn && s.sellers[me]?.status === "approved";
  return { conn, ok, editing };
}

function PriceRows({ price }) {
  return (
    <dl className="rows card px-4">
      <div><dt>Buyer pays</dt><dd>{alke(price)}</dd></div>
      <div><dt>Marketplace fee ({FEE_LABEL}, placeholder)</dt><dd>−{alke(feeOf(price))}</dd></div>
      <div><dt className="!font-bold !text-ink">You receive</dt><dd>{alke(sellerShare(price))}</dd></div>
    </dl>
  );
}

export function CreateProduct() {
  const nav = useNavigate();
  const { conn, ok, editing } = useListingForm("product");
  const [f, setF] = useState(() => editing || { kind: "product", title: "", category: "business", about: "", bullets: [], files: [], version: "1.0", license: "commercial", price: "" });
  if (!ok) return <Navigate to="/sell" replace />;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const price = Number(f.price) || 0;
  const ready = f.title.trim().length >= 4 && f.about.trim().length >= 20 && f.files.length > 0 && price > 0;

  const save = (status) => {
    const formats = [...new Set(f.files.map((x) => FORMAT_OF(x.name)).filter(Boolean))];
    saveListing(conn.address, { ...f, title: f.title.trim(), price, formats, status });
    nav("/seller");
  };
  const addFiles = (list) => setF((x) => ({ ...x, files: [...x.files, ...[...list].map((file) => ({ name: file.name, size: file.size }))] }));

  return (
    <Frame title={editing ? "Edit product" : "New product"} onSaveDraft={() => save("draft")}>
      <form className="flex flex-col gap-7 px-5 pb-12" onSubmit={(e) => { e.preventDefault(); if (ready) save("review"); }}>
        {editing?.status === "returned" && editing.reviewNote && <Notice tone="peach" icon="info">Returned by review: {editing.reviewNote}</Notice>}
        <Section id="cp-basics" n="1" title="BASICS">
          <Field id="cp-title" label="Title"><input id="cp-title" className="field" value={f.title} onChange={set("title")} /></Field>
          <Field id="cp-cat" label="Category">
            <select id="cp-cat" className="field" value={f.category} onChange={set("category")}>{PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </Field>
          <Field id="cp-desc" label="Description" hint="What's included and who it's for."><textarea id="cp-desc" rows={4} className="field" value={f.about} onChange={set("about")} /></Field>
        </Section>

        <Section id="cp-media" n="2" title="COVER">
          <Cover product={{ id: f.id || f.title, formats: [...new Set(f.files.map((x) => FORMAT_OF(x.name)))], cover: { bg: colorFor(f.id || f.title), label: f.title || "Your title", art: "text" } }} className="h-[180px] w-[180px]" />
          <p className="hint">The cover is drawn from your title. Previews must not include your full files.</p>
        </Section>

        <Section id="cp-files" n="3" title="FILES BUYERS RECEIVE">
          {f.files.map((x, i) => (
            <div key={`${x.name}-${i}`} className="card flex items-center gap-3 p-3">
              <Icon name="file" className="text-mute" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-bold">{x.name}</span><span className="block text-[13px] text-mute">{fileSize(x.size)}</span></span>
              <button type="button" onClick={() => setF((y) => ({ ...y, files: y.files.filter((_, j) => j !== i) }))} aria-label={`Remove ${x.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-ink"><Icon name="close" size={18} /></button>
            </div>
          ))}
          <label className="btn-secondary w-full cursor-pointer">
            <Icon name="upload" size={18} />Add files
            <input type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
          </label>
          <Notice tone="plain" icon="info">Files go to the AlkeShop file service for a safety scan once it's connected. This build records their names and sizes only.</Notice>
          <Field id="cp-ver" label="Version label"><input id="cp-ver" className="field" value={f.version} onChange={set("version")} /></Field>
        </Section>

        <Section id="cp-price" n="4" title="LICENSE AND PRICE">
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">License</legend>
            {Object.entries(LICENSES).map(([k, l]) => (
              <label key={k} className={`flex min-h-[60px] cursor-pointer items-center gap-3 rounded-[14px] border px-4 ${f.license === k ? "border-violet bg-violet/10" : "border-line-2"}`}>
                <input type="radio" name="lic" className="check" checked={f.license === k} onChange={() => setF((x) => ({ ...x, license: k }))} />
                <span><span className="block font-bold">{l.label}</span><span className="block text-[13px] text-mute">{l.short}</span></span>
              </label>
            ))}
          </fieldset>
          <Field id="cp-amt" label="Price">
            <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-line-2 bg-night px-[14px] focus-within:border-violet">
              <input id="cp-amt" inputMode="decimal" className="min-w-0 flex-1 bg-transparent text-base outline-none" value={f.price} onChange={(e) => setF((x) => ({ ...x, price: e.target.value.replace(/[^\d.]/g, "") }))} />
              <span className="text-sm font-bold text-mute">ALKE</span>
            </div>
          </Field>
          {price > 0 && <PriceRows price={price} />}
        </Section>

        <div className="flex flex-col gap-2">
          <button type="submit" disabled={!ready} className="btn-primary w-full">Submit for review</button>
          {!ready && <p className="text-center text-[13px] text-mute">Add a title, a description, at least one file and a price.</p>}
        </div>
      </form>
    </Frame>
  );
}

export function CreateService() {
  const nav = useNavigate();
  const { conn, ok, editing } = useListingForm("service");
  const [f, setF] = useState(() => editing || {
    kind: "service", title: "", category: "design", sub: "", scope: "", price: "", days: "4", revisions: "2",
    deliverables: [], needs: [], cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.", available: true, maxActive: "3",
  });
  const [newDeliv, setNewDeliv] = useState("");
  const [newNeed, setNewNeed] = useState({ q: "", type: "text", optional: false });
  if (!ok) return <Navigate to="/sell" replace />;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const digits = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value.replace(/\D/g, "") }));
  const price = Number(f.price) || 0;
  const ready = f.title.trim().length >= 6 && f.scope.trim().length >= 20 && price > 0 && Number(f.days) > 0 && f.deliverables.length > 0;

  const save = (status) => {
    saveListing(conn.address, { ...f, title: f.title.trim(), price, days: Number(f.days) || 1, revisions: Number(f.revisions) || 0, maxActive: Number(f.maxActive) || 1, status });
    nav("/seller");
  };

  return (
    <Frame title={editing ? "Edit service" : "New service"} onSaveDraft={() => save("draft")}>
      <form className="flex flex-col gap-7 px-5 pb-12" onSubmit={(e) => { e.preventDefault(); if (ready) save("review"); }}>
        {editing?.status === "returned" && editing.reviewNote && <Notice tone="peach" icon="info">Returned by review: {editing.reviewNote}</Notice>}
        <Section id="cs-basics" n="1" title="BASICS">
          <Field id="cs-title" label="Gig title" hint='Start with what you will do, e.g. "I will design a modern logo".'><input id="cs-title" className="field" value={f.title} onChange={set("title")} /></Field>
          <Field id="cs-cat" label="Category">
            <select id="cs-cat" className="field" value={f.category} onChange={set("category")}>{SERVICE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
          </Field>
          <Field id="cs-scope" label="Scope of work" hint="Say what's included and what isn't."><textarea id="cs-scope" rows={3} className="field" value={f.scope} onChange={set("scope")} /></Field>
        </Section>

        <Section id="cs-pkg" n="2" title="PACKAGE">
          <div className="grid grid-cols-3 gap-3">
            <Field id="cs-price" label="Price"><input id="cs-price" inputMode="decimal" className="field" value={f.price} onChange={(e) => setF((x) => ({ ...x, price: e.target.value.replace(/[^\d.]/g, "") }))} /></Field>
            <Field id="cs-days" label="Days"><input id="cs-days" inputMode="numeric" className="field" value={f.days} onChange={digits("days")} /></Field>
            <Field id="cs-rev" label="Revisions"><input id="cs-rev" inputMode="numeric" className="field" value={f.revisions} onChange={digits("revisions")} /></Field>
          </div>
          <p className="hint">Price in ALKE.{price > 0 && ` You receive ${alke(sellerShare(price))} after the ${FEE_LABEL} placeholder fee.`}</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Deliverables</legend>
            {f.deliverables.map((d, i) => (
              <span key={d} className="flex min-h-[44px] items-center gap-2 text-[15px]">
                <Icon name="check" size={18} className="text-ok" /><span className="flex-1">{d}</span>
                <button type="button" aria-label={`Remove ${d}`} onClick={() => setF((x) => ({ ...x, deliverables: x.deliverables.filter((_, j) => j !== i) }))} className="flex h-11 w-11 items-center justify-center text-mute hover:text-ink"><Icon name="close" size={16} /></button>
              </span>
            ))}
            <div className="flex gap-2">
              <label htmlFor="cs-deliv" className="sr-only">New deliverable</label>
              <input id="cs-deliv" className="field" placeholder="e.g. 3 logo concepts" value={newDeliv} onChange={(e) => setNewDeliv(e.target.value)} />
              <button type="button" disabled={!newDeliv.trim()} onClick={() => { setF((x) => ({ ...x, deliverables: [...x.deliverables, newDeliv.trim()] })); setNewDeliv(""); }} className="btn-secondary btn-sm min-h-[50px] flex-none">Add</button>
            </div>
          </fieldset>
        </Section>

        <Section id="cs-req" n="3" title="WHAT YOU NEED FROM BUYERS">
          {f.needs.map((n, i) => (
            <div key={n.q} className="card flex items-center gap-3 p-3">
              <span className="flex-1 text-[15px] font-bold">{n.q}</span>
              <span className="text-[13px] text-mute">{n.type === "file" ? "File" : "Text"}{n.optional ? ", optional" : ""}</span>
              <button type="button" aria-label={`Remove question: ${n.q}`} onClick={() => setF((x) => ({ ...x, needs: x.needs.filter((_, j) => j !== i) }))} className="flex h-11 w-11 items-center justify-center text-mute hover:text-ink"><Icon name="close" size={16} /></button>
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-[14px] border border-dashed border-line-2 p-3">
            <label htmlFor="cs-need" className="label">Add a question</label>
            <input id="cs-need" className="field" placeholder="e.g. Your business name" value={newNeed.q} onChange={(e) => setNewNeed((x) => ({ ...x, q: e.target.value }))} />
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex min-h-[44px] items-center gap-2"><input type="radio" name="need-type" className="check" checked={newNeed.type === "text"} onChange={() => setNewNeed((x) => ({ ...x, type: "text" }))} />Text answer</label>
              <label className="flex min-h-[44px] items-center gap-2"><input type="radio" name="need-type" className="check" checked={newNeed.type === "file"} onChange={() => setNewNeed((x) => ({ ...x, type: "file" }))} />File</label>
              <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" className="check" checked={newNeed.optional} onChange={(e) => setNewNeed((x) => ({ ...x, optional: e.target.checked }))} />Optional</label>
            </div>
            <button type="button" disabled={!newNeed.q.trim()} onClick={() => { setF((x) => ({ ...x, needs: [...x.needs, { ...newNeed, q: newNeed.q.trim() }] })); setNewNeed({ q: "", type: "text", optional: false }); }} className="btn-secondary btn-sm self-start">Add question</button>
          </div>
        </Section>

        <Section id="cs-pol" n="4" title="POLICIES AND AVAILABILITY">
          <Field id="cs-cancel" label="Cancellation policy">
            <select id="cs-cancel" className="field" value={f.cancellation} onChange={set("cancellation")}>
              <option value="Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.">Standard: full refund if over 24 h late</option>
              <option value="Full refund before work starts. After that, refunds only through a dispute.">Strict: refund only before work starts</option>
            </select>
          </Field>
          <label htmlFor="cs-avail" className="flex min-h-[44px] items-center justify-between gap-3">
            <span className="label">Taking new orders</span>
            <input type="checkbox" id="cs-avail" role="switch" className="check" checked={f.available} onChange={(e) => setF((x) => ({ ...x, available: e.target.checked }))} />
          </label>
          <Field id="cs-max" label="Most active orders at once"><input id="cs-max" inputMode="numeric" className="field" value={f.maxActive} onChange={digits("maxActive")} /></Field>
        </Section>

        <div className="flex flex-col gap-2">
          <button type="submit" disabled={!ready} className="btn-primary w-full">Submit for review</button>
          {!ready && <p className="text-center text-[13px] text-mute">Add a title, scope, price, delivery days and at least one deliverable.</p>}
          <Link to="/terms/seller" className="btn-text justify-center">Seller terms</Link>
        </div>
      </form>
    </Frame>
  );
}
