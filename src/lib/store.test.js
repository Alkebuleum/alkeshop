import { describe, expect, it, vi } from "vitest";
import {
  getState, startCheckout, requestService, paymentSubmitted, paymentConfirmed, paymentFailed,
  sellerAccept, sellerDeliver, acceptDelivery, tick, earnings, applyAsSeller,
} from "./store";
import { products, services, CREDIT_PACKAGES } from "./catalog";

const BUYER = "0xAbC0000000000000000000000000000000000001";
const order = (id) => getState().orders.find((o) => o.id === id);

describe("store", () => {
  it("delivers a product once its payment confirms", () => {
    const id = startCheckout({ kind: "product", item: products[0], buyer: BUYER });
    expect(order(id)).toMatchObject({ status: "awaiting_payment", amount: 250, buyer: BUYER.toLowerCase() });
    paymentSubmitted(id, { txHash: "0x01", payer: BUYER });
    expect(order(id).status).toBe("confirming");
    paymentConfirmed(id, { blockNumber: 10, verified: true });
    expect(order(id)).toMatchObject({ status: "delivered", payment: { stage: "confirmed", verified: true } });
  });

  it("adds credits once a credit package payment confirms", () => {
    const pkg = CREDIT_PACKAGES[1];
    const id = startCheckout({ kind: "credits", item: pkg, buyer: BUYER });
    paymentSubmitted(id, { txHash: "0x02", payer: BUYER });
    paymentConfirmed(id, { blockNumber: 11, verified: true });
    expect(getState().credits[BUYER.toLowerCase()]).toBe(pkg.credits);
  });

  it("keeps a service order open after a declined payment, so it can be retried", () => {
    const id = requestService({ service: services[0], buyer: BUYER, answers: [] });
    sellerAccept(id);
    paymentFailed(id, "declined");
    expect(order(id)).toMatchObject({ status: "awaiting_payment", payment: { failure: "declined" } });
  });

  it("runs a service from request to completion and credits the seller", () => {
    const seller = "0x00000000000000000000000000000000000000Fe";
    applyAsSeller(seller, { name: "Test Studio", type: "Business", country: "Ghana", email: "t@example.com", bio: "Tests", sells: ["services"] });
    const svc = { ...services[0], id: "svc-test", sellerId: seller.toLowerCase(), price: 100 };
    const id = requestService({ service: svc, buyer: BUYER, answers: [{ q: "Name", a: "Shop" }] });
    expect(order(id).status).toBe("requested");
    sellerAccept(id);
    paymentSubmitted(id, { txHash: "0x03", payer: BUYER });
    paymentConfirmed(id, { blockNumber: 12, verified: true });
    expect(order(id).status).toBe("active");
    sellerDeliver(id, "Done", []);
    expect(order(id).status).toBe("delivered");
    acceptDelivery(id);
    expect(order(id).status).toBe("completed");
    expect(earnings(getState(), seller).available).toBe(90); // after the 10% placeholder fee
  });

  it("expires a price hold after 30 minutes", () => {
    const id = startCheckout({ kind: "product", item: products[1], buyer: BUYER });
    vi.useFakeTimers({ now: Date.now() + 31 * 60 * 1000 });
    tick();
    vi.useRealTimers();
    expect(order(id)).toMatchObject({ status: "failed", payment: { failure: "expired" } });
  });
});
