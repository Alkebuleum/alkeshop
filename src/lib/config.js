import { ethers } from "ethers";

const env = import.meta.env;

const addr = (v) => {
  try { return v ? ethers.getAddress(v.trim()) : ""; } catch { return ""; }
};

// Where buyers' ALKE goes. Without it checkout explains that payments are off.
export const SHOP_TREASURY = addr(env.VITE_SHOP_TREASURY);
export const MIN_CONFS = Math.max(1, Number(env.VITE_MIN_CONFS) || 2);
export const FEE_BPS = Number(env.VITE_MARKET_FEE_BPS ?? 1000);
export const FEE_LABEL = `${FEE_BPS / 100}%`;
export const ADMIN_ADDRESSES = (env.VITE_ADMIN_ADDRESSES || "").split(",").map(addr).filter(Boolean).map((a) => a.toLowerCase());

export const PRICE_HOLD_MS = 30 * 60 * 1000; // checkout holds a price for 30 minutes
export const SERVICE_PAY_WINDOW_MS = 18 * 3600 * 1000; // pay within 18 hours of acceptance
export const REVIEW_WINDOW_MS = 2 * 86400 * 1000; // a delivery completes on its own after 2 days
export const SLOW_AFTER_MS = 2 * 60 * 1000; // "taking longer than usual"

export const sellerShare = (price) => Math.round(price * (10000 - FEE_BPS)) / 10000;
export const feeOf = (price) => Math.round(price * FEE_BPS) / 10000;
