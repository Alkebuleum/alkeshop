// The catalog as buyers see it: live listings and approved sellers from the
// store, in the shape the shop pages use.

const COVER_COLORS = ["#2B2D73", "#1E3A5F", "#6B2E1F", "#4A1D4F", "#0F4C5C", "#1F4D3A"];
export const colorFor = (id = "") => COVER_COLORS[[...id].reduce((t, c) => t + c.charCodeAt(0), 0) % COVER_COLORS.length];

function sellerFromProfile(p) {
  return {
    id: p.id, name: p.name, color: colorFor(p.id), type: p.type, country: p.country, langs: p.langs || "",
    joined: new Date(p.appliedAt).toISOString(), rating: 0, reviews: 0, completed: 0,
    verified: p.status === "approved", bio: p.bio, tags: p.tags || [], status: p.status,
  };
}

export const allSellers = (s) => Object.values(s.sellers).filter((p) => p.status === "approved").map(sellerFromProfile);

export function getSeller(s, id) {
  const p = s.sellers[id?.toLowerCase()];
  return p ? sellerFromProfile(p) : null;
}

// Turns a listing into the shape the shop pages use. `fileList` keeps the
// files themselves; `files` is their count, as the product page shows it.
function fromListing(l) {
  const base = { ...l, rating: 0, reviewCount: 0, reviews: [], sales: 0 };
  if (l.kind === "product") {
    return { ...base, fileList: l.files || [], cover: { bg: colorFor(l.id), label: l.title, art: "text" }, files: l.files?.length || 0, size: (l.files || []).reduce((t, f) => t + f.size, 0), updated: new Date(l.updatedAt).toISOString() };
  }
  return { ...base, thumb: { bg: colorFor(l.id), text: l.title.replace(/^I will /i, "").slice(0, 2) }, packageName: l.packageName || "Standard package" };
}

const live = (s, kind) => s.listings.filter((l) => l.kind === kind && l.status === "live").map(fromListing);

export const allProducts = (s) => live(s, "product");
export const allServices = (s) => live(s, "service");

// Finds any listing this visitor can see, including the seller's own
// unpublished one (for previews) and, for staff, those in review.
export function getProduct(s, id) {
  const l = s.listings.find((x) => x.id === id && x.kind === "product");
  return l ? fromListing(l) : null;
}

export function getService(s, id) {
  const l = s.listings.find((x) => x.id === id && x.kind === "service");
  return l ? fromListing(l) : null;
}

export function search(items, q) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((it) => {
    const hay = [it.title, it.about, it.scope, it.sub, it.category, ...(it.formats || [])].join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
