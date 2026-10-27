// Renders every screen once against a fixed snapshot of the database, as a
// signed-in buyer who is also an approved seller and staff, to catch runtime
// errors in rendering. It doesn't check layout.
import { beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

const BUYER = "0x00000000000000000000000000000000000000b1";
const SELLER = "0x00000000000000000000000000000000000000a1";
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
mem.set("alkeshop:wallet", JSON.stringify({ type: "nuru", address: BUYER, signer: "0x00000000000000000000000000000000000000c1", handle: "@amara" }));

const now = Date.now();
const DAY = 86400000;
const file = (name, size = 1000) => ({ name, size, path: `uploads/${SELLER}/batch01/${name}` });

const sellers = {
  [SELLER]: { id: SELLER, name: "Kente Studio", type: "Business", country: "Ghana", bio: "Templates for small businesses.", status: "approved", appliedAt: now - 90 * DAY, sells: ["products", "services"] },
  [BUYER]: { id: BUYER, name: "Amara Shop", type: "Business", country: "Ghana", bio: "Test seller", status: "approved", appliedAt: now - 10 * DAY, sells: ["products"], email: "a@example.com", payout: BUYER },
};
const listings = [
  { id: "small-business-plan-kit", kind: "product", status: "live", sellerId: SELLER, sellerName: "Kente Studio", title: "Small Business Plan Kit", category: "business", about: "Plan and forecast for a small business.", files: [file("plan.docx", 18_000_000)], formats: ["DOCX"], version: "2.1", license: "commercial", price: 250, createdAt: now - 20 * DAY, updatedAt: now - 5 * DAY },
  { id: "invoice-pack", kind: "product", status: "live", sellerId: SELLER, sellerName: "Kente Studio", title: "Invoice and Receipt Pack", category: "business", about: "Invoices and receipts.", files: [file("invoice.xlsx")], formats: ["XLSX"], license: "commercial", price: 120, createdAt: now - 30 * DAY, updatedAt: now - 30 * DAY },
  { id: "modern-logo-brand-kit", kind: "service", status: "live", sellerId: SELLER, sellerName: "Kente Studio", title: "I will design a modern logo and brand kit", category: "design", sub: "Logo design", scope: "A clean logo for a small business.", price: 400, days: 4, revisions: 2, deliverables: ["3 logo concepts"], needs: [{ q: "Business name", type: "text" }], cancellation: "Full refund if late.", available: true, createdAt: now - 40 * DAY, updatedAt: now - 40 * DAY },
  { id: "product-test", kind: "product", status: "review", sellerId: BUYER, sellerName: "Amara Shop", title: "Test Kit", category: "business", about: "A test listing for smoke tests.", files: [{ name: "a.pdf", size: 1000, path: `uploads/${BUYER}/batch01/a.pdf` }], price: 10, formats: ["PDF"], license: "commercial", createdAt: now, updatedAt: now },
];
const base = { buyer: BUYER, sellerId: SELLER, sellerName: "Kente Studio", payment: {} };
const paidTx = (stage) => ({ txHash: "0x" + "ab".repeat(32), payer: BUYER, submittedAt: now - 60000, stage });
const orders = [
  { ...base, id: "AS-10501", kind: "product", itemId: "small-business-plan-kit", title: "Small Business Plan Kit", amount: 250, license: "commercial", version: "2.1", files: listings[0].files, status: "delivered", createdAt: now - DAY, paidAt: now - DAY, payment: { ...paidTx("confirmed"), verified: true } },
  { ...base, id: "AS-10502", kind: "product", itemId: "invoice-pack", title: "Invoice and Receipt Pack", amount: 120, status: "awaiting_payment", createdAt: now, holdUntil: now + 30 * 60000 },
  { ...base, id: "AS-10503", kind: "service", itemId: "modern-logo-brand-kit", title: "Design a modern logo and brand kit", amount: 400, days: 4, revisionsLeft: 2, status: "awaiting_payment", createdAt: now - 3600000, payBy: now + 17 * 3600000 },
  { ...base, id: "AS-10504", kind: "product", itemId: "invoice-pack", title: "Invoice and Receipt Pack", amount: 120, status: "confirming", createdAt: now, payment: paidTx("seen") },
  { ...base, id: "AS-10505", kind: "product", itemId: "invoice-pack", title: "Invoice and Receipt Pack", amount: 120, status: "failed", createdAt: now, payment: { ...paidTx("confirmed"), failure: "underpaid", received: 10 } },
];
const messages = {
  "AS-10503": [
    { id: "m1", from: "buyer", text: "Business name: Amara Bakery", at: now - 3600000, files: [] },
    { id: "m2", from: "system", text: "Kente accepted your request. Pay within 18 hours to start.", at: now - 3000000 },
  ],
};

let h;
beforeAll(async () => {
  const { MemoryRouter, Routes, Route } = await import("react-router-dom");
  const { WalletProvider } = await import("../wallet/WalletProvider");
  const store = await import("../lib/store");
  store.setStateForTests({ session: { wallet: BUYER, admin: true }, sellers, listings, orders, messages });

  const pages = {
    Home: (await import("./Home")).default,
    Products: (await import("./Products")).default,
    Product: (await import("./Product")).default,
    Services: (await import("./Services")).default,
    Gig: (await import("./Gig")).default,
    Seller: (await import("./Seller")).default,
    Credits: (await import("./Credits")).default,
    Wallet: (await import("./Wallet")).default,
    Checkout: (await import("./Checkout")).default,
    Payment: (await import("./Payment")).default,
    Library: (await import("./Library")).default,
    Orders: (await import("./Orders")).default,
    Order: (await import("./Order")).default,
    Search: (await import("./Search")).default,
    Info: (await import("./Info")).default,
    Onboarding: (await import("./Onboarding")).default,
    SellerCenter: (await import("./SellerCenter")).default,
    CreateProduct: (await import("./CreateListing")).CreateProduct,
    CreateService: (await import("./CreateListing")).CreateService,
    Admin: (await import("./Admin")).default,
  };
  const render = (path, pattern, Page) => renderToString(
    <MemoryRouter initialEntries={[path]}>
      <WalletProvider>
        <Routes><Route path={pattern} element={<Page />} /></Routes>
      </WalletProvider>
    </MemoryRouter>,
  ).replaceAll("<!-- -->", "");
  h = { render, pages, store };
});

describe("every screen renders", () => {
  const cases = [
    ["/", "/", "Home", "Earn ALKE"],
    ["/products?cat=business", "/products", "Products", "Small Business Plan Kit"],
    ["/products/small-business-plan-kit", "/products/:id", "Product", "In your Library"],
    ["/products/product-test", "/products/:id", "Product", "preview of your listing"],
    ["/services", "/services", "Services", "modern logo"],
    ["/services/modern-logo-brand-kit", "/services/:id", "Gig", "View your order"],
    [`/sellers/${SELLER}`, "/sellers/:id", "Seller", "Verified seller"],
    ["/credits", "/credits", "Credits", "Credit packages aren&#x27;t available"],
    ["/wallet", "/wallet", "Wallet", "Swap on JollofSwap"],
    ["/wallet?back=%2Fcheckout%2FAS-1&need=12", "/wallet", "Wallet", "about 12 more ALKE"],
    ["/checkout/AS-10502", "/checkout/:orderId", "Checkout", "This price is held"],
    ["/checkout/AS-10503", "/checkout/:orderId", "Checkout", "accepted your request"],
    ["/orders/AS-10501/payment", "/orders/:orderId/payment", "Payment", "Payment confirmed"],
    ["/orders/AS-10504/payment", "/orders/:orderId/payment", "Payment", "Confirming your payment"],
    ["/orders/AS-10505/payment", "/orders/:orderId/payment", "Payment", "less than the order total"],
    ["/library", "/library", "Library", "Small Business Plan Kit"],
    ["/orders", "/orders", "Orders", "NEEDS YOUR ACTION"],
    ["/orders/AS-10503", "/orders/:orderId", "Order", "Pay 400 ALKE"],
    ["/search?q=logo", "/search", "Search", "modern logo"],
    ["/terms/refunds", "/terms/:slug", "Info", "Refund policy"],
    ["/sell", "/sell", "Onboarding", "You&#x27;re a seller"],
    ["/seller", "/seller", "SellerCenter", "Available for payout"],
    ["/seller/new-product", "/seller/new-product", "CreateProduct", "FILES BUYERS RECEIVE"],
    ["/seller/new-service", "/seller/new-service", "CreateService", "WHAT YOU NEED FROM BUYERS"],
    ["/admin", "/admin", "Admin", "Marketplace overview"],
  ];

  it("renders each route with its key content", () => {
    for (const [path, pattern, name, expected] of cases) {
      expect(h.render(path, pattern, h.pages[name]), `${name} at ${path}`).toContain(expected);
    }
  });

  it("asks a connected wallet to sign in before showing private pages", () => {
    h.store.setStateForTests({ session: null, sellers, listings });
    for (const [path, pattern, name] of [["/orders", "/orders", "Orders"], ["/library", "/library", "Library"], ["/admin", "/admin", "Admin"]]) {
      expect(h.render(path, pattern, h.pages[name]), name).toContain("Sign in with your wallet");
    }
  });

  it("shows an empty shop as opening, with no sample listings", () => {
    h.store.setStateForTests({});
    const html = h.render("/", "/", h.pages.Home);
    expect(html).toContain("AlkeShop is just opening");
    expect(html).not.toContain("Kente Studio");
  });
});
