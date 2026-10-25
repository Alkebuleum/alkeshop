import React from "react";
import { Link } from "react-router-dom";
import { Avatar, Icon, Stars } from "./ui";
import { alke, initials } from "../lib/format";
import { colorFor } from "../lib/market";

// The small drawings on product covers, from the canvas catalog screen.
function Art({ kind }) {
  if (kind === "invoice") {
    return (
      <div className="flex flex-col gap-1 rounded-lg bg-white/90 p-2" aria-hidden>
        <div className="flex justify-between"><div className="h-[5px] w-2/5 rounded bg-[#1E3A5F]" /><div className="h-[5px] w-1/5 rounded bg-[#9FB3CC]" /></div>
        <div className="h-1 rounded bg-[#DCE3EC]" /><div className="h-1 rounded bg-[#DCE3EC]" />
        <div className="h-[5px] w-[30%] self-end rounded bg-[#1E3A5F]" />
      </div>
    );
  }
  if (kind === "bars") {
    return (
      <div className="flex h-14 items-end gap-1.5" aria-hidden>
        {[40, 75, 55, 95].map((h, i) => <div key={i} className="flex-1 rounded" style={{ height: `${h}%`, background: i % 2 ? "#FFB38A" : "rgba(255,179,138,.5)" }} />)}
      </div>
    );
  }
  if (kind === "grid") {
    return (
      <div className="grid grid-cols-4 gap-[3px]" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => <div key={i} className="h-2.5 rounded-sm" style={{ background: i < 4 ? "#C4B5FD" : i % 4 === 3 ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.85)" }} />)}
      </div>
    );
  }
  if (kind === "slide") {
    return (
      <div className="flex h-14 gap-1.5 rounded-lg bg-white/90 p-2" aria-hidden>
        <div className="w-[34%] rounded bg-[#0F4C5C]" />
        <div className="flex flex-1 flex-col justify-center gap-1"><div className="h-[5px] rounded bg-[#0F4C5C]" /><div className="h-1 w-[70%] rounded bg-[#A9C9D1]" /></div>
      </div>
    );
  }
  return null;
}

export function Cover({ product, className = "h-[150px] md:h-[200px]", big = false }) {
  const c = product.cover || { bg: colorFor(product.id), label: product.title };
  return (
    <div className={`flex flex-col justify-between rounded-[18px] p-3.5 ${className}`} style={{ background: c.bg }}>
      <span className="self-start rounded-full bg-white/15 px-2 py-[3px] text-[11px] font-bold">{(product.formats || []).slice(0, 2).join(" · ")}</span>
      {c.art && c.art !== "text" ? <Art kind={c.art} /> : (
        <p className={`whitespace-pre-line font-extrabold leading-[1.05] ${big ? "text-[34px] tracking-[-0.03em]" : "text-[17px] md:text-xl"}`}>{c.label}</p>
      )}
    </div>
  );
}

export function ProductCard({ product, seller, showRating = true }) {
  return (
    <Link to={`/products/${product.id}`} className="flex flex-col gap-[5px] text-ink no-underline hover:text-ink">
      <Cover product={product} />
      <p className="mt-0.5 text-[15px] font-bold leading-snug">{product.title}</p>
      <p className="text-[13px] text-mute">
        {seller?.name}{showRating && <> · <Stars rating={product.rating} count={product.reviewCount} /></>}
      </p>
      <p className="text-base font-extrabold">{alke(product.price)}</p>
    </Link>
  );
}

// Product as a row ("New arrivals").
export function ProductRow({ product, seller }) {
  const c = product.cover || {};
  return (
    <Link to={`/products/${product.id}`} className="flex items-center gap-3 text-ink no-underline hover:text-ink">
      <span className="flex h-14 w-14 flex-none items-center justify-center rounded-[14px] text-xs font-extrabold" style={{ background: c.bg || colorFor(product.id) }}>
        {c.short || initials(product.title)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">{product.title}</span>
        <span className="mt-0.5 block text-[13px] text-mute">{seller?.name}</span>
      </span>
      <span className="whitespace-nowrap text-[15px] font-extrabold">{alke(product.price)}</span>
    </Link>
  );
}

export function ServiceThumb({ service, className = "h-[60px] w-[60px] rounded-[14px] text-xl" }) {
  const t = service.thumb || { bg: colorFor(service.id), text: initials(service.title) };
  return (
    <span className={`flex flex-none items-center justify-center font-extrabold ${className}`} style={{ background: t.bg, color: t.dark ? "#0B0B0F" : "#F5F5F7" }} aria-hidden>
      {t.icon ? <Icon name={t.icon} size={24} stroke={1.8} /> : t.art === "grid" ? (
        <span className="grid w-3/5 grid-cols-2 gap-[3px]">{[0, 1, 2, 3].map((i) => <span key={i} className="aspect-square rounded-sm bg-white/80" />)}</span>
      ) : t.art === "poster" ? <span className="h-3/5 w-2/5 rounded-sm bg-white/85" /> : t.text}
    </span>
  );
}

// Compact service row (Home: "Popular services").
export function ServiceRow({ service, seller }) {
  return (
    <Link to={`/services/${service.id}`} className="card flex items-center gap-3.5 p-3 text-ink no-underline hover:border-line-2 hover:text-ink">
      <ServiceThumb service={service} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-snug">{service.title}</span>
        <span className="mt-0.5 block text-[13px] text-mute">{seller?.name} · {service.days} days · <Stars rating={service.rating} /></span>
      </span>
      <span className="whitespace-nowrap text-[15px] font-extrabold">{service.price.toLocaleString("en-US")}</span>
    </Link>
  );
}

// Full service card (Services catalog).
export function ServiceCard({ service, seller }) {
  return (
    <Link to={`/services/${service.id}`} className="card flex flex-col gap-3 p-4 text-ink no-underline hover:border-line-2 hover:text-ink">
      <div className="flex items-center gap-2 text-[13px]">
        <Avatar initials={initials(seller?.name)} color={seller?.color} dark={seller?.dark} size={28} />
        <span className="font-bold">{seller?.name}</span>
        <span className="text-mute">· {seller?.country}</span>
        <span className={`ml-auto font-bold ${seller?.away ? "text-peach" : "text-ok"}`}>{seller?.away || "Available"}</span>
      </div>
      <div className="flex gap-3">
        <ServiceThumb service={service} className="h-[72px] w-[72px] rounded-[14px] text-2xl" />
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug">{service.title}</p>
          <p className="mt-1 text-[13px] text-mute">
            {service.rating ? <Stars rating={service.rating} count={service.reviewCount} /> : "New seller"} · {service.days}-day delivery
          </p>
        </div>
      </div>
      <p><span className="text-[13px] text-mute">From </span><span className="text-lg font-extrabold">{alke(service.price)}</span></p>
    </Link>
  );
}

export function SellerChip({ seller }) {
  return (
    <Link to={`/sellers/${seller.id}`} className="flex flex-col items-center gap-2 text-[13px] font-bold text-ink no-underline hover:text-ink">
      <Avatar initials={initials(seller.name)} color={seller.color} dark={seller.dark} size={60} />
      <span className="text-center">{seller.name}</span>
    </Link>
  );
}
