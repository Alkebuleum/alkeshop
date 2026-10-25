import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet, isNuruConn } from "./WalletProvider";
import { balanceOf, toAlke } from "../lib/payPlan";
import { useStore, ordersOf } from "../lib/store";
import { ADMIN_ADDRESSES } from "../lib/config";
import { walletTail } from "../lib/format";
import { CopyButton, Icon } from "../components/ui";

// What a connected account is called: Nuru handle, then AIN, then the wallet tail.
export const accountName = (c) => c?.handle || c?.ain || (c ? walletTail(c.address) : "");
const badge = (c) => (c?.handle ? c.handle.replace(/^@/, "").slice(0, 2).toUpperCase() : c?.ain ? c.ain.slice(-2) : c?.address.slice(-2).toUpperCase());

// Orders that need the buyer: a delivery to review or an accepted request to pay.
export function useAttention() {
  const s = useStore();
  const { conn } = useWallet();
  if (!conn) return 0;
  return ordersOf(s, conn.address).filter((o) => o.status === "delivered" && o.kind === "service" || (o.status === "awaiting_payment" && o.kind === "service")).length;
}

export const isAdmin = (c) => !!c && (!ADMIN_ADDRESSES.length || [c.address, c.signer].some((a) => a && ADMIN_ADDRESSES.includes(a.toLowerCase())));

function MenuLink({ to, icon, children, onClick, count }) {
  return (
    <Link to={to} onClick={onClick} className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-[15px] font-semibold text-ink no-underline hover:bg-raised hover:text-ink">
      <Icon name={icon} size={18} className="text-mute" />
      <span className="flex-1">{children}</span>
      {count > 0 && <span className="rounded-full bg-peach px-2 text-xs font-extrabold text-night">{count}</span>}
    </Link>
  );
}

export default function AccountMenu() {
  const { conn, openConnect, disconnect } = useWallet();
  const s = useStore();
  const attention = useAttention();
  const [open, setOpen] = useState(false);
  const [bal, setBal] = useState(undefined);
  const ref = useRef(null);

  useEffect(() => {
    if (!open || !conn) return;
    setBal(undefined);
    balanceOf(conn.address).then(setBal).catch(() => setBal(null));
  }, [open, conn]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!conn) {
    return <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect</button>;
  }
  const close = () => setOpen(false);
  const seller = s.sellers[conn.address.toLowerCase()];
  const credits = s.credits[conn.address.toLowerCase()] || 0;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        aria-label={`Account menu${attention ? `, ${attention} ${attention === 1 ? "item needs" : "items need"} attention` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-[13px] font-bold">{badge(conn)}</span>
        {attention > 0 && <span className="absolute right-1 top-[5px] h-2.5 w-2.5 rounded-full border-2 border-night bg-peach" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-[18px] border border-line bg-surface p-3 shadow-2xl">
          <div className="px-2 pb-3">
            <p className="text-[13px] text-mute">{isNuruConn(conn) ? "Nuru Wallet" : "Browser wallet"}</p>
            <p className="font-bold">{accountName(conn)}</p>
            <div className="flex items-center gap-1 text-[13px] text-mute">
              <span className="font-mono">{conn.address.slice(0, 8)}…{conn.address.slice(-6)}</span>
              <CopyButton value={conn.address} label="Copy wallet address" />
            </div>
            <p className="text-[13px] text-body">
              {bal === undefined ? "Checking balance…" : bal === null ? "Balance unavailable" : `${toAlke(bal)} ALKE`}
              {credits > 0 && <> · {credits.toLocaleString("en-US")} credits</>}
            </p>
          </div>
          <div className="border-t border-line pt-2">
            <MenuLink to="/orders" icon="inbox" onClick={close} count={attention}>My Orders</MenuLink>
            <MenuLink to="/library" icon="book" onClick={close}>My Library</MenuLink>
            <MenuLink to="/credits" icon="sparkle" onClick={close}>Nuru Credits</MenuLink>
            {seller ? <MenuLink to="/seller" icon="store" onClick={close}>Seller center</MenuLink> : <MenuLink to="/sell" icon="store" onClick={close}>Become a Seller</MenuLink>}
            {isAdmin(conn) && <MenuLink to="/admin" icon="shield" onClick={close}>Admin</MenuLink>}
            <button type="button" onClick={() => { disconnect(); close(); }}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2 text-left text-[15px] font-semibold hover:bg-raised">
              <Icon name="logout" size={18} className="text-mute" />Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
