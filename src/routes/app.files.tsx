import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Search, Send, Trash2, Download, Pencil } from "lucide-react";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { DEMO_FILES, DEMO_PROJECTS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/files")({
  component: FilesPage,
});

function FilesPage() {
  return (
    <WorkspacePage
      title="Files"
      lead="Secure workspace storage. Any file can be sent straight into a module as input."
      actions={<DemoDataBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="panel h-fit p-3">
          <span className="label-mono">File tree</span>
          <ul className="mt-3 space-y-1 font-mono text-[0.7rem]">
            {DEMO_PROJECTS.map((p) => (
              <li key={p.id}>
                <span className="block rounded px-1.5 py-1 hover:bg-secondary">{p.name}/</span>
                <ul className="ml-3 border-l border-border pl-2 text-muted-foreground">
                  {DEMO_FILES.filter((f) => f.project === p.name).map((f) => (
                    <li key={f.name} className="truncate rounded px-1.5 py-1 hover:bg-secondary">
                      {f.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          <div className="panel flex flex-col items-center justify-center gap-2 border-dashed px-4 py-10 text-center">
            <Upload className="size-5 text-muted-foreground" />
            <span className="font-mono text-xs">Drag and drop files, or click to upload</span>
            <span className="max-w-sm text-[0.7rem] text-muted-foreground">
              Uploads are validated by type and size, stored privately, and served through expiring access once storage
              is connected.
            </span>
          </div>

          <div className="panel">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="size-3.5 text-muted-foreground" />
              <Input placeholder="Search files…" className="h-7 border-0 px-0 font-mono text-xs shadow-none focus-visible:ring-0" />
            </div>
            <ul className="divide-y divide-border">
              {DEMO_FILES.map((f) => (
                <li key={f.name} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-xs">{f.name}</span>
                  <span className="label-mono">{f.kind}</span>
                  <span className="label-mono">{f.size}</span>
                  <span className="label-mono hidden sm:inline">{f.updated}</span>
                  <div className="flex items-center gap-1">
                    <Button asChild size="icon" variant="ghost" className="size-7" title="Send to AI module">
                      <Link to="/app/modules">
                        <Send className="size-3.5" />
                      </Link>
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" title="Rename">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" title="Download">
                      <Download className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" title="Delete">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}
