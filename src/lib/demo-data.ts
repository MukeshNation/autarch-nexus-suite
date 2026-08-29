/**
 * Illustrative workspace content for the Phase 1 shell.
 * Everything here is clearly surfaced as DEMO DATA in the UI — no live claims.
 */

export type DemoProject = {
  id: string;
  name: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  category: string;
  deadline: string;
  progress: number;
  assets: number;
};

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "atlas-relaunch",
    name: "Atlas Relaunch",
    description: "Site rebuild, launch deck and campaign for the Atlas product line.",
    priority: "High",
    category: "Marketing",
    deadline: "2026-09-18",
    progress: 62,
    assets: 24,
  },
  {
    id: "vendor-audit",
    name: "Vendor Contract Audit",
    description: "Clause review across 38 supplier agreements with risk scoring.",
    priority: "High",
    category: "Legal",
    deadline: "2026-09-04",
    progress: 41,
    assets: 38,
  },
  {
    id: "q3-analytics",
    name: "Q3 Finance Review",
    description: "Ledger profiling, anomaly detection and board report.",
    priority: "Medium",
    category: "Finance",
    deadline: "2026-10-02",
    progress: 18,
    assets: 9,
  },
  {
    id: "course-localisation",
    name: "Course Localisation",
    description: "Twelve lectures translated, subtitled and dubbed into four languages.",
    priority: "Low",
    category: "Media",
    deadline: "2026-11-15",
    progress: 7,
    assets: 51,
  },
];

export type DemoTask = {
  id: string;
  title: string;
  project: string;
  status: "Backlog" | "Todo" | "In Progress" | "Done";
  assignee: string;
};

export const DEMO_TASKS: DemoTask[] = [
  { id: "T-101", title: "Draft launch narrative", project: "Atlas Relaunch", status: "Done", assignee: "You" },
  { id: "T-102", title: "Generate hero imagery set", project: "Atlas Relaunch", status: "In Progress", assignee: "Autarch" },
  { id: "T-103", title: "Build pricing page", project: "Atlas Relaunch", status: "Todo", assignee: "You" },
  { id: "T-104", title: "Extract indemnity clauses", project: "Vendor Contract Audit", status: "In Progress", assignee: "Autarch" },
  { id: "T-105", title: "Flag renewal risks", project: "Vendor Contract Audit", status: "Todo", assignee: "Autarch" },
  { id: "T-106", title: "Normalise ledger export", project: "Q3 Finance Review", status: "Backlog", assignee: "You" },
  { id: "T-107", title: "Subtitle lecture 03", project: "Course Localisation", status: "Backlog", assignee: "Autarch" },
  { id: "T-108", title: "Approve dubbing voices", project: "Course Localisation", status: "Todo", assignee: "You" },
];

export type DemoFile = {
  name: string;
  kind: string;
  size: string;
  project: string;
  updated: string;
};

export const DEMO_FILES: DemoFile[] = [
  { name: "supplier-agreement-v4.pdf", kind: "PDF", size: "2.1 MB", project: "Vendor Contract Audit", updated: "2h ago" },
  { name: "ledger-q3.xlsx", kind: "Spreadsheet", size: "840 KB", project: "Q3 Finance Review", updated: "Yesterday" },
  { name: "atlas-hero-01.png", kind: "Image", size: "1.4 MB", project: "Atlas Relaunch", updated: "Yesterday" },
  { name: "lecture-03.mp4", kind: "Video", size: "612 MB", project: "Course Localisation", updated: "3d ago" },
  { name: "launch-deck.autarch", kind: "Deck", size: "3.2 MB", project: "Atlas Relaunch", updated: "4d ago" },
  { name: "brand-voice.md", kind: "Document", size: "18 KB", project: "Atlas Relaunch", updated: "1w ago" },
];

export const DEMO_GENERATIONS = [
  { title: "Atlas launch deck — 18 slides", module: "presentation-builder", when: "12 min ago" },
  { title: "Indemnity clause summary", module: "legal-intelligence", when: "1h ago" },
  { title: "Hero image set — 6 variants", module: "image-studio", when: "3h ago" },
  { title: "Q3 anomaly report", module: "finance-analytics", when: "Yesterday" },
  { title: "Lecture 02 study set", module: "academic-intelligence", when: "2d ago" },
];

