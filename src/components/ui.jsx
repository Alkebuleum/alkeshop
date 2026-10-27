import React, { useEffect } from "react";
import { Link } from "react-router-dom";

/* ---------------- Icons: inline stroke SVGs, as in the canvas ---------------- */

const PATHS = {
  home: <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 21V5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  share: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></>,
  x: <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />,
  shieldCheck: <><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h2" /></>,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  file: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  paperclip: <path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5" />,
  send: <path d="M4 12l16-8-6 16-3-7z" />,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
  revise: <><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>,
  monitor: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 8h18M8 21h8" /></>,
  play: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  inbox: <><path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M3 13h5l1 3h6l1-3h5" /></>,
  coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M15 11.2c3 .3 6 1.5 6 3.3 0 1.9-2.7 3.5-6 3.5-1.6 0-3-.4-4-1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  store: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9v11h16V9" /><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /></>,
  logout: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
};

export function Icon({ name, size = 20, stroke = 2, className = "", label }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" className={`flex-none ${className}`}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      {PATHS[name]}
    </svg>
  );
}

/* ---------------- Brand ---------------- */

export function LogoMark({ size = 28, fg = "#A78BFA" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="flex-none">
      <path d="M10.5 13a5.5 5.5 0 0 1 11 0" fill="none" stroke={fg} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="5" y="13" width="22" height="15" rx="5" fill={fg} />
    </svg>
  );
}

export function Logo({ size = 28 }) {
  return (
    <Link to="/" aria-label="AlkeShop home" className="flex items-center gap-2 text-ink no-underline hover:text-ink">
      <LogoMark size={size} />
      <span className="text-[21px] font-extrabold tracking-[-0.04em]">alkeshop</span>
    </Link>
  );
}

/* ---------------- Small pieces ---------------- */

export function Spinner({ className = "h-4 w-4" }) {
  return <span aria-hidden className={`inline-block animate-spin rounded-full border-2 border-violet/30 border-t-violet ${className}`} />;
}

const TONES = {
  ok: "bg-ok/15 text-ok",
  violet: "bg-violet/15 text-violet-text",
  peach: "bg-peach/15 text-peach",
  bad: "bg-bad/15 text-bad",
  plain: "bg-raised text-body",
};

// Centered spinner for a page whose data is still loading.
export function Loading() {
  return <div role="status" aria-label="Loading" className="flex min-h-[50vh] items-center justify-center"><Spinner className="h-6 w-6" /></div>;
}

export function Pill({ tone = "plain", children, className = "" }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-bold ${TONES[tone]} ${className}`}>{children}</span>;
}

export function Avatar({ name, initials, color = "#16171D", dark = false, size = 36, className = "" }) {
  return (
    <span aria-hidden className={`flex flex-none items-center justify-center rounded-full font-extrabold ${className}`}
      style={{ width: size, height: size, background: color, color: dark ? "#0B0B0F" : "#F5F5F7", fontSize: Math.round(size * 0.32) }}>
      {initials || name}
    </span>
  );
}

export function Notice({ tone = "peach", icon = "alert", children, className = "" }) {
  const styles = {
    peach: "border-peach/35 bg-peach/10 text-peach-text",
    violet: "border-violet/35 bg-violet/10 text-violet-text",
    bad: "border-bad/40 bg-bad/10 text-[#FCA5A5]",
    plain: "border-line bg-surface text-body",
  }[tone];
  return (
    <div className={`flex gap-2.5 rounded-[14px] border px-3.5 py-3 text-sm leading-snug ${styles} ${className}`}>
      <Icon name={icon} size={20} stroke={1.8} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Stars({ rating, count, className = "" }) {
  if (!rating) return <span className={className}>New</span>;
  return <span className={className}>★ {rating.toFixed(1)}{count != null && ` (${count})`}</span>;
}

// Back / close button for screen headers.
export function HeaderButton({ to, onClick, icon = "back", label }) {
  const cls = "flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface hover:text-ink";
  return to
    ? <Link to={to} aria-label={label} className={cls}><Icon name={icon} size={24} /></Link>
    : <button type="button" onClick={onClick} aria-label={label} className={cls}><Icon name={icon} size={24} /></button>;
}

export function CopyButton({ value, label = "Copy" }) {
  const [done, setDone] = React.useState(false);
  return (
    <button type="button" aria-label={label}
      onClick={() => navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mute hover:bg-raised hover:text-ink">
      <Icon name={done ? "check" : "copy"} size={16} />
    </button>
  );
}

// Bottom sheet on phones, centered dialog on larger screens.
export function Sheet({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`pb-safe max-h-[92vh] w-full overflow-y-auto rounded-t-[22px] border border-line bg-surface p-5 shadow-2xl sm:rounded-[22px] ${wide ? "sm:max-w-lg" : "sm:max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold">{title}</h2>
            {subtitle && <p className="text-sm text-mute">{subtitle}</p>}
          </div>
          {onClose && <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-ink"><Icon name="close" /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-violet"><Icon name={icon} size={28} stroke={1.8} /></span>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {children && <p className="max-w-xs text-[15px] leading-relaxed text-mute">{children}</p>}
      {action}
    </div>
  );
}
