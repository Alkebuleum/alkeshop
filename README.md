# AlkeShop

Digital products, freelance services and Nuru Credits, paid in ALKE on Alkebuleum.
Built from the "AlkeShop Screens" design canvas (Style C, dark and premium).

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests + a render check of every screen
npm run build    # dist/, with 404.html for GitHub Pages-style hosting
```

## Configuration (`.env`)

| Variable | What it does |
| --- | --- |
| `VITE_FB_*` | Shared Alkebuleum Firebase project, used only for the Nuru QR handshake. |
| `VITE_SHOP_TREASURY` | **Required to take payments.** The address buyers pay. Checkout is disabled without it. |
| `VITE_MIN_CONFS` | Confirmations before a payment counts (default 2). |
| `VITE_MARKET_FEE_BPS` | Marketplace fee in basis points (default 1000 = 10%, the designs' placeholder). |
| `VITE_ADMIN_ADDRESSES` | Comma-separated wallets allowed into `/admin`. Empty lets anyone in, for local testing only. |

## Wallets

Same protocol as the Alkebuleum explorer and JollofSwap (`src/lib/nuru.js`):

- **Nuru QR**: AlkeShop writes `connect_requests/{id}` and `sign_requests/{id}` in Firestore and shows
  `nuru://connect?c=…` / `nuru://sign?f=…` as a QR code; Nuru answers in the same document.
- **Nuru browser**: detected via `window.ethereum._isNuruWallet`; identity from `nuru_getIdentity`.
- **Browser wallet** (MetaMask etc.), behind "Pay from another wallet".

Payments go through the Nuru Account: the primary key calls `execute()`, a linked key goes through
`relay.alkebuleum.com`. If the Nuru Account is short but the signer key can cover it, the shortfall
is moved in first (two approvals). Gas limits are always passed explicitly because the RPC node's
`eth_estimateGas` fails.

## Payments

Each payment is an ALKE transfer to `VITE_SHOP_TREASURY` with calldata `alkeshop:<order id>`.
`src/lib/PaymentWatcher.jsx` follows every submitted payment on chain (sent → seen → confirming →
confirmed) and then delivers the order. Direct transfers and `execute()` calls are checked for the
right recipient and amount; relayed calls can't be read from outside, so they're flagged for
reconciliation in Admin → Payment reconciliation.

## What's not real yet

The marketplace data (catalog, orders, messages, seller profiles, listings, credits, payouts) lives in
this browser's localStorage behind `src/lib/store.js` and `src/lib/market.js`, until an AlkeShop backend
exists. Replace those two modules to move to an API. In particular:

- The catalog is the canvas's sample data. Sample sellers accept and deliver service orders on their own
  (labelled in the order conversation) so the whole flow can be tried.
- File upload, malware scanning and downloads need a file service; listings record file names and sizes only.
- Nuru Credits need the Nuru credits API to reach the buyer's Nuru account; balances are tracked locally.
- Payouts are recorded in Admin; the ALKE itself must be sent from the treasury wallet.
- Payment confirmation runs in the buyer's browser. A server-side watcher should confirm payments
  before anything is fulfilled for real.
- Policy pages are draft wording from the designs.
