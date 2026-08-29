import type { ReactNode } from "react";
import {
  Upload,
  FileText,
  Folder,
  Play,
  Terminal as TerminalIcon,
  Check,
  Clock,
  AlertTriangle,
  Languages,
  CalendarDays,
  Layers,
  Wand2,
  ImageIcon,
  ChevronRight,
} from "lucide-react";
import type { Panel } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function PanelFrame({
  title,
  note,
  children,
  className,
  actions,
}: {
  title: string;
  note?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  actions?: ReactNode | undefined;

}) {
  return (
    <section className={cn("panel flex flex-col overflow-hidden", className)}>
      <header className="flex items-center gap-2 border-b border-border px-3.5 py-2">
        <span className="label-mono">{title}</span>
        {note && <span className="truncate text-[0.7rem] text-muted-foreground">· {note}</span>}
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </header>
      <div className="flex-1 p-3.5">{children}</div>
    </section>
  );
}

function EmptyState({ icon, label, hint }: { icon: ReactNode; label: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-mono text-xs">{label}</span>
      {hint && <span className="max-w-56 text-[0.7rem] leading-snug text-muted-foreground">{hint}</span>}
    </div>
  );
}

const Row = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex items-center gap-2 border-b border-border py-2 text-xs last:border-0", className)}>
    {children}
  </div>
);

const Bars = ({ n = 40, seed = 3 }: { n?: number; seed?: number }) => (
  <div className="flex h-16 items-end gap-[2px]">
    {Array.from({ length: n }).map((_, i) => (
      <span
        key={i}
        className="w-full rounded-sm bg-border-strong/70"
        style={{ height: `${18 + Math.abs(Math.sin((i + seed) * 0.7)) * 78}%` }}
      />
    ))}
  </div>
);

