// Sample catalog from the AlkeShop canvas. Every name, price, count and rating
// is illustrative. Sellers marked `sample` answer service requests on their own
// (see store.js) so the buyer flows can be tried end to end.

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

export const sellers = [
  { id: "kente-studio", name: "Kente Studio", color: "#A78BFA", dark: true, type: "Business", country: "Ghana", langs: "English, Twi", joined: "2026-03-01", rating: 4.8, reviews: 41, completed: 126, verified: true, bio: "We make practical templates for small businesses across West Africa: plans, budgets and pitch decks you can finish in an afternoon.", tags: ["Business planning", "Financial templates", "Pitch decks"], sample: true },
  { id: "ledgerly", name: "Ledgerly Templates", color: "#1E3A5F", type: "Business", country: "Nigeria", langs: "English", joined: "2026-05-12", rating: 4.6, reviews: 11, completed: 38, verified: true, bio: "Invoices, receipts and simple bookkeeping sheets for freelancers and shops.", tags: ["Invoicing", "Bookkeeping"], sample: true },
  { id: "duka-tools", name: "Duka Tools", color: "#4A1D4F", type: "Business", country: "Kenya", langs: "English, Swahili", joined: "2026-07-02", rating: 4.9, reviews: 8, completed: 21, verified: true, bio: "Spreadsheets that help small shops track stock, sales and suppliers.", tags: ["Inventory", "Retail"], sample: true },
  { id: "adinkra-creative", name: "Adinkra Creative", color: "#4A1D4F", type: "Business", country: "Ghana", langs: "English", joined: "2026-04-20", rating: 4.7, reviews: 15, completed: 64, verified: true, bio: "Social media kits and pitch decks with a warm, modern African look.", tags: ["Social media", "Presentations"], sample: true },
  { id: "nia-labs", name: "Nia Labs", color: "#6B2E1F", type: "Business", country: "Kenya", langs: "English", joined: "2026-08-15", rating: 0, reviews: 0, completed: 9, verified: true, bio: "AI prompt packs and marketing playbooks for small brands.", tags: ["AI prompts", "Marketing"], sample: true },
  { id: "career-craft", name: "Career Craft", color: "#1E3A5F", type: "Business", country: "South Africa", langs: "English", joined: "2026-02-10", rating: 4.9, reviews: 40, completed: 152, verified: true, bio: "Resume and cover letter templates that pass hiring software and read well.", tags: ["Resumes", "Cover letters"], sample: true },
  { id: "ubuntu-org-tools", name: "Ubuntu Org Tools", color: "#1F4D3A", type: "Business", country: "South Africa", langs: "English, Zulu", joined: "2026-09-30", rating: 0, reviews: 0, completed: 0, verified: true, bio: "Toolkits for community groups, cooperatives and savings clubs.", tags: ["Community", "Meetings"], sample: true },
  { id: "kofi-mensah", name: "Kofi Mensah", color: "#0F4C5C", type: "Individual", country: "Ghana", langs: "English, French", joined: "2026-01-18", rating: 4.9, reviews: 31, completed: 48, verified: true, bio: "Brand designer for bakeries, salons and shops. Clean logos that work on a sign and on a phone.", tags: ["Logo design", "Brand kits"], sample: true },
  { id: "zawadi-njeri", name: "Zawadi Njeri", color: "#1E3A5F", type: "Individual", country: "Kenya", langs: "English, Swahili", joined: "2026-02-02", rating: 4.8, reviews: 22, completed: 30, verified: true, bio: "I build fast, simple websites for small businesses.", tags: ["Websites", "Landing pages"], sample: true },
  { id: "aicha-diallo", name: "Aïcha Diallo", color: "#FFB38A", dark: true, type: "Individual", country: "Senegal", langs: "French, English, Wolof", joined: "2026-03-22", rating: 4.9, reviews: 19, completed: 44, verified: true, bio: "Translator for business documents, English and French.", tags: ["Translation", "Proofreading"], sample: true },
  { id: "bisi-adeyemi", name: "Bisi Adeyemi", color: "#4A1D4F", type: "Individual", country: "Nigeria", langs: "English, Yoruba", joined: "2026-06-11", rating: 4.7, reviews: 12, completed: 17, verified: true, bio: "Social media designer for food and fashion brands.", tags: ["Social media design"], sample: true },
  { id: "nadia-kamau", name: "Nadia Kamau", color: "#6B2E1F", type: "Individual", country: "Kenya", langs: "English, Swahili", joined: "2026-10-01", rating: 0, reviews: 0, completed: 0, verified: true, bio: "Posters and flyers for events, churches and schools.", tags: ["Flyers", "Posters"], sample: true },
  { id: "yaw-tetteh", name: "Yaw Tetteh", color: "#1F4D3A", type: "Individual", country: "Ghana", langs: "English", joined: "2026-04-04", rating: 4.8, reviews: 9, completed: 14, verified: true, away: "Away until 4 Nov", bio: "Video editor for promos, reels and event recaps.", tags: ["Video editing"], sample: true },
  { id: "tunde-bakare", name: "Tunde Bakare", color: "#1E3A5F", type: "Individual", country: "Nigeria", langs: "English", joined: "2026-05-05", rating: 4.6, reviews: 7, completed: 11, verified: true, bio: "Career coach. CV rewrites and LinkedIn profiles that get replies.", tags: ["CV writing", "LinkedIn"], sample: true },
];

