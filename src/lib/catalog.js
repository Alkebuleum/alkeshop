// Fixed lists the shop is built around. Listings, sellers and orders live in
// the database (see store.js). Categories and licenses must match
// functions/src/config.js.

export const PRODUCT_CATEGORIES = [
  { id: "business", label: "Business tools" },
  { id: "creative", label: "Creative assets" },
  { id: "career", label: "Career" },
  { id: "technology", label: "Technology" },
];

export const SERVICE_CATEGORIES = [
  { id: "design", label: "Design" },
  { id: "technology", label: "Technology" },
  { id: "writing", label: "Writing" },
  { id: "marketing", label: "Marketing" },
];

export const LICENSES = {
  personal: { label: "Personal", short: "Private use only", text: "For your own private use. Do not use in a business, resell or share the original files." },
  commercial: { label: "Commercial", short: "One business; no resale of files", text: "Use for one business. Edit freely. Do not resell or share the original files." },
  "commercial-plus": { label: "Commercial Plus", short: "Several businesses or client work", text: "Use for several businesses or client work. Do not resell or share the original files." },
};

export const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter", credits: 500, price: 50 },
  { id: "standard", name: "Standard", credits: 1200, price: 110 },
  { id: "plus", name: "Plus", credits: 3000, price: 260, best: true },
];

export const CREDIT_USES = ["Advanced AI models", "Voice conversations", "Document analysis", "AI agent tasks"];
