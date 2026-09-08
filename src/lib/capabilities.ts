/**
 * AUTARCH AI — capability registry + module capability manifest.
 *
 * Modules never name a provider. A module declares the capabilities it needs;
 * the central gateway resolves each capability to the currently active provider.
 * Plugging one provider into a capability therefore serves every pre-wired module.
 */

export const CAPABILITIES = [
  "MAIN_LLM",
  "REASONING",
  "CODING",
  "SEARCH",
  "IMAGE_GENERATION",
  "IMAGE_EDITING",
  "SPEECH_STT",
  "SPEECH_TTS",
  "TRANSLATION",
  "VIDEO_GENERATION",
  "VIDEO_PROCESSING",
  "MUSIC_GENERATION",
  "AVATAR_LIPSYNC",
  "EMBEDDINGS",
  "DOCUMENT_EXTRACTION",
  "CODE_SANDBOX",
  "EMAIL_INTEGRATION",
  "CRM_INTEGRATION",
  "SOCIAL_INTEGRATION",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** Capability families that a code adapter exists for today. */
export const TEXT_CAPABILITIES: Capability[] = ["MAIN_LLM", "REASONING", "CODING"];

export const ADAPTERS = [
  { id: "openai_compatible", label: "OpenAI-compatible LLM", implemented: true },
  { id: "builtin_lovable", label: "Autarch built-in AI gateway", implemented: true },
  { id: "rest_search", label: "Search (REST)", implemented: false },
  { id: "rest_image", label: "Image generation (REST)", implemented: false },
  { id: "rest_stt", label: "Speech to text (REST)", implemented: false },
  { id: "rest_tts", label: "Text to speech (REST)", implemented: false },
  { id: "rest_translation", label: "Translation (REST)", implemented: false },
  { id: "rest_video", label: "Video (REST)", implemented: false },
  { id: "rest_music", label: "Music (REST)", implemented: false },
  { id: "rest_avatar", label: "Avatar / lip-sync (REST)", implemented: false },
  { id: "rest_embeddings", label: "Embeddings (REST)", implemented: false },
] as const;

export type AdapterId = (typeof ADAPTERS)[number]["id"];

export const IMPLEMENTED_ADAPTERS: string[] = ADAPTERS.filter((a) => a.implemented).map((a) => a.id);

export type ModuleStatusSetting = "live" | "beta" | "coming_soon" | "maintenance" | "disabled";

export type ModuleManifestEntry = {
  slug: string;
  /** capabilities the module cannot run without */
  required: Capability[];
  /** capabilities that improve the module but are not blocking */
  optional?: Capability[];
  /** non-provider infrastructure the module needs (e.g. a code sandbox) */
  infrastructure?: string[];
  defaultStatus: ModuleStatusSetting;
  minPlan: "free" | "starter" | "plus" | "pro" | "business";
  creditsPerRun: number;
};

/**
 * All 23 modules are wired now. The 8 that need an unimplemented capability
 * adapter stay COMING SOON until the owner both configures the provider and
 * explicitly switches the module on.
 */
export const MODULE_MANIFEST: ModuleManifestEntry[] = [
  { slug: "software-builder", required: ["MAIN_LLM", "CODING"], optional: ["REASONING"], infrastructure: ["CODE_SANDBOX"], defaultStatus: "live", minPlan: "free", creditsPerRun: 2 },
  { slug: "code-workspace", required: ["CODING"], optional: ["MAIN_LLM"], infrastructure: ["CODE_SANDBOX"], defaultStatus: "live", minPlan: "free", creditsPerRun: 2 },
  { slug: "ai-workforce", required: ["MAIN_LLM"], optional: ["REASONING", "SEARCH"], defaultStatus: "live", minPlan: "free", creditsPerRun: 2 },
  { slug: "legal-intelligence", required: ["MAIN_LLM"], optional: ["DOCUMENT_EXTRACTION"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "voice-studio", required: ["SPEECH_TTS"], defaultStatus: "live", minPlan: "starter", creditsPerRun: 2 },
  { slug: "image-studio", required: ["IMAGE_GENERATION"], optional: ["IMAGE_EDITING"], defaultStatus: "live", minPlan: "starter", creditsPerRun: 3 },
  { slug: "research", required: ["SEARCH", "MAIN_LLM"], defaultStatus: "live", minPlan: "free", creditsPerRun: 2 },
  { slug: "academic-intelligence", required: ["MAIN_LLM"], optional: ["SPEECH_STT"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "assistant", required: ["MAIN_LLM"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "portrait-studio", required: ["IMAGE_GENERATION", "IMAGE_EDITING"], defaultStatus: "coming_soon", minPlan: "pro", creditsPerRun: 4 },
  { slug: "document-intelligence", required: ["MAIN_LLM"], optional: ["DOCUMENT_EXTRACTION", "EMBEDDINGS"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "music-studio", required: ["MUSIC_GENERATION"], defaultStatus: "coming_soon", minPlan: "pro", creditsPerRun: 5 },
  { slug: "video-repurposing", required: ["VIDEO_PROCESSING", "SPEECH_STT"], defaultStatus: "coming_soon", minPlan: "pro", creditsPerRun: 6 },
  { slug: "video-transformation", required: ["VIDEO_GENERATION"], defaultStatus: "coming_soon", minPlan: "pro", creditsPerRun: 8 },
  { slug: "presentation-builder", required: ["MAIN_LLM"], optional: ["IMAGE_GENERATION"], defaultStatus: "live", minPlan: "free", creditsPerRun: 2 },
  { slug: "interior-design", required: ["IMAGE_EDITING"], defaultStatus: "coming_soon", minPlan: "starter", creditsPerRun: 3 },
  { slug: "broll-engine", required: ["SEARCH", "IMAGE_GENERATION"], optional: ["SPEECH_STT"], defaultStatus: "coming_soon", minPlan: "starter", creditsPerRun: 3 },
  { slug: "email-workspace", required: ["EMAIL_INTEGRATION", "MAIN_LLM"], defaultStatus: "coming_soon", minPlan: "starter", creditsPerRun: 1 },
  { slug: "sales-workspace", required: ["MAIN_LLM"], optional: ["CRM_INTEGRATION"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "avatar-studio", required: ["AVATAR_LIPSYNC", "SPEECH_TTS"], defaultStatus: "coming_soon", minPlan: "business", creditsPerRun: 8 },
  { slug: "marketing-automation", required: ["MAIN_LLM"], optional: ["SOCIAL_INTEGRATION", "IMAGE_GENERATION"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "finance-analytics", required: ["MAIN_LLM"], defaultStatus: "live", minPlan: "free", creditsPerRun: 1 },
  { slug: "translation-dubbing", required: ["TRANSLATION"], optional: ["SPEECH_TTS", "SPEECH_STT"], defaultStatus: "live", minPlan: "starter", creditsPerRun: 2 },
];

export const getManifest = (slug: string) => MODULE_MANIFEST.find((m) => m.slug === slug);

export const LAUNCH_SLUGS = MODULE_MANIFEST.filter((m) => m.defaultStatus === "live").map((m) => m.slug);
export const FUTURE_SLUGS = MODULE_MANIFEST.filter((m) => m.defaultStatus !== "live").map((m) => m.slug);

export const MODULE_SYSTEM_PROMPTS: Record<string, string> = {
  assistant: "You are Autarch, a precise multi-purpose assistant. Answer directly and concisely.",
  "software-builder":
    "You are a senior software architect. Produce an implementation plan, file tree and key code for the request.",
  "code-workspace": "You are a senior engineer. Return focused, correct code with a short explanation.",
  "ai-workforce": "You are an operations lead. Break the goal into delegable agent tasks with owners and outputs.",
  "legal-intelligence":
    "You are a contract analyst. Summarise clauses, risks and obligations. Add a short note that this is not legal advice.",
  "academic-intelligence": "You are a research assistant. Produce structured academic analysis with clear sections.",
  "document-intelligence": "You extract structure, entities and summaries from documents.",
  "presentation-builder": "You produce slide outlines: title, bullets and speaker notes per slide.",
  "sales-workspace": "You are a B2B sales strategist writing outreach and qualification material.",
  "marketing-automation": "You are a growth marketer producing campaign copy, sequences and angles.",
  "finance-analytics": "You are a financial analyst producing clear, numerate analysis and caveats.",
};

export const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, plus: 2, pro: 3, business: 4 };

export const STATUS_LABEL: Record<ModuleStatusSetting, string> = {
  live: "LIVE",
  beta: "BETA",
  coming_soon: "COMING SOON",
  maintenance: "MAINTENANCE",
  disabled: "DISABLED",
};
