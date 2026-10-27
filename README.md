# AlkeShop

A marketplace for digital products and freelance services, paid in ALKE on Alkebuleum.
Built from the "AlkeShop Screens" design canvas (Style C, dark and premium). Live at https://alkeshop.net.

```sh
npm install
npm run dev            # http://localhost:5173 (talks to the live Firebase project)
npm test               # unit tests + a render check of every screen
npm run test:emulator  # database rules + every server flow, on the Firestore emulator
npm run test:e2e       # sign-in, uploads and the API across all emulators
npm run build          # docs/, which GitHub Pages serves
cd functions && npm test   # server unit tests (sign-in, payment checks)
```

`VITE_USE_EMULATORS=1 npm run dev` with `firebase emulators:start` running works fully offline.

## How it works

- **Anyone can buy.** Their wallet is their account: no sign-up.
- **Anyone can apply to sell.** Staff approve each seller and each listing before buyers see it.
- **Buyers pay the shop's treasury**, which holds the money (like an escrow) until the order is done.
  Staff record payouts in Admin and send the ALKE from the treasury wallet; refunds work the same way.
- **Services:** request → seller accepts → buyer pays within 18 h → delivery → 2 days to accept, ask for a
  revision or dispute; then it completes on its own. **Products:** download right after payment confirms;
  the seller's share is released after the 7-day refund window.

## Backend (Firebase, shared Alkebuleum project `amid-7592b`)

AlkeShop lives beside Nuru, JollofSwap and the explorer in one Firebase project, so everything it
deploys is kept to its own space and **can't overwrite theirs**:

| Piece | Where | Deployed from here as |
| --- | --- | --- |
| Data | Firestore database **`alkeshop`** (not the default one) | `firestore.rules`, rules release `cloud.firestore/alkeshop` |
| Files | Bucket **`amid-7592b-alkeshop`** (not the default one) | `storage.rules`, deploy target `alkeshop` |
| Server | Functions codebase **`alkeshop`**: `shopAuth`, `shopApi`, `shopTick` | `functions/` |

Deploy only with `firebase deploy --only firestore,storage,functions:alkeshop` from this folder.
Never copy Nuru's `firebase.json` here or deploy this folder's rules from Nuru's.

- **Sign-in** (`shopAuth`): the wallet signs a short message (no funds move). The server checks the
  signature, and for a Nuru Account that the key is its `primary()` or `isValidSigner(key)`, then returns
  a Firebase custom token with `shopWallet` / `shopAdmin` claims. Same approach as Nuru's `chatAuth`.
- **Every change** goes through `shopApi` (`functions/src/shop.js`), which checks who is asking. The
  database rules let clients **read** only what's theirs (live listings and approved sellers are public)
  and **write nothing**.
- **Payments** are checked on chain by the server: the calldata must be `alkeshop:<order id>` and the
  amount must cover the price. Each transaction can pay one order only. `shopTick` re-checks
  every minute and runs order timers, so a buyer closing the tab doesn't lose anything. Payments from
  linked Nuru keys go through the relay and can't be decoded, so they're confirmed by the treasury's
  balance change in that block; if that can't be read, they're flagged in Admin → Payment reconciliation.
- **Files** upload to `uploads/<wallet>/…` (only that wallet can write there; 500 MB max). Nobody reads
  the bucket directly: `shopApi.fileUrl` hands out 15-minute signed links only to a buyer who has paid,
  to the people on that order, or to staff.

## Configuration

Site (`.env`, baked into the build):

| Variable | What it does |
| --- | --- |
| `VITE_FB_*` | The shared Alkebuleum Firebase project. |
| `VITE_SHOP_TREASURY` | The address buyers pay. Checkout is disabled without it. **Must match `SHOP_TREASURY`.** |
| `VITE_SHOP_BUCKET` | The AlkeShop bucket (`amid-7592b-alkeshop`). |
| `VITE_MIN_CONFS`, `VITE_MARKET_FEE_BPS` | Shown to people; the server's values are what count. |
| `VITE_ADMIN_ADDRESSES` | Who sees the Admin link. Access itself is decided by the server. |

Server (`functions/.env`, deployed with the functions; `functions/.env.local` is for the emulators only):

| Variable | What it does |
| --- | --- |
| `SHOP_TREASURY` | The address payments must go to. Empty = checkout is switched off. |
| `SHOP_ADMINS` | Staff wallets (Nuru Account or key), comma-separated. |
| `SHOP_FEE_BPS` | Marketplace fee in basis points (1000 = 10%). |
| `SHOP_MIN_CONFS` | Confirmations before a payment counts. |
| `SHOP_BUCKET` | The AlkeShop bucket. |

## Wallets

Same protocol as the Alkebuleum explorer and JollofSwap (`src/lib/nuru.js`): Nuru QR, the Nuru
browser, or a browser wallet (MetaMask etc.) behind "Pay from another wallet". Gas limits are always
passed explicitly because the RPC node's `eth_estimateGas` fails.

## Not done yet

- Nuru Credits are switched off (`CREDITS_ENABLED` in `src/lib/config.js`); they need the Nuru credits API.
- Payouts and refunds are recorded in Admin, but the ALKE must be sent from the treasury wallet by hand.
- Uploaded files aren't scanned for malware.
- Reviews and ratings aren't collected yet; every listing shows "No reviews yet".
- Policy pages are draft wording from the designs.
