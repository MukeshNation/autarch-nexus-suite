/**
 * AUTARCH AI — capability registry.
 *
 * This is the single source of truth for the 23 Autarch modules: navigation,
 * mega-menu, module directory and every specialized workspace layout is derived
 * from here. Phase 1 is presentation-only: `status` declares honestly what is
 * real vs. demo, and no module claims a live integration.
 */

export type ModuleStatus = "REAL" | "DEMO" | "REQUIRES API" | "REQUIRES PAID SERVICE" | "COMING SOON";

export type PanelKind =
  | "prompt"
  | "controls"
  | "upload"
  | "viewer"
  | "chat"
  | "filetree"
  | "editor"
  | "terminal"
  | "diff"
  | "preview"
  | "canvas"
  | "variants"
  | "waveform"
  | "player"
  | "timeline"
  | "steps"
  | "queue"
  | "table"
  | "charts"
  | "slides"
  | "outline"
  | "inbox"
  | "leads"
  | "history"
  | "sources"
  | "clauses"
  | "findings"
  | "notes"
  | "flashcards"
  | "quiz"
  | "captions"
  | "languages"
  | "beforeafter"
  | "suggestions"
  | "calendar"
  | "approvals"
  | "handoff"
  | "empty";

export type Panel = {
  kind: PanelKind;
  title: string;
  note?: string;
  /** rows of illustrative, clearly-labelled demo content */
  items?: string[];
};

export type ModuleGroupId =
  | "build"
  | "research"
  | "design"
  | "media"
  | "business";

export type AutarchModule = {
  id: string;
  slug: string;
  name: string;
  group: ModuleGroupId;
  tagline: string;
  summary: string;
  status: ModuleStatus;
  inputs: string[];
  outputs: string[];
  workflow: string[];
  notice?: string;
  /** left rail, main stage, right rail */
  layout: { left: Panel[]; main: Panel[]; right: Panel[] };
};

export const MODULE_GROUPS: { id: ModuleGroupId; name: string; blurb: string }[] = [
  { id: "build", name: "Build & Agents", blurb: "Ship software and delegate autonomous work." },
  { id: "research", name: "Research & Knowledge", blurb: "Read, reason over and cite your documents." },
  { id: "design", name: "Design & Visual", blurb: "Generate and refine visual output." },
  { id: "media", name: "Audio & Video", blurb: "Voice, music, video and localisation." },
  { id: "business", name: "Business & Automation", blurb: "Growth, revenue and operations." },
];

const P = (kind: PanelKind, title: string, note?: string, items?: string[]): Panel => ({
  kind,
  title,
  ...(note === undefined ? {} : { note }),
  ...(items === undefined ? {} : { items }),
});

