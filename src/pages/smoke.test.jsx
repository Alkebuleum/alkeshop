// Renders every screen once, as a connected buyer and as an approved seller,
// to catch runtime errors in rendering. It doesn't check layout.
import { beforeAll, describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

const BUYER = "0x00000000000000000000000000000000000000b1";
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
mem.set("alkeshop:wallet", JSON.stringify({ type: "nuru", address: BUYER, signer: "0x00000000000000000000000000000000000000c1", handle: "@amara" }));

let h;
beforeAll(async () => {
  const { MemoryRouter, Routes, Route } = await import("react-router-dom");
  const { WalletProvider } = await import("../wallet/WalletProvider");
  const store = await import("../lib/store");
  const { products, services, CREDIT_PACKAGES } = await import("../lib/catalog");

  // A buyer who has bought a product, credits, and has a service in progress;
  // and who is also an approved seller with a listing in review.
  const p = store.startCheckout({ kind: "product", item: products[0], buyer: BUYER });
  store.paymentSubmitted(p, { txHash: "0x" + "ab".repeat(32), payer: BUYER });
  store.paymentConfirmed(p, { blockNumber: 1, verified: true });
  const c = store.startCheckout({ kind: "credits", item: CREDIT_PACKAGES[0], buyer: BUYER });
  const sv = store.requestService({ service: services[0], buyer: BUYER, answers: [{ q: "Name", a: "Shop" }] });
  store.sellerAccept(sv);
  const pend = store.startCheckout({ kind: "product", item: products[2], buyer: BUYER });
  store.paymentSubmitted(pend, { txHash: "0x" + "cd".repeat(32), payer: BUYER });
  const fail = store.startCheckout({ kind: "product", item: products[3], buyer: BUYER });
  store.paymentFailed(fail, "underpaid", { received: 10 });
  store.applyAsSeller(BUYER, { name: "Amara Shop", type: "Business", country: "Ghana", email: "a@example.com", bio: "Test seller", sells: ["products"] });
  store.reviewSeller(BUYER, true, "Test");
  const l = store.saveListing(BUYER, { kind: "product", title: "Test Kit", category: "business", about: "A test listing for smoke tests.", files: [{ name: "a.pdf", size: 1000 }], price: 10, formats: ["PDF"], license: "commercial", status: "review" });

  const pages = {
    Home: (await import("./Home")).default,
    Products: (await import("./Products")).default,
    Product: (await import("./Product")).default,
    Services: (await import("./Services")).default,
    Gig: (await import("./Gig")).default,
    Seller: (await import("./Seller")).default,
    Credits: (await import("./Credits")).default,
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
  );
  h = { render, pages, ids: { p, c, sv, pend, fail, l } };
});

describe("every screen renders", () => {
  const cases = () => {
    const { ids } = h;
    return [
      ["/", "/", "Home", "Earn ALKE"],
      ["/products?cat=business", "/products", "Products", "Small Business Plan Kit"],
      ["/products/small-business-plan-kit", "/products/:id", "Product", "In your Library"],
      [`/products/${ids.l}`, "/products/:id", "Product", "preview of your listing"],
      ["/services", "/services", "Services", "modern logo"],
      ["/services/modern-logo-brand-kit", "/services/:id", "Gig", "View your order"],
      ["/sellers/kente-studio", "/sellers/:id", "Seller", "Verified seller"],
      ["/credits", "/credits", "Credits", "Choose a package"],
      [`/checkout/${ids.c}`, "/checkout/:orderId", "Checkout", "This price is held"],
      [`/checkout/${ids.sv}`, "/checkout/:orderId", "Checkout", "accepted your request"],
      [`/orders/${ids.p}/payment`, "/orders/:orderId/payment", "Payment", "Payment confirmed"],
      [`/orders/${ids.pend}/payment`, "/orders/:orderId/payment", "Payment", "Confirming your payment"],
      [`/orders/${ids.fail}/payment`, "/orders/:orderId/payment", "Payment", "less than the order total"],
      ["/library", "/library", "Library", "Small Business Plan Kit"],
      ["/orders", "/orders", "Orders", "NEEDS YOUR ACTION"],
      [`/orders/${ids.sv}`, "/orders/:orderId", "Order", "Pay 400 ALKE"],
      ["/search?q=logo", "/search", "Search", "modern logo"],
      ["/terms/refunds", "/terms/:slug", "Info", "Refund policy"],
      ["/sell", "/sell", "Onboarding", "You&#x27;re a seller"],
      ["/seller", "/seller", "SellerCenter", "Available for payout"],
      ["/seller/new-product", "/seller/new-product", "CreateProduct", "FILES BUYERS RECEIVE"],
      ["/seller/new-service", "/seller/new-service", "CreateService", "WHAT YOU NEED FROM BUYERS"],
      ["/admin", "/admin", "Admin", "Marketplace overview"],
    ];
  };

  it("renders each route with its key content", () => {
    for (const [path, pattern, name, expected] of cases()) {
      const html = h.render(path, pattern, h.pages[name]).replaceAll("<!-- -->", "");
      expect(html, `${name} at ${path}`).toContain(expected);
    }
  });
});