export const DEMO_JOBS = [
  { id: "J-8841", label: "Dub lecture 03 → ES", state: "Processing", progress: 46 },
  { id: "J-8840", label: "Render presenter video", state: "Queued", progress: 0 },
  { id: "J-8837", label: "Index 38 supplier PDFs", state: "Completed", progress: 100 },
  { id: "J-8835", label: "Restyle showroom footage", state: "Failed", progress: 72 },
  { id: "J-8830", label: "Generate campaign variants", state: "Cancelled", progress: 30 },
];

export const DEMO_WORKFLOWS = [
  {
    name: "Research → Deck → Campaign",
    steps: ["research", "presentation-builder", "image-studio", "marketing-automation"],
  },
  { name: "Contract → Findings → Tasks", steps: ["document-intelligence", "legal-intelligence", "assistant"] },
  { name: "Video → Transcript → Dubbing → Shorts", steps: ["translation-dubbing", "video-repurposing"] },
  { name: "Brief → Build → Code review", steps: ["software-builder", "code-workspace"] },
];

export const DEMO_INTEGRATIONS = [
  { name: "Mail provider", category: "Email", status: "Disconnected" },
  { name: "Social channels", category: "Social", status: "Disconnected" },
  { name: "Cloud storage", category: "Storage", status: "Disconnected" },
  { name: "Code repositories", category: "Repositories", status: "Disconnected" },
  { name: "Spreadsheets", category: "Data", status: "Disconnected" },
  { name: "CRM", category: "Business", status: "Disconnected" },
];

export const EXAMPLE_PROMPTS = [
  "Build a website for a design studio.",
  "Analyze this supplier contract.",
  "Research the market for modular housing.",
  "Create an image for our launch banner.",
  "Create a 12-slide investor presentation.",
  "Analyze this quarterly spreadsheet.",
  "Summarize this lecture into flashcards.",
  "Translate and dub this video into Spanish.",
  "Create a two-week marketing campaign.",
];

/** Naive intent → capability recommendation used by the composer (client-side only). */
const INTENT_RULES: { keywords: string[]; slug: string }[] = [
  { keywords: ["website", "app", "build", "saas", "landing"], slug: "software-builder" },
  { keywords: ["code", "bug", "refactor", "test", "repo"], slug: "code-workspace" },
  { keywords: ["contract", "clause", "legal", "nda", "agreement"], slug: "legal-intelligence" },
  { keywords: ["pdf", "document", "scan", "ocr"], slug: "document-intelligence" },
  { keywords: ["research", "sources", "market", "cite"], slug: "research" },
  { keywords: ["lecture", "study", "flashcard", "quiz", "exam"], slug: "academic-intelligence" },
  { keywords: ["image", "banner", "illustration", "picture"], slug: "image-studio" },
  { keywords: ["portrait", "headshot"], slug: "portrait-studio" },
  { keywords: ["presentation", "slides", "deck", "pitch"], slug: "presentation-builder" },
  { keywords: ["room", "interior", "furnish", "staging"], slug: "interior-design" },
  { keywords: ["voice", "narration", "speech", "voiceover"], slug: "voice-studio" },
  { keywords: ["music", "song", "soundtrack", "score"], slug: "music-studio" },
  { keywords: ["short", "clip", "repurpose", "reel"], slug: "video-repurposing" },
  { keywords: ["restyle", "transform video", "animate"], slug: "video-transformation" },
  { keywords: ["avatar", "presenter", "talking head"], slug: "avatar-studio" },
  { keywords: ["translate", "dub", "subtitle", "localise", "localize"], slug: "translation-dubbing" },
  { keywords: ["b-roll", "broll", "insert"], slug: "broll-engine" },
  { keywords: ["email", "inbox", "reply"], slug: "email-workspace" },
  { keywords: ["lead", "sales", "crm", "qualify"], slug: "sales-workspace" },
  { keywords: ["campaign", "marketing", "caption", "schedule"], slug: "marketing-automation" },
  { keywords: ["spreadsheet", "finance", "ledger", "revenue", "anomaly", "csv"], slug: "finance-analytics" },
  { keywords: ["automate", "agent", "workflow", "delegate"], slug: "ai-workforce" },
];

export function recommendModule(text: string): string {
  const t = text.toLowerCase();
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.slug;
  }
  return "assistant";
}
