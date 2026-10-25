import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AccountMenu, { useAttention } from "../wallet/AccountMenu";
import { HeaderButton, Icon, Logo } from "./ui";

const TABS = [
  { id: "home", to: "/", icon: "home", label: "Home" },
  { id: "products", to: "/products", icon: "grid", label: "Products" },
  { id: "services", to: "/services", icon: "briefcase", label: "Services" },
  { id: "credits", to: "/credits", icon: "sparkle", label: "Credits" },
  { id: "library", to: "/library", icon: "book", label: "Library" },
];

// Mobile bottom navigation (canvas: "Component: mobile tab bar").
function TabBar({ active }) {
  return (
    <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night md:hidden">
      <div className="mx-auto flex h-[72px] max-w-lg items-stretch justify-around px-1 pb-2 pt-1.5">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <Link key={t.id} to={t.to} aria-current={on ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] no-underline ${on ? "font-extrabold text-ink hover:text-ink" : "font-semibold text-dim hover:text-body"}`}>
              <Icon name={t.icon} size={24} />{t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopSearch() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form role="search" className="max-w-md flex-1" onSubmit={(e) => { e.preventDefault(); nav(`/search?q=${encodeURIComponent(q)}`); }}>
      <label htmlFor="d-search" className="sr-only">Search AlkeShop</label>
      <div className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-surface px-4 focus-within:border-violet">
        <Icon name="search" size={18} className="text-mute" />
        <input id="d-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates, services, creators"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-dim" />
      </div>
    </form>
  );
}

// Desktop header (canvas D1). Hidden on phones, where each screen has its own header.
function DesktopHeader() {
  const attention = useAttention();
  const navCls = ({ isActive }) => `text-[15px] font-bold no-underline ${isActive ? "text-ink hover:text-ink" : "text-body hover:text-ink"}`;
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-night/95 backdrop-blur md:block">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-8 px-8">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-6">
          <NavLink to="/products" className={navCls}>Products</NavLink>
          <NavLink to="/services" className={navCls}>Services</NavLink>
          <NavLink to="/credits" className={navCls}>Nuru Credits</NavLink>
        </nav>
        <DesktopSearch />
        <div className="ml-auto flex items-center gap-5">
          <NavLink to="/library" className={navCls}>My Library</NavLink>
          <NavLink to="/orders" className={navCls}>
            Orders{attention > 0 && <span className="ml-1.5 rounded-full bg-peach px-1.5 text-xs font-extrabold text-night">{attention}</span>}
          </NavLink>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 hidden border-t border-line md:block">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-8 py-8 text-sm">
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          <Link to="/help">Help and support</Link>
          <Link to="/terms/buyer">Buyer terms</Link>
          <Link to="/terms/seller">Seller terms</Link>
          <Link to="/terms/refunds">Refund policy</Link>
          <Link to="/terms/licenses">Licenses</Link>
        </nav>
        <p className="text-mute">Payments in ALKE on the Alkebuleum network.</p>
      </div>
    </footer>
  );
}

// Page frame. `tab` shows the phone tab bar with that tab active ("none" shows
// it with nothing active); leave it out for full-screen flows like checkout.
export default function Shell({ tab, children, footer = true }) {
  return (
    <div className="min-h-screen">
      <DesktopHeader />
      <div className={tab ? "pb-[88px] md:pb-0" : ""}>{children}</div>
      {footer && <Footer />}
      {tab && <TabBar active={tab} />}
    </div>
  );
}

// Phone screen header: title (or logo) on the left, account on the right.
// On desktop it becomes the page title row.
export function PageHeader({ title, back, logo, right }) {
  return (
    <header className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-2 pl-5 pr-4 md:mt-6 md:px-8">
      <div className="flex min-w-0 items-center gap-1">
        {back && <span className="-ml-3"><HeaderButton to={back} label="Back" /></span>}
        {logo ? <span className="md:hidden"><Logo /></span> : <h1 className="truncate text-2xl font-extrabold tracking-[-0.03em] md:text-[32px]">{title}</h1>}
      </div>
      <div className="flex items-center gap-1 md:hidden">{right}<AccountMenu /></div>
      {right && <div className="hidden md:flex">{right}</div>}
    </header>
  );
}

// Content column: phone-width padding, desktop max width.
export function Page({ children, className = "" }) {
  return <main className={`mx-auto max-w-[1280px] px-5 md:px-8 ${className}`}>{children}</main>;
}
