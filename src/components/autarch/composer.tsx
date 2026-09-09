import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Paperclip, Sparkles, ChevronDown, FolderOpen } from "lucide-react";
import { MODULES, getModule } from "@/lib/modules";
import { DEMO_PROJECTS, EXAMPLE_PROMPTS, recommendModule } from "@/lib/demo-data";
import { StatusBadge } from "./status-badge";
import { Typewriter } from "./typewriter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * The Autarch command composer.
 * Recommends a capability from the request text, the user confirms, then the
 * matching module workspace opens with the request pre-loaded (client-side).
 */
export function Composer({
  size = "lg",
  showProject = true,
  className,
}: {
  size?: "lg" | "md";
  showProject?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [capability, setCapability] = useState<string>("auto");
  const [project, setProject] = useState<string>(DEMO_PROJECTS[0]!.id);
  const [attachments, setAttachments] = useState<string[]>([]);

  const recommended = useMemo(() => (value.trim() ? recommendModule(value) : null), [value]);
  const target = capability === "auto" ? recommended : capability;
  const targetModule = target ? getModule(target) : undefined;

  const submit = () => {
    const slug = target ?? "assistant";
    const q = value.trim();
    navigate({
      to: "/app/modules/$slug",
      params: { slug },
      search: q ? { q } : {},
    });
  };


  return (
    <div className={cn("panel shadow-studio", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="label-mono">Command composer</span>
        <span className="label-mono hidden sm:inline">Autarch routes your request</span>
      </div>

      <div className="px-4 pt-4">
        <label htmlFor="autarch-composer" className="sr-only">
          What do you want Autarch to do?
        </label>
        <textarea
          id="autarch-composer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={size === "lg" ? 3 : 2}
          placeholder="What do you want Autarch to do?"
          className="w-full resize-none bg-transparent text-[0.95rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {!value && (
          <div aria-hidden="true" className="mt-1 text-xs text-muted-foreground">
            <Typewriter phrases={EXAMPLE_PROMPTS} />
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((a) => (
            <span key={a} className="rounded-md border border-border bg-secondary px-2 py-1 text-[0.7rem]">
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setAttachments((a) => [...a, `reference-${a.length + 1}.pdf`])}
        >
          <Paperclip className="size-3.5" /> Attach file
        </Button>

        <Select value={capability} onValueChange={setCapability}>
          <SelectTrigger className="w-[13.5rem] text-xs">
            <SelectValue placeholder="Capability" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="auto">Auto-select capability</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m.slug} value={m.slug}>
                {m.id} · {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showProject && (
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="w-[11.5rem] text-xs">
              <FolderOpen className="size-3.5" />
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_PROJECTS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button type="button" size="sm" className="ml-auto gap-1.5 text-xs" onClick={submit}>
          Submit <ArrowUp className="size-3.5" />
        </Button>
      </div>

      {targetModule && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/50 px-4 py-2.5">
          <Sparkles className="size-3.5 text-muted-foreground" />
          <span className="label-mono">Recommended</span>
          <span className="text-xs">
            {targetModule.id} · {targetModule.name}
          </span>
          <StatusBadge status={targetModule.status} />
          <span className="ml-auto text-[0.7rem] text-muted-foreground">Confirm to open workspace</span>
        </div>
      )}

      <div className="rule-x flex flex-wrap gap-1.5 px-4 py-3">
        {EXAMPLE_PROMPTS.slice(0, 5).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setValue(p)}
            className="rounded-full border border-border px-2.5 py-1 text-[0.7rem] text-muted-foreground transition-colors hover:border-border-strong hover:bg-secondary hover:text-foreground"
          >
            {p}
          </button>
        ))}
        <span className="ml-auto hidden items-center gap-1 self-center text-[0.7rem] text-muted-foreground sm:flex">
          ⌘↵ to submit <ChevronDown className="size-3" />
        </span>
      </div>
    </div>
  );
}
