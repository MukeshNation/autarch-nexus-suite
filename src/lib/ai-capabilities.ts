/**
 * Which module workspaces can execute through the implemented text adapters.
 * Derived from the capability manifest — no per-module provider wiring.
 */
import { MODULE_MANIFEST, TEXT_CAPABILITIES, MODULE_SYSTEM_PROMPTS } from "./capabilities";

export const AI_TEXT_MODULES = new Set<string>(
  MODULE_MANIFEST.filter((m) => m.required.some((c) => TEXT_CAPABILITIES.includes(c))).map((m) => m.slug),
);

export function isAiTextModule(slug: string) {
  return AI_TEXT_MODULES.has(slug);
}

export { MODULE_SYSTEM_PROMPTS };
