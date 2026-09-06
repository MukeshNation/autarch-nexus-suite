import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Play, Copy } from "lucide-react";
import { toast } from "sonner";
import { runModule, type RunModuleResult } from "@/lib/ai.functions";
import { PanelFrame } from "@/components/workspace/panels";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ModuleRunner({
  slug,
  moduleId,
  initialPrompt,
}: {
  slug: string;
  moduleId: string;
  initialPrompt?: string | undefined;
}) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [result, setResult] = useState<RunModuleResult | null>(null);
  const run = useServerFn(runModule);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (value: string) => run({ data: { slug, moduleId, prompt: value } }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "The request failed."),
  });

  return (
    <PanelFrame title="Run" note="Live · uses 1 credit per run">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the task…"
        className="min-h-24 font-mono text-xs"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5 font-mono text-xs"
          disabled={mutation.isPending || prompt.trim().length === 0}
          onClick={() => mutation.mutate(prompt.trim())}
        >
          {mutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          {mutation.isPending ? "Running…" : "Run"}
        </Button>
        {result && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 font-mono text-xs"
              onClick={() => {
                void navigator.clipboard.writeText(result.text);
                toast.success("Copied");
              }}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
            <span className="label-mono">
              {result.model} · {(result.latencyMs / 1000).toFixed(1)}s · {result.balance} credits left
            </span>
          </>
        )}
      </div>

      {result && (
        <div className="mt-3 max-h-96 overflow-auto rounded-md border border-border bg-secondary/40 p-3">
          <p className="whitespace-pre-wrap text-xs leading-relaxed">{result.text}</p>
        </div>
      )}
    </PanelFrame>
  );
}
