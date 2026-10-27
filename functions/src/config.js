// AlkeShop server settings. Deploy-time values come from functions/.env
// (SHOP_*); they're read on each call so tests can set them.

const lc = (a) => String(a || "").trim().toLowerCase();

const cfg = () => ({
  treasury: lc(process.env.SHOP_TREASURY),
  admins: String(process.env.SHOP_ADMINS || "").split(",").map(lc).filter(Boolean),
  feeBps: Number(process.env.SHOP_FEE_BPS ?? 1000),
  minConfs: Math.max(1, Number(process.env.SHOP_MIN_CONFS) || 2),
  bucket: process.env.SHOP_BUCKET || "amid-7592b-alkeshop",
});

module.exports = {
  lc,
  cfg,
  DATABASE: "alkeshop",
  RPC_URL: "https://rpc.alkebuleum.com",
  CHAIN_ID: 237422,

  PRICE_HOLD_MS: 30 * 60 * 1000, // checkout holds a price for 30 minutes
  SERVICE_PAY_WINDOW_MS: 18 * 3600 * 1000, // pay within 18 hours of acceptance
  REVIEW_WINDOW_MS: 2 * 86400 * 1000, // a delivery completes on its own after 2 days
  PRODUCT_REFUND_MS: 7 * 86400 * 1000, // product money is the seller's after the refund window
  DROPPED_AFTER_MS: 15 * 60 * 1000, // never seen on chain: the wallet didn't really send it
  AUTH_MAX_AGE_MS: 5 * 60 * 1000,
  DOWNLOAD_URL_MS: 15 * 60 * 1000,

  // Kept in step with src/lib/catalog.js.
  PRODUCT_CATEGORIES: ["business", "creative", "career", "technology"],
  SERVICE_CATEGORIES: ["design", "technology", "writing", "marketing"],
  LICENSES: ["personal", "commercial", "commercial-plus"],
};