/** Renders one specialized panel body based on its declared kind. */
export function ModulePanel({ panel, request }: { panel: Panel; request?: string | undefined }) {
  const { kind, title, note, items } = panel;

  switch (kind) {
    case "prompt":
      return (
        <PanelFrame title={title} note={note}>
          <div className="rounded-md border border-border bg-secondary/40 p-3">
            <p className="min-h-16 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {request || <span className="text-muted-foreground">Describe the task…</span>}
            </p>
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="font-mono text-xs">
              Run
            </Button>
            <Button size="sm" variant="outline" className="font-mono text-xs">
              Save to project
            </Button>
          </div>
        </PanelFrame>
      );

    case "controls":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-3">
            {["Preset", "Intensity", "Format", "Language"].map((label, i) => (
              <div key={label}>
                <div className="label-mono mb-1.5">{label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {["Auto", "Balanced", "Precise"].map((opt, j) => (
                    <span
                      key={opt}
                      className={cn(
                        "cursor-default rounded-full border px-2.5 py-1 font-mono text-[0.68rem]",
                        i === j
                          ? "border-border-strong bg-secondary text-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "upload":
      return (
        <PanelFrame title={title} note={note}>
          <EmptyState
            icon={<Upload className="size-5" />}
            label="Drop files or click to upload"
            hint="Uploads are validated and scoped to your workspace once storage is connected."
          />
        </PanelFrame>
      );

    case "viewer":
      return (
        <PanelFrame title={title} note={note} actions={<span className="label-mono">p. 1 / 24</span>}>
          <div className="space-y-2 rounded-md border border-border bg-card p-4">
            <Skeleton className="h-3 w-1/3" />
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-2.5", i % 4 === 3 ? "w-2/3" : "w-full")} />
            ))}
          </div>
        </PanelFrame>
      );

    case "chat":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-3">
            <div className="ml-auto max-w-[85%] rounded-md rounded-br-none border border-border bg-secondary px-3 py-2 font-mono text-xs">
              {request || "What should I look at first?"}
            </div>
            <div className="max-w-[90%] rounded-md rounded-bl-none border border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Responses appear here once an AI provider is connected in a later phase.
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <span className="flex-1 font-mono text-[0.7rem] text-muted-foreground">Message Autarch…</span>
              <Button size="sm" variant="outline" className="font-mono text-[0.7rem]">
                Send
              </Button>
            </div>
          </div>
        </PanelFrame>
      );

    case "filetree":
      return (
        <PanelFrame title={title} note={note}>
          <ul className="font-mono text-xs">
            {["src/", "  routes/", "    index.tsx", "    pricing.tsx", "  components/", "    hero.tsx", "  styles.css", "package.json"].map(
              (f) => (
                <li key={f} className="flex items-center gap-1.5 rounded px-1 py-1 hover:bg-secondary">
                  {f.trim().endsWith("/") ? (
                    <Folder className="size-3 text-muted-foreground" />
                  ) : (
                    <FileText className="size-3 text-muted-foreground" />
                  )}
                  <span className="whitespace-pre">{f}</span>
                </li>
              ),
            )}
          </ul>
        </PanelFrame>
      );

    case "editor":
      return (
        <PanelFrame
          title={title}
          note={note}
          actions={
            <div className="flex gap-1">
              {["index.tsx", "hero.tsx"].map((t, i) => (
                <span
                  key={t}
                  className={cn(
                    "rounded-t border border-border px-2 py-0.5 font-mono text-[0.65rem]",
                    i === 0 ? "bg-secondary" : "text-muted-foreground",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          }
        >
          <pre className="overflow-x-auto rounded-md border border-border bg-secondary/40 p-3 font-mono text-[0.72rem] leading-relaxed text-muted-foreground">
            {`export function Hero() {
  return (
    <section className="hero">
      {/* generated content */}
    </section>
  );
}`}
          </pre>
        </PanelFrame>
      );

    case "terminal":
      return (
        <PanelFrame title={title} note={note} actions={<TerminalIcon className="size-3.5 text-muted-foreground" />}>
          <pre className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-[0.72rem] leading-relaxed text-muted-foreground">
            {`$ autarch build
› resolving plan…
› writing 14 files
› build queued (no worker connected)`}
          </pre>
        </PanelFrame>
      );

    case "diff":
      return (
        <PanelFrame title={title} note={note}>
          <div className="overflow-hidden rounded-md border border-border font-mono text-[0.72rem]">
            {[
              { t: "+", l: 'import { Composer } from "./composer";', c: "bg-sage/25" },
              { t: " ", l: "export function Page() {", c: "" },
              { t: "-", l: "  return <div>old</div>;", c: "bg-blush/25" },
              { t: "+", l: "  return <Composer />;", c: "bg-sage/25" },
              { t: " ", l: "}", c: "" },
            ].map((row, i) => (
              <div key={i} className={cn("flex gap-3 px-3 py-1", row.c)}>
                <span className="w-3 text-muted-foreground">{row.t}</span>
                <span className="whitespace-pre">{row.l}</span>
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "preview":
      return (
        <PanelFrame title={title} note={note} actions={<Play className="size-3.5 text-muted-foreground" />}>
          <div className="aspect-video w-full rounded-md border border-border grid-paper" />
        </PanelFrame>
      );

    case "canvas":
      return (
        <PanelFrame title={title} note={note}>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border grid-paper"
              >
                <ImageIcon className="size-5 text-muted-foreground/60" />
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[0.68rem] text-muted-foreground">
            Generation surface. Output appears here once the image provider is connected.
          </p>
        </PanelFrame>
      );

    case "variants":
      return (
        <PanelFrame title={title} note={note}>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="aspect-square w-full rounded-md" />
                <span className="block font-mono text-[0.62rem] text-muted-foreground">v{i + 1}</span>
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "waveform":
      return (
        <PanelFrame title={title} note={note}>
          <Bars n={64} />
        </PanelFrame>
      );

    case "player":
      return (
        <PanelFrame title={title} note={note}>
          <div className="flex items-center gap-3 rounded-md border border-border px-3 py-3">
            <Button size="icon" variant="outline" className="size-8">
              <Play className="size-3.5" />
            </Button>
            <div className="h-1 flex-1 rounded-full bg-border">
              <div className="h-1 w-1/3 rounded-full bg-foreground" />
            </div>
            <span className="font-mono text-[0.68rem] text-muted-foreground">00:38 / 01:54</span>
          </div>
        </PanelFrame>
      );

    case "timeline":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-2">
            {["Video", "Audio", "Captions", "Inserts"].map((track, i) => (
              <div key={track} className="flex items-center gap-2">
                <span className="w-16 font-mono text-[0.62rem] text-muted-foreground">{track}</span>
                <div className="relative h-6 flex-1 rounded border border-border bg-secondary/40">
                  <span
                    className="absolute top-0.5 bottom-0.5 rounded bg-border-strong/70"
                    style={{ left: `${8 + i * 14}%`, width: `${18 + i * 6}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "steps":
      return (
        <PanelFrame title={title} note={note}>
          <ol className="space-y-2">
            {(items ?? ["Plan", "Generate", "Review", "Deliver"]).map((step, i) => (
              <li key={step} className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2">
                <span className="mt-0.5 font-mono text-[0.62rem] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-xs">{step}</span>
                <span className="label-mono">{i === 0 ? "Ready" : "Pending"}</span>
              </li>
            ))}
          </ol>
        </PanelFrame>
      );

    case "queue":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-3">
            {[
              { l: "Current job", s: "Queued", p: 0 },
              { l: "Previous job", s: "Completed", p: 100 },
            ].map((j) => (
              <div key={j.l}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[0.7rem]">{j.l}</span>
                  <span className="label-mono ml-auto">{j.s}</span>
                </div>
                <Progress value={j.p} className="h-1" />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="font-mono text-[0.7rem]">
                Retry
              </Button>
              <Button size="sm" variant="ghost" className="font-mono text-[0.7rem]">
                Cancel
              </Button>
            </div>
            <p className="font-mono text-[0.65rem] text-muted-foreground">
              States: Queued · Processing · Completed · Failed · Cancelled
            </p>
          </div>
        </PanelFrame>
      );

    case "table":
      return (
        <PanelFrame title={title} note={note}>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[0.7rem]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  {["Period", "Revenue", "Cost", "Margin"].map((h) => (
                    <th key={h} className="py-1.5 pr-4 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["Jan", "Feb", "Mar", "Apr", "May"].map((m, i) => (
                  <tr key={m} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-4">{m}</td>
                    <td className="py-1.5 pr-4">{(120 + i * 14).toLocaleString()}k</td>
                    <td className="py-1.5 pr-4">{(80 + i * 6).toLocaleString()}k</td>
                    <td className="py-1.5 pr-4">{30 + i}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 font-mono text-[0.62rem] text-muted-foreground">Illustrative rows — demo data.</p>
          </div>
        </PanelFrame>
      );

    case "charts":
      return (
        <PanelFrame title={title} note={note}>
          <Bars n={24} seed={7} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Trend", "Variance", "Forecast"].map((k) => (
              <div key={k} className="rounded-md border border-border px-2 py-2">
                <div className="label-mono">{k}</div>
                <Skeleton className="mt-2 h-8 w-full" />
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "slides":
      return (
        <PanelFrame title={title} note={note}>
          <div className="flex gap-3">
            <div className="hidden w-24 shrink-0 space-y-2 sm:block">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex aspect-video items-center justify-center rounded border font-mono text-[0.6rem]",
                    i === 0 ? "border-border-strong bg-secondary" : "border-border text-muted-foreground",
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex-1 rounded-md border border-border p-5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-2.5 w-full" />
              <Skeleton className="mt-2 h-2.5 w-5/6" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </PanelFrame>
      );

    case "outline":
      return (
        <PanelFrame title={title} note={note}>
          <ol className="space-y-1.5 font-mono text-[0.72rem]">
            {["01 Context", "02 Problem", "03 Approach", "04 Evidence", "05 Outcome", "06 Next steps"].map((s) => (
              <li key={s} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-secondary">
                <ChevronRight className="size-3 text-muted-foreground" />
                {s}
              </li>
            ))}
          </ol>
        </PanelFrame>
      );

    case "inbox":
      return (
        <PanelFrame title={title} note={note}>
          <ul>
            {["Renewal question", "Pricing request", "Technical follow-up", "Intro call", "Invoice query"].map((s, i) => (
              <li key={s}>
                <Row>
                  <span className={cn("size-1.5 rounded-full", i < 2 ? "bg-foreground" : "bg-border-strong")} />
                  <span className="flex-1 truncate">{s}</span>
                  <span className="label-mono">{i + 1}h</span>
                </Row>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[0.62rem] text-muted-foreground">
            Connect an authorized account to populate this list.
          </p>
        </PanelFrame>
      );

    case "leads":
      return (
        <PanelFrame title={title} note={note}>
          <dl className="space-y-2 text-xs">
            {[
              ["Stage", "Qualifying"],
              ["Fit score", "— (needs data)"],
              ["Source", "Unknown"],
              ["Owner", "You"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-1.5 last:border-0">
                <dt className="label-mono">{k}</dt>
                <dd className="font-mono text-[0.72rem]">{v}</dd>
              </div>
            ))}
          </dl>
        </PanelFrame>
      );

    case "history":
      return (
        <PanelFrame title={title} note={note}>
          <ul>
            {["Session 03", "Session 02", "Session 01"].map((s, i) => (
              <li key={s}>
                <Row>
                  <Clock className="size-3 text-muted-foreground" />
                  <span className="flex-1">{s}</span>
                  <span className="label-mono">{i + 1}d</span>
                </Row>
              </li>
            ))}
          </ul>
        </PanelFrame>
      );

    case "sources":
      return (
        <PanelFrame title={title} note={note}>
          <EmptyState
            icon={<Layers className="size-5" />}
            label="No sources retrieved yet"
            hint="Autarch only shows citations for sources it actually retrieved — never invented references."
          />
        </PanelFrame>
      );

    case "clauses":
      return (
        <PanelFrame title={title} note={note}>
          <ul>
            {["Indemnity", "Limitation of liability", "Termination", "Auto-renewal", "Governing law"].map((c) => (
              <li key={c}>
                <Row>
                  <span className="flex-1">{c}</span>
                  <span className="label-mono">p. —</span>
                </Row>
              </li>
            ))}
          </ul>
        </PanelFrame>
      );

    case "findings":
      return (
        <PanelFrame title={title} note={note}>
          <ul className="space-y-2">
            {[
              ["High", "Unbounded liability language"],
              ["Medium", "Auto-renewal without notice window"],
              ["Low", "Ambiguous delivery definition"],
            ].map(([sev, text]) => (
              <li key={text} className="flex gap-2 rounded-md border border-border px-2.5 py-2">
                <AlertTriangle className="mt-0.5 size-3.5 text-muted-foreground" />
                <div>
                  <div className="label-mono">{sev}</div>
                  <p className="text-xs">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[0.62rem] text-muted-foreground">Example findings — demo data.</p>
        </PanelFrame>
      );

    case "notes":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-2.5", i % 3 === 2 ? "w-3/4" : "w-full")} />
            ))}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="font-mono text-[0.7rem]">
                Save to project
              </Button>
              <Button size="sm" variant="ghost" className="font-mono text-[0.7rem]">
                Export
              </Button>
            </div>
          </div>
        </PanelFrame>
      );

    case "flashcards":
      return (
        <PanelFrame title={title} note={note}>
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hover-lift rounded-md border border-border p-3">
                <div className="label-mono">Card {i + 1}</div>
                <Skeleton className="mt-2 h-2.5 w-full" />
                <Skeleton className="mt-1.5 h-2.5 w-2/3" />
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "quiz":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-2">
            <p className="font-mono text-xs">Question 1 of 10</p>
            {["Option A", "Option B", "Option C", "Option D"].map((o) => (
              <label key={o} className="flex cursor-default items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
                <span className="size-3 rounded-full border border-border-strong" />
                {o}
              </label>
            ))}
          </div>
        </PanelFrame>
      );

    case "captions":
      return (
        <PanelFrame title={title} note={note}>
          <ul className="space-y-1.5 font-mono text-[0.7rem]">
            {["00:00 – 00:04", "00:04 – 00:09", "00:09 – 00:14"].map((t) => (
              <li key={t} className="rounded-md border border-border px-2.5 py-2">
                <div className="label-mono">{t}</div>
                <Skeleton className="mt-1.5 h-2.5 w-4/5" />
              </li>
            ))}
          </ul>
        </PanelFrame>
      );

    case "languages":
      return (
        <PanelFrame title={title} note={note} actions={<Languages className="size-3.5 text-muted-foreground" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Source", "Auto-detect"],
              ["Target", "Spanish (ES)"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border px-3 py-2">
                <div className="label-mono">{k}</div>
                <div className="mt-1 font-mono text-xs">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["ES", "FR", "DE", "PT", "JA", "HI", "AR"].map((l) => (
              <span key={l} className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.65rem]">
                {l}
              </span>
            ))}
          </div>
        </PanelFrame>
      );

    case "beforeafter":
      return (
        <PanelFrame title={title} note={note}>
          <div className="grid grid-cols-2 gap-2">
            {["Before", "After"].map((l) => (
              <div key={l}>
                <div className="label-mono mb-1">{l}</div>
                <div className="aspect-[4/3] rounded-md border border-border grid-paper" />
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "suggestions":
      return (
        <PanelFrame title={title} note={note}>
          <ul className="space-y-2">
            {(items ?? ["Suggestion slot 1", "Suggestion slot 2", "Suggestion slot 3"]).map((s) => (
              <li key={s} className="hover-lift flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs">
                <Wand2 className="size-3.5 text-muted-foreground" />
                <span className="flex-1">{s}</span>
                <span className="label-mono">Use</span>
              </li>
            ))}
          </ul>
        </PanelFrame>
      );

    case "calendar":
      return (
        <PanelFrame title={title} note={note} actions={<CalendarDays className="size-3.5 text-muted-foreground" />}>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex aspect-square items-center justify-center rounded border font-mono text-[0.6rem]",
                  [3, 8, 12, 19, 24].includes(i)
                    ? "border-border-strong bg-secondary"
                    : "border-border text-muted-foreground",
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </PanelFrame>
      );

    case "approvals":
      return (
        <PanelFrame title={title} note={note}>
          <div className="space-y-2">
            {["Send message", "Publish post", "Run external action"].map((a) => (
              <div key={a} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs">
                <span className="flex-1">{a}</span>
                <Button size="sm" variant="outline" className="h-7 font-mono text-[0.65rem]">
                  Approve
                </Button>
                <Button size="sm" variant="ghost" className="h-7 font-mono text-[0.65rem]">
                  Reject
                </Button>
              </div>
            ))}
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              Nothing leaves the workspace without an explicit approval.
            </p>
          </div>
        </PanelFrame>
      );

    case "handoff":
      return (
        <PanelFrame title={title} note={note}>
          <div className="rounded-md border border-border px-3 py-3 text-xs">
            <div className="label-mono mb-1.5">Human handoff</div>
            <p className="text-muted-foreground">Hand this conversation to a teammate with full context attached.</p>
            <Button size="sm" variant="outline" className="mt-2 font-mono text-[0.7rem]">
              Assign to teammate
            </Button>
          </div>
        </PanelFrame>
      );

    case "empty":
    default:
      return (
        <PanelFrame title={title} note={note}>
          <EmptyState icon={<Check className="size-5" />} label="Ready" />
        </PanelFrame>
      );
  }
}
