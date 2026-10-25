// Help and policy pages. The wording is a working draft taken from the
// designs; it needs legal review before launch.
import React from "react";
import { useParams } from "react-router-dom";
import Shell, { PageHeader, Page } from "../components/Shell";
import { Notice } from "../components/ui";
import { LICENSES } from "../lib/catalog";
import { FEE_LABEL } from "../lib/config";
import NotFound from "./NotFound";

const PAGES = {
  help: {
    title: "Help and support",
    body: [
      ["Paying", "AlkeShop takes ALKE on the Alkebuleum network. Connect Nuru Wallet by scanning a QR code with the Nuru app, or open AlkeShop inside the Nuru browser. You approve every payment in Nuru, and Nuru shows the network fee before you approve."],
      ["A payment is taking long", "Payments usually confirm in a moment. If yours is slow, it is still on the network and AlkeShop keeps checking. You can see it on the Alkebuleum Explorer from the payment screen."],
      ["Something went wrong with an order", "Open the order from My Orders and use the conversation, or open a dispute after a delivery. Keep payments and files on AlkeShop so support can help."],
      ["Contact", "[SUPPORT EMAIL OR CHANNEL]. Include your order number (it starts with AS-)."],
    ],
  },
  buyer: {
    title: "Buyer terms",
    body: [
      ["Prices and payment", "Prices are in ALKE. You pay AlkeShop, and AlkeShop pays the seller. The network fee is shown in your wallet before you approve."],
      ["Price holds", "A checkout holds the price for 30 minutes. A service request you've had accepted must be paid within 18 hours."],
      ["Services", "You pay only after the seller accepts. After delivery you have 2 days to accept, ask for a revision or open a dispute; after that the order completes automatically."],
    ],
  },
  seller: {
    title: "Seller terms",
    body: [
      ["Fees", `Each sale has a marketplace fee (${FEE_LABEL}, placeholder rate), shown before you publish.`],
      ["Payouts", "Earnings are paid weekly in ALKE to your verified wallet. Changing that wallet pauses payouts for 72 hours and alerts your email."],
      ["Listings", "Listings are reviewed before they go live. You must own or have the rights to everything you list. Previews must not include your full files."],
    ],
  },
  refunds: {
    title: "Refund policy",
    body: [
      ["Digital products", "Refunds within 7 days if files are missing, broken or not as described. A refunded product is removed from your Library."],
      ["Services", "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute."],
      ["Underpayments", "If less than the order total arrives, the order isn't fulfilled and what you sent is returned to the wallet it came from."],
      ["Nuru Credits", "Credits are prepaid units for Nuru services. They are not a coin, cannot be withdrawn and cannot be sent to another account."],
    ],
  },
  licenses: {
    title: "Licenses",
    body: Object.values(LICENSES).map((l) => [l.label, l.text]),
  },
};

export default function Info({ page }) {
  const { slug } = useParams();
  const p = PAGES[page || slug];
  if (!p) return <NotFound />;
  return (
    <Shell tab="none">
      <PageHeader title={p.title} back="/" />
      <Page className="flex max-w-3xl flex-col gap-6 pb-10 pt-2 md:mx-0">
        {page !== "help" && <Notice tone="plain" icon="info">Draft wording for the pilot. The final terms will be published before launch.</Notice>}
        {p.body.map(([h, t]) => (
          <section key={h} className="flex flex-col gap-2">
            <h2 className="h-section">{h}</h2>
            <p className="text-base leading-relaxed text-body">{t}</p>
          </section>
        ))}
      </Page>
    </Shell>
  );
}