export const MODULES: AutarchModule[] = [
  {
    id: "01",
    slug: "software-builder",
    name: "Autonomous Software Builder",
    group: "build",
    tagline: "Describe a product. Receive a working codebase.",
    summary:
      "Turns a requirements brief into a plan, a file tree and multi-file generation with reviewable diffs and build status.",
    status: "DEMO",
    inputs: ["Requirements brief", "Existing repository", "Design references"],
    outputs: ["Project plan", "Multi-file codebase", "Diffs", "Build log", "Preview"],
    workflow: ["Brief", "Plan", "Generate files", "Review diff", "Build", "Preview", "Save to project"],
    layout: {
      left: [
        P("prompt", "Requirements", "What should Autarch build?"),
        P("steps", "Project plan", "Generated outline", [
          "Scope & data model",
          "Routing skeleton",
          "UI components",
          "Server functions",
          "Tests",
        ]),
      ],
      main: [
        P("filetree", "Generated file tree"),
        P("diff", "Diff viewer", "Review before applying"),
        P("preview", "Live preview"),
      ],
      right: [P("queue", "Build status"), P("history", "Build history")],
    },
  },
  {
    id: "02",
    slug: "code-workspace",
    name: "AI Code Workspace",
    group: "build",
    tagline: "An editor with an engineer inside it.",
    summary: "Multi-tab editing, AI pair programming, build terminal, diff review and test output in one surface.",
    status: "DEMO",
    inputs: ["Repository", "Files", "Issue description"],
    outputs: ["Edited files", "Diffs", "Test results", "Preview"],
    workflow: ["Open repo", "Ask for a change", "Review diff", "Run tests", "Apply"],
    layout: {
      left: [P("filetree", "Explorer"), P("chat", "AI coding chat")],
      main: [P("editor", "Editor"), P("terminal", "Terminal / build"), P("diff", "Diff review")],
      right: [P("preview", "Live preview"), P("queue", "Testing output")],
    },
  },
  {
    id: "03",
    slug: "ai-workforce",
    name: "Autonomous AI Workforce",
    group: "build",
    tagline: "Delegate multi-step work with approval gates.",
    summary:
      "Composes an execution plan from a single instruction, then runs it step by step with human approval, scheduling and retries.",
    status: "DEMO",
    inputs: ["Objective", "Constraints", "Authorized integrations"],
    outputs: ["Execution plan", "Step results", "Job record", "Audit trail"],
    workflow: ["Objective", "Plan", "Approve", "Execute", "Report"],
    notice: "External actions only run through integrations you have explicitly authorized.",
    layout: {
      left: [P("prompt", "Objective"), P("controls", "Guardrails", "Approval mode, budget, schedule")],
      main: [
        P("steps", "Execution plan", "Each step is gated", [
          "Collect source material",
          "Draft deliverable",
          "Request approval",
          "Deliver & log",
        ]),
        P("approvals", "Approval gates"),
      ],
      right: [P("queue", "Job status"), P("history", "Execution history")],
    },
  },
  {
    id: "04",
    slug: "legal-intelligence",
    name: "Legal & Contract Intelligence",
    group: "research",
    tagline: "Read contracts with clause-level citations.",
    summary: "Clause extraction, risk findings, contract comparison and page-cited answers over uploaded agreements.",
    status: "DEMO",
    inputs: ["PDF / DOCX contracts", "Playbook rules"],
    outputs: ["Clause map", "Risk findings", "Comparison", "Report"],
    workflow: ["Upload", "Extract clauses", "Score risk", "Compare", "Export report"],
    notice: "Autarch provides AI assistance, not professional legal advice. Have counsel review outcomes.",
    layout: {
      left: [P("upload", "Documents"), P("clauses", "Clause extraction")],
      main: [P("viewer", "Document viewer"), P("chat", "Ask about this contract")],
      right: [P("findings", "Risk findings"), P("history", "Reports")],
    },
  },
  {
    id: "05",
    slug: "voice-studio",
    name: "Voice Studio",
    group: "media",
    tagline: "Narration with control over pace and character.",
    summary: "Text to speech with language, style and pacing controls, waveform review and export.",
    status: "REQUIRES API",
    inputs: ["Script text", "Language", "Voice profile"],
    outputs: ["Audio file", "Waveform", "Take history"],
    workflow: ["Write", "Choose voice", "Render", "Review", "Export"],
    notice: "Voice replication requires recorded consent from the speaker.",
    layout: {
      left: [P("prompt", "Script"), P("controls", "Language, style, pacing")],
      main: [P("waveform", "Waveform"), P("player", "Audio player")],
      right: [P("history", "Takes"), P("queue", "Render queue")],
    },
  },
  {
    id: "06",
    slug: "image-studio",
    name: "Image Generation Studio",
    group: "design",
    tagline: "Composition-first image generation.",
    summary: "Prompt and reference driven image generation with aspect control, variations and iterative editing.",
    status: "REQUIRES API",
    inputs: ["Prompt", "Reference images", "Aspect ratio"],
    outputs: ["Images", "Variations", "Edit history"],
    workflow: ["Prompt", "Generate", "Vary", "Edit", "Download"],
    layout: {
      left: [P("prompt", "Prompt"), P("upload", "References"), P("controls", "Aspect & style")],
      main: [P("canvas", "Generation canvas"), P("variants", "Variations")],
      right: [P("history", "History")],
    },
  },
  {
    id: "07",
    slug: "research",
    name: "AI Research & Search",
    group: "research",
    tagline: "Answers that show their sources.",
    summary: "Runs source search, collects citable source cards and assembles a structured research report.",
    status: "REQUIRES API",
    inputs: ["Research question", "Scope & recency", "Seed sources"],
    outputs: ["Source cards", "Cited report", "Follow-up questions"],
    workflow: ["Question", "Search", "Read sources", "Draft report", "Export"],
    notice: "Citations are only ever shown when a real retrieved source exists.",
    layout: {
      left: [P("prompt", "Research question"), P("controls", "Depth, recency, domains")],
      main: [P("sources", "Source cards"), P("notes", "Research report")],
      right: [P("suggestions", "Follow-up questions"), P("history", "Saved research")],
    },
  },
  {
    id: "08",
    slug: "academic-intelligence",
    name: "Academic Intelligence",
    group: "research",
    tagline: "Turn lectures into study systems.",
    summary: "Lecture audio and course documents become notes, summaries, flashcards, quizzes and a study guide.",
    status: "DEMO",
    inputs: ["Lecture audio", "Slides / PDFs", "Syllabus"],
    outputs: ["Notes", "Summary", "Flashcards", "Quiz", "Study guide"],
    workflow: ["Upload", "Transcribe", "Structure notes", "Generate practice", "Export"],
    layout: {
      left: [P("upload", "Lecture & documents")],
      main: [P("notes", "Notes & summary"), P("flashcards", "Flashcards"), P("quiz", "Quiz")],
      right: [P("chat", "Ask the material"), P("history", "Study sets")],
    },
  },
  {
    id: "09",
    slug: "assistant",
    name: "Autarch Workspace Assistant",
    group: "research",
    tagline: "One assistant across your whole workspace.",
    summary:
      "Conversational surface that, once authorized, reasons over your projects, tasks, files, deadlines and generations.",
    status: "DEMO",
    inputs: ["Conversation", "Authorized workspace scopes"],
    outputs: ["Answers", "Drafts", "Created tasks"],
    workflow: ["Ask", "Assistant gathers context", "Act", "Save to project"],
    notice: "Workspace access is scoped per user and granted explicitly. Nothing is read without authorization.",
    layout: {
      left: [P("controls", "Context scopes", "Projects, tasks, files, deadlines")],
      main: [P("chat", "Assistant")],
      right: [P("suggestions", "Suggested actions"), P("history", "Conversations")],
    },
  },
  {
    id: "10",
    slug: "portrait-studio",
    name: "Professional Portrait Studio",
    group: "design",
    tagline: "Studio portraits from your own photos.",
    summary: "Consented portrait input with style, background and lighting controls, plus variant selection.",
    status: "REQUIRES PAID SERVICE",
    inputs: ["Your own photographs", "Style", "Background", "Lighting"],
    outputs: ["Portrait set", "Variants", "Export bundle"],
    workflow: ["Upload consented photos", "Set style", "Generate", "Select", "Export"],
    notice: "Only upload images of yourself or people who have authorized you.",
    layout: {
      left: [P("upload", "Authorized photos"), P("controls", "Style, background, lighting")],
      main: [P("canvas", "Generation canvas"), P("variants", "Variants")],
      right: [P("history", "Sessions")],
    },
  },
  {
    id: "11",
    slug: "document-intelligence",
    name: "Document & PDF Intelligence",
    group: "research",
    tagline: "Every document, answerable.",
    summary: "PDF viewing with OCR fallback, semantic Q&A, page citations, summaries and document comparison.",
    status: "DEMO",
    inputs: ["PDF", "Scans (OCR)", "Office documents"],
    outputs: ["Summary", "Cited answers", "Comparison", "Export"],
    workflow: ["Upload", "Index", "Ask", "Cite", "Export"],
    layout: {
      left: [P("upload", "Documents"), P("outline", "Document outline")],
      main: [P("viewer", "PDF viewer"), P("chat", "Document chat")],
      right: [P("notes", "Summary"), P("findings", "Page citations")],
    },
  },
  {
    id: "12",
    slug: "music-studio",
    name: "Music & Audio Creation",
    group: "media",
    tagline: "Score a scene in a sentence.",
    summary: "Prompted music generation with style and duration controls, progress, waveform and export.",
    status: "REQUIRES PAID SERVICE",
    inputs: ["Prompt", "Style", "Duration", "Reference track"],
    outputs: ["Audio track", "Stems", "History"],
    workflow: ["Prompt", "Set style", "Render", "Review", "Export"],
    layout: {
      left: [P("prompt", "Prompt"), P("controls", "Style, tempo, duration")],
      main: [P("queue", "Generation progress"), P("waveform", "Waveform"), P("player", "Player")],
      right: [P("history", "Tracks")],
    },
  },
  {
    id: "13",
    slug: "video-repurposing",
    name: "Video Repurposing",
    group: "media",
    tagline: "Long video in. Short clips out.",
    summary: "Transcribes a long video, proposes high-signal clips on a timeline and previews vertical cuts with captions.",
    status: "COMING SOON",
    inputs: ["Long-form video", "Target platform", "Clip length"],
    outputs: ["Transcript", "Clip set", "Captions", "Vertical exports"],
    workflow: ["Upload", "Transcribe", "Detect moments", "Frame vertical", "Export"],
    layout: {
      left: [P("upload", "Video"), P("notes", "Transcript")],
      main: [P("timeline", "Timeline"), P("suggestions", "Suggested clips")],
      right: [P("preview", "Vertical preview"), P("captions", "Captions")],
    },
  },
  {
    id: "14",
    slug: "video-transformation",
    name: "Video Transformation",
    group: "media",
    tagline: "Restyle footage frame-consistently.",
    summary: "Applies style transformation to uploaded footage with a render queue, progress and variant comparison.",
    status: "COMING SOON",
    inputs: ["Source video", "Style", "Strength"],
    outputs: ["Rendered video", "Variants", "Render log"],
    workflow: ["Upload", "Set style", "Queue render", "Compare", "Export"],
    layout: {
      left: [P("upload", "Source video"), P("controls", "Style & strength")],
      main: [P("queue", "Rendering queue"), P("preview", "Preview")],
      right: [P("variants", "Variations"), P("history", "Renders")],
    },
  },
  {
    id: "15",
    slug: "presentation-builder",
    name: "AI Presentation Builder",
    group: "design",
    tagline: "From brief to deck, editable.",
    summary: "Builds an outline then editable slides with charts, imagery and speaker notes.",
    status: "DEMO",
    inputs: ["Prompt", "Source document", "Brand tokens"],
    outputs: ["Outline", "Slides", "Speaker notes", "Export"],
    workflow: ["Brief", "Outline", "Generate slides", "Edit", "Export"],
    layout: {
      left: [P("prompt", "Brief or document"), P("outline", "Outline")],
      main: [P("slides", "Slide navigator"), P("charts", "Charts & visuals")],
      right: [P("notes", "Speaker notes"), P("history", "Decks")],
    },
  },
  {
    id: "16",
    slug: "interior-design",
    name: "Interior & Spatial Design",
    group: "design",
    tagline: "Reimagine a room from one photograph.",
    summary: "Room image plus type, style and preferences produces before/after concepts and variants.",
    status: "REQUIRES API",
    inputs: ["Room photo", "Room type", "Style", "Constraints"],
    outputs: ["Concepts", "Before/after", "Variants", "Export"],
    workflow: ["Upload room", "Set style", "Generate concepts", "Compare", "Export"],
    layout: {
      left: [P("upload", "Room photo"), P("controls", "Room type, style, preferences")],
      main: [P("beforeafter", "Before / after"), P("variants", "Concepts")],
      right: [P("history", "Sessions")],
    },
  },
  {
    id: "17",
    slug: "broll-engine",
    name: "Creator Asset & B-Roll Engine",
    group: "business",
    tagline: "Visual inserts that match what was said.",
    summary: "Analyses a script or recording and proposes b-roll, charts and inserts placed on the timeline.",
    status: "DEMO",
    inputs: ["Video / audio", "Script", "Brand kit"],
    outputs: ["Transcript", "Insert suggestions", "Timeline plan", "Assets"],
    workflow: ["Upload", "Analyse context", "Suggest inserts", "Place", "Export"],
    layout: {
      left: [P("upload", "Video, audio or script"), P("notes", "Transcript")],
      main: [P("suggestions", "B-roll suggestions"), P("timeline", "Timeline placement")],
      right: [P("charts", "Generated charts"), P("history", "Asset library")],
    },
  },
  {
    id: "18",
    slug: "email-workspace",
    name: "Intelligent Email Workspace",
    group: "business",
    tagline: "An inbox that briefs you.",
    summary: "Summarises an authorized mailbox, categorises threads, surfaces priority messages and drafts replies.",
    status: "REQUIRES API",
    inputs: ["Authorized mailbox", "Tone preferences"],
    outputs: ["Inbox brief", "Categories", "Drafts", "Reminders"],
    workflow: ["Connect", "Summarise", "Prioritise", "Draft", "Approve & send"],
    notice: "Sending requires an authorized connection and explicit approval per message.",
    layout: {
      left: [P("inbox", "Threads"), P("controls", "Categories & filters")],
      main: [P("notes", "Inbox summary"), P("chat", "AI draft")],
      right: [P("approvals", "Approve before sending"), P("history", "Follow-ups")],
    },
  },
  {
    id: "19",
    slug: "sales-workspace",
    name: "Conversational Sales Workspace",
    group: "business",
    tagline: "Qualify, reply, hand off.",
    summary: "Unified conversation inbox with lead profiles, AI replies, qualification scoring and human handoff.",
    status: "DEMO",
    inputs: ["Conversations", "Lead data", "Offer details"],
    outputs: ["Replies", "Qualification", "Summaries", "CRM activity"],
    workflow: ["Receive", "Qualify", "Draft reply", "Approve", "Hand off"],
    layout: {
      left: [P("inbox", "Conversations")],
      main: [P("chat", "Thread & AI reply"), P("notes", "Conversation summary")],
      right: [P("leads", "Lead profile"), P("handoff", "Human handoff")],
    },
  },
  {
    id: "20",
    slug: "avatar-studio",
    name: "AI Avatar Studio",
    group: "media",
    tagline: "Presenter video from a script.",
    summary: "Authorized avatar plus script and voice produces lip-synced presenter video through a render queue.",
    status: "REQUIRES PAID SERVICE",
    inputs: ["Authorized avatar footage", "Script", "Voice"],
    outputs: ["Presenter video", "Takes", "Export"],
    workflow: ["Upload avatar", "Write script", "Pick voice", "Render", "Export"],
    notice: "Avatar likeness requires documented consent from the person depicted.",
    layout: {
      left: [P("upload", "Authorized avatar"), P("prompt", "Script"), P("controls", "Voice & delivery")],
      main: [P("queue", "Generation queue"), P("preview", "Video preview")],
      right: [P("history", "Takes")],
    },
  },
  {
    id: "21",
    slug: "marketing-automation",
    name: "Marketing Automation",
    group: "business",
    tagline: "Campaigns from idea to calendar.",
    summary: "Campaign builder with content generation, caption variants, scheduling calendar, approvals and analytics.",
    status: "DEMO",
    inputs: ["Campaign brief", "Assets", "Channels"],
    outputs: ["Content set", "Variants", "Schedule", "Analytics"],
    workflow: ["Brief", "Generate", "Vary", "Schedule", "Approve", "Publish"],
    notice: "Publishing happens only through channels you connect and authorize.",
    layout: {
      left: [P("prompt", "Campaign brief"), P("controls", "Channels & tone")],
      main: [P("variants", "Content & captions"), P("calendar", "Schedule")],
      right: [P("approvals", "Approval workflow"), P("charts", "Analytics")],
    },
  },
  {
    id: "22",
    slug: "finance-analytics",
    name: "Finance & Data Analytics",
    group: "business",
    tagline: "Spreadsheets that explain themselves.",
    summary: "Upload data for an interactive table, AI analysis, formulas, charts, trend and anomaly detection.",
    status: "DEMO",
    inputs: ["CSV / XLSX", "Ledger export", "Metric definitions"],
    outputs: ["Data table", "Charts", "Anomalies", "Dashboard", "Report"],
    workflow: ["Upload", "Profile data", "Ask questions", "Build dashboard", "Export report"],
    layout: {
      left: [P("upload", "Data files"), P("prompt", "Ask about this data")],
      main: [P("table", "Data table"), P("charts", "Charts & trends")],
      right: [P("findings", "Anomaly detection"), P("notes", "Report")],
    },
  },
  {
    id: "23",
    slug: "translation-dubbing",
    name: "Translation & Dubbing",
    group: "media",
    tagline: "One message, every language.",
    summary: "Transcription, translation, subtitles and synchronised dubbing with side-by-side preview.",
    status: "REQUIRES API",
    inputs: ["Video / audio / text", "Source & target languages"],
    outputs: ["Transcript", "Translation", "Subtitles", "Dubbed audio"],
    workflow: ["Upload", "Transcribe", "Translate", "Dub", "Sync", "Export"],
    layout: {
      left: [P("upload", "Source file or text"), P("languages", "Languages")],
      main: [P("notes", "Transcript & translation"), P("captions", "Subtitles"), P("player", "Dubbed preview")],
      right: [P("timeline", "Synchronisation"), P("history", "Exports")],
    },
  },
];

export const getModule = (slug: string) => MODULES.find((m) => m.slug === slug);

export const modulesByGroup = (group: ModuleGroupId) => MODULES.filter((m) => m.group === group);

export const STATUS_TONE: Record<ModuleStatus, string> = {
  REAL: "bg-sage/50 text-foreground",
  DEMO: "bg-secondary text-muted-foreground",
  "REQUIRES API": "bg-mist/50 text-foreground",
  "REQUIRES PAID SERVICE": "bg-sand/50 text-foreground",
  "COMING SOON": "bg-blush/40 text-foreground",
};