// cover.art: the little illustration drawn on the cover (see components/Cover.jsx).
export const products = [
  {
    id: "small-business-plan-kit", title: "Small Business Plan Kit", sellerId: "kente-studio", price: 250, category: "business",
    cover: { bg: "#2B2D73", label: "Business\nPlan Kit", sub: "Plan · Forecast · Pitch", art: "text" },
    formats: ["DOCX", "XLSX", "PDF"], files: 6, size: 18_000_000, version: "2.1", updated: "2026-09-01", license: "commercial",
    rating: 4.8, reviewCount: 23, sales: 126, createdAt: "2026-03-10",
    about: "Everything a small business needs to write a clear plan and a 12-month forecast. Fill-in sections guide you from idea to numbers.",
    bullets: ["Business plan template with guidance notes", "12-month cash-flow and profit forecast", "One-page pitch summary"],
    reviews: [
      { name: "Chidi O.", text: "The forecast sheet saved me days. Clear notes in every section." },
      { name: "Fatou S.", text: "Used it for a youth enterprise grant application. Worked well." },
    ],
    featured: true,
  },
  {
    id: "social-media-kit-restaurants", title: "Social Media Kit for Restaurants", sellerId: "adinkra-creative", price: 180, category: "creative",
    cover: { bg: "#4A1D4F", label: "Social\nMedia Kit", art: "text" },
    formats: ["CANVA", "PNG"], files: 40, size: 64_000_000, version: "1.3", updated: "2026-08-20", license: "commercial",
    rating: 4.7, reviewCount: 15, sales: 58, createdAt: "2026-05-02",
    about: "Forty editable post and story templates for restaurants, cafés and food vendors. Swap in your photos and menu in minutes.",
    bullets: ["30 feed posts and 10 stories", "Editable in Canva, plus PNG exports", "Menu, offer and opening-hours layouts"],
    reviews: [{ name: "Ngozi E.", text: "Our weekly specials finally look consistent." }],
    featured: true,
  },
  {
    id: "invoice-receipt-pack", title: "Invoice and Receipt Pack", sellerId: "ledgerly", price: 120, category: "business",
    cover: { bg: "#1E3A5F", art: "invoice" }, formats: ["XLSX", "PDF"], files: 8, size: 4_200_000, version: "1.2", updated: "2026-07-14", license: "commercial",
    rating: 4.6, reviewCount: 11, sales: 47, createdAt: "2026-05-20",
    about: "Professional invoice, quote and receipt templates that total themselves. Print them or send as PDF.",
    bullets: ["Invoice, quote and receipt templates", "Automatic totals and tax lines", "Simple customer and payment log"],
    reviews: [{ name: "Emeka U.", text: "Clean and simple. My clients pay faster now." }],
  },
  {
    id: "monthly-budget-planner", title: "Monthly Budget Planner", sellerId: "kente-studio", price: 60, category: "business",
    cover: { bg: "#6B2E1F", label: "Budget\nPlanner", art: "bars" }, formats: ["XLSX"], files: 1, size: 900_000, version: "1.0", updated: "2026-10-12", license: "personal",
    rating: 0, reviewCount: 0, sales: 12, createdAt: "2026-10-12",
    about: "Plan income and spending month by month, with charts that update as you type.",
    bullets: ["12 monthly sheets and a yearly summary", "Savings goals tracker", "Charts that update automatically"],
    reviews: [],
  },
  {
    id: "inventory-tracker", title: "Inventory Tracker for Shops", sellerId: "duka-tools", price: 85, category: "business",
    cover: { bg: "#4A1D4F", art: "grid" }, formats: ["XLSX", "SHEETS"], files: 2, size: 1_400_000, version: "1.1", updated: "2026-08-03", license: "commercial",
    rating: 4.9, reviewCount: 8, sales: 21, createdAt: "2026-07-02",
    about: "Track stock levels, reorder points and suppliers for a small shop. Works in Excel and Google Sheets.",
    bullets: ["Stock list with low-stock alerts", "Supplier and reorder log", "Monthly sales summary"],
    reviews: [{ name: "Wanjiru K.", text: "I finally know what to reorder each week." }],
  },
  {
    id: "investor-pitch-deck", title: "Investor Pitch Deck", sellerId: "adinkra-creative", price: 150, category: "business",
    cover: { bg: "#0F4C5C", art: "slide" }, formats: ["PPTX", "KEY"], files: 3, size: 22_000_000, version: "2.0", updated: "2026-06-30", license: "commercial",
    rating: 4.7, reviewCount: 15, sales: 33, createdAt: "2026-04-28",
    about: "A 14-slide pitch deck with the structure investors expect, from problem to ask.",
    bullets: ["14 editable slides", "Market size and financials layouts", "Speaker notes on every slide"],
    reviews: [{ name: "Sipho N.", text: "Clear structure. Helped me tell the story." }],
  },
  {
    id: "marketing-toolkit", title: "Marketing Toolkit for Small Brands", sellerId: "nia-labs", price: 200, category: "business",
    cover: { bg: "#1F4D3A", label: "Marketing\nToolkit", art: "text" }, formats: ["PDF", "CANVA"], files: 12, size: 15_000_000, version: "1.0", updated: "2026-10-05", license: "commercial",
    rating: 0, reviewCount: 0, sales: 4, createdAt: "2026-10-05",
    about: "A 30-day marketing plan, content calendar and ready-to-edit templates for small brands.",
    bullets: ["30-day plan with daily tasks", "Content calendar", "Editable Canva templates"],
    reviews: [],
  },
  {
    id: "resume-templates", title: "Resume Templates, 12 designs", sellerId: "career-craft", price: 90, category: "career",
    cover: { bg: "#1E3A5F", label: "Resume\nTemplates", short: "CV", art: "text" }, formats: ["DOCX", "PDF"], files: 24, size: 9_000_000, version: "1.0", updated: "2026-10-12", license: "personal",
    rating: 4.9, reviewCount: 40, sales: 152, createdAt: "2026-10-12",
    about: "Twelve clean resume designs with matching cover letters, built to pass hiring software.",
    bullets: ["12 resume designs", "Matching cover letters", "Writing guide with examples"],
    reviews: [{ name: "Thandi M.", text: "Got two interviews the week I switched." }],
    featured: true,
  },
  {
    id: "ai-prompt-pack", title: "AI Prompt Pack for Small Shops", sellerId: "nia-labs", price: 75, category: "technology",
    cover: { bg: "#6B2E1F", label: "AI Prompt\nPack", short: "AI", art: "text" }, formats: ["PDF", "NOTION"], files: 2, size: 3_100_000, version: "1.0", updated: "2026-10-18", license: "commercial",
    rating: 0, reviewCount: 0, sales: 9, createdAt: "2026-10-18",
    about: "200 tested prompts for product descriptions, customer replies, ads and stock planning.",
    bullets: ["200 prompts in 8 categories", "Works with Nuru AI and other assistants", "Fill-in-the-blank examples"],
    reviews: [],
  },
  {
    id: "community-meeting-toolkit", title: "Community Meeting Toolkit", sellerId: "ubuntu-org-tools", price: 60, category: "business",
    cover: { bg: "#1F4D3A", label: "Meeting\nToolkit", art: "text" }, formats: ["DOCX", "PDF"], files: 9, size: 5_000_000, version: "1.0", updated: "2026-10-01", license: "commercial",
    rating: 0, reviewCount: 0, sales: 2, createdAt: "2026-10-01",
    about: "Agendas, minutes, attendance and contribution sheets for community groups and savings clubs.",
    bullets: ["Agenda and minutes templates", "Contribution and attendance sheets", "Constitution starter"],
    reviews: [],
    featured: true,
  },
  {
    id: "cash-flow-forecast", title: "12-Month Cash-flow Forecast", sellerId: "kente-studio", price: 95, category: "business",
    cover: { bg: "#0F4C5C", label: "Cash-flow\nForecast", art: "text" }, formats: ["XLSX"], files: 1, size: 1_100_000, version: "1.4", updated: "2026-09-12", license: "commercial",
    rating: 4.7, reviewCount: 6, sales: 29, createdAt: "2026-04-01",
    about: "A month-by-month cash-flow forecast that warns you before money runs short.",
    bullets: ["Monthly in and out", "Shortfall warnings", "Scenario switch: careful, expected, hopeful"],
    reviews: [],
  },
  {
    id: "grant-proposal", title: "Community Grant Proposal", sellerId: "kente-studio", price: 110, category: "business",
    cover: { bg: "#4A1D4F", label: "Grant\nProposal", art: "text" }, formats: ["DOCX"], files: 3, size: 2_000_000, version: "1.0", updated: "2026-07-22", license: "commercial",
    rating: 4.8, reviewCount: 4, sales: 18, createdAt: "2026-07-22",
    about: "A grant proposal template with budget table and impact section, written for community projects.",
    bullets: ["Proposal template with guidance", "Budget table", "Impact and reporting plan"],
    reviews: [],
  },
];

