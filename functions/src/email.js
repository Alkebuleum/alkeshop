// Emails to sellers, sent through Brevo (the same account Nuru uses). The API
// key is the BREVO_API_KEY secret; the sender is Nuru's verified address
// until alkeshop.net has its own. A failed email never fails the action.

const SITE = "https://alkeshop.net";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function layout({ heading, paragraphs, cta }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;color:#16171d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px">
<tr><td style="padding:28px 28px 8px"><p style="margin:0;font-size:14px;font-weight:bold;color:#6d5bd0">AlkeShop</p>
<h1 style="margin:12px 0 0;font-size:22px;line-height:1.3">${esc(heading)}</h1></td></tr>
<tr><td style="padding:8px 28px 4px;font-size:16px;line-height:1.55">${paragraphs.map((p) => `<p style="margin:12px 0">${p}</p>`).join("")}</td></tr>
${cta ? `<tr><td style="padding:12px 28px 28px"><a href="${esc(cta.href)}" style="display:inline-block;background:#a78bfa;color:#0b0b0f;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px">${esc(cta.label)}</a></td></tr>` : ""}
<tr><td style="padding:16px 28px 24px;border-top:1px solid #ececf0;font-size:12px;color:#77778a">You're getting this because you applied to sell on AlkeShop (${SITE.replace("https://", "")}). Payments in ALKE on the Alkebuleum network.</td></tr>
</table></td></tr></table></body></html>`;
}

// Each returns { subject, html }.
const TEMPLATES = {
  sellerApproved: ({ name }) => ({
    subject: "You're approved to sell on AlkeShop",
    html: layout({
      heading: "You're approved to sell",
      paragraphs: [`Hi ${esc(name)},`, "Your seller application was approved. Open your Seller center to create your first product or service. We review each listing before buyers see it."],
      cta: { href: `${SITE}/seller`, label: "Open Seller center" },
    }),
  }),
  sellerRejected: ({ name }) => ({
    subject: "About your AlkeShop seller application",
    html: layout({
      heading: "We couldn't approve your application",
      paragraphs: [`Hi ${esc(name)},`, "We couldn't approve your seller application this time. Contact AlkeShop support to find out why, or apply again with more detail about what you'll sell."],
      cta: { href: `${SITE}/sell`, label: "View your application" },
    }),
  }),
  listingApproved: ({ name, title, kind, id }) => ({
    subject: `Your listing is live: ${title}`,
    html: layout({
      heading: "Your listing is live",
      paragraphs: [`Hi ${esc(name)},`, `<strong>${esc(title)}</strong> was approved and buyers can now find it on AlkeShop.`],
      cta: { href: `${SITE}/${kind === "product" ? "products" : "services"}/${encodeURIComponent(id)}`, label: "See your listing" },
    }),
  }),
  listingReturned: ({ name, title, kind, id, note }) => ({
    subject: `Changes needed: ${title}`,
    html: layout({
      heading: "Your listing needs changes",
      paragraphs: [`Hi ${esc(name)},`, `We reviewed <strong>${esc(title)}</strong> and need a few changes before it can go live:`, `<em>${esc(note)}</em>`, "Edit it from your Seller center and submit it again."],
      cta: { href: `${SITE}/seller/${kind === "product" ? "new-product" : "new-service"}?edit=${encodeURIComponent(id)}`, label: "Edit listing" },
    }),
  }),
};

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) { console.warn("email: BREVO_API_KEY is not set; not sending", subject); return false; }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_FROM_NAME || "AlkeShop", email: process.env.EMAIL_FROM || "noreply@alkebuleum.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return true;
}

module.exports = { TEMPLATES, sendEmail };