export const services = [
  {
    id: "modern-logo-brand-kit", title: "I will design a modern logo and brand kit", sellerId: "kofi-mensah", category: "design", sub: "Logo design",
    price: 400, days: 4, revisions: 2, rating: 4.9, reviewCount: 31,
    thumb: { bg: "#0F4C5C", text: "Aa" },
    packageName: "Brand kit package",
    deliverables: ["3 logo concepts", "Final files in PNG, SVG and PDF", "Color palette and font guide"],
    scope: "A clean, memorable logo for a small business or community group, plus the basics to use it consistently. Print and social sizes included. Website design is not included.",
    needs: [{ q: "Your business name and a one-line description", type: "text" }, { q: "Colors or styles you like", type: "file", optional: true }, { q: "Where the logo will be used", type: "text" }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [
      { name: "Esi A.", text: "Three strong concepts and quick revisions. Our bakery sign looks great." },
      { name: "Moussa D.", text: "Clear communication in French and English. Delivered a day early." },
    ],
    popular: true,
  },
  {
    id: "five-page-website", title: "Build a 5-page business website", sellerId: "zawadi-njeri", category: "technology", sub: "Websites",
    price: 1800, days: 10, revisions: 2, rating: 4.8, reviewCount: 22, thumb: { bg: "#1E3A5F", icon: "monitor" },
    packageName: "Business website",
    deliverables: ["5 pages: home, about, services, gallery, contact", "Works on phones", "Contact form and WhatsApp button"],
    scope: "A fast, simple website for a small business. Hosting and domain are not included; I help you set them up.",
    needs: [{ q: "Your business name and what you sell", type: "text" }, { q: "Photos and logo", type: "file", optional: true }, { q: "Websites you like", type: "text", optional: true }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [{ name: "Halima B.", text: "Our salon gets bookings from the site every week." }],
    popular: true,
  },
  {
    id: "translate-en-fr", title: "Translate documents, English and French", sellerId: "aicha-diallo", category: "writing", sub: "Translation",
    price: 150, days: 2, revisions: 1, rating: 4.9, reviewCount: 19, thumb: { bg: "#FFB38A", text: "FR", dark: true },
    packageName: "Up to 2,000 words",
    deliverables: ["Translation of up to 2,000 words", "Proofread by a second reader", "Same layout as your original"],
    scope: "Business documents, letters and web pages between English and French. Legal certification is not included.",
    needs: [{ q: "The document to translate", type: "file" }, { q: "Which direction: English to French or French to English", type: "text" }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [{ name: "Jean-Paul K.", text: "Accurate and on time." }],
    popular: true,
  },
  {
    id: "social-media-posts", title: "Design 10 social media posts for your brand", sellerId: "bisi-adeyemi", category: "design", sub: "Social media design",
    price: 250, days: 3, revisions: 2, rating: 4.7, reviewCount: 12, thumb: { bg: "#4A1D4F", art: "grid" },
    packageName: "10 posts",
    deliverables: ["10 feed posts in your brand colors", "Editable Canva links", "Captions for each post"],
    scope: "Ten on-brand posts for Instagram, Facebook or WhatsApp status. Photography is not included.",
    needs: [{ q: "Your logo and brand colors", type: "file" }, { q: "What the posts should promote", type: "text" }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [],
  },
  {
    id: "event-flyer", title: "Design a flyer or poster for your event", sellerId: "nadia-kamau", category: "design", sub: "Flyers and posters",
    price: 120, days: 2, revisions: 2, rating: 0, reviewCount: 0, thumb: { bg: "#6B2E1F", art: "poster" },
    packageName: "One flyer or poster",
    deliverables: ["One design, print and phone sizes", "Print-ready PDF", "PNG for sharing"],
    scope: "A flyer or poster for an event, church, school or shop. Printing is not included.",
    needs: [{ q: "Event name, date, place and details", type: "text" }, { q: "Photos or logo to include", type: "file", optional: true }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [],
  },
  {
    id: "promo-video", title: "Edit a 60-second promo video", sellerId: "yaw-tetteh", category: "marketing", sub: "Video editing",
    price: 350, days: 5, revisions: 2, rating: 4.8, reviewCount: 9, thumb: { bg: "#1F4D3A", icon: "play" },
    packageName: "60-second promo",
    deliverables: ["60-second edit with music", "Captions burned in", "Vertical and square versions"],
    scope: "An edit of your footage into a short promo for social media. Filming is not included.",
    needs: [{ q: "Your footage", type: "file" }, { q: "What the video should say", type: "text" }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [],
  },
  {
    id: "cv-linkedin-edit", title: "Rewrite your CV and LinkedIn profile", sellerId: "tunde-bakare", category: "writing", sub: "CV writing",
    price: 220, days: 3, revisions: 1, rating: 4.6, reviewCount: 7, thumb: { bg: "#1E3A5F", text: "CV" },
    packageName: "CV and LinkedIn",
    deliverables: ["Rewritten CV in DOCX and PDF", "LinkedIn headline and About section", "One round of edits"],
    scope: "A rewrite of your CV and LinkedIn profile for the roles you want. Job applications are not included.",
    needs: [{ q: "Your current CV", type: "file" }, { q: "The roles you are applying for", type: "text" }],
    cancellation: "Full refund if delivery is more than 24 hours late. After delivery, use revisions or open a dispute.",
    reviews: [],
  },
];

export const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter", credits: 500, price: 50 },
  { id: "standard", name: "Standard", credits: 1200, price: 110 },
  { id: "plus", name: "Plus", credits: 3000, price: 260, best: true },
];

export const CREDIT_USES = ["Advanced AI models", "Voice conversations", "Document analysis", "AI agent tasks"];
