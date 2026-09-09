import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Search, Send, Trash2, Download, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WorkspacePage } from "@/components/workspace/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useFiles,
  useProjects,
  useUploadFiles,
  useRenameFile,
  useDeleteFile,
  downloadFile,
  formatBytes,
  formatDate,
  type ProjectFile,
} from "@/lib/workspace-data";

export const Route = createFileRoute("/app/files")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: FilesPage,
});

function FilesPage() {
  const { data: files = [], isLoading } = useFiles();
  const { data: projects = [] } = useProjects();
  const upload = useUploadFiles();
  const rename = useRenameFile();
  const remove = useDeleteFile();

  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () => files.filter((f) => f.file_name.toLowerCase().includes(query.trim().toLowerCase())),
    [files, query],
  );

  const totalBytes = files.reduce((sum, f) => sum + Number(f.file_size ?? 0), 0);

  function pick(list: FileList | null) {
    if (!list || list.length === 0) return;
    upload.mutate(
      { files: Array.from(list), projectId },
      {
        onSuccess: () => toast.success("Upload complete"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Upload failed"),
      },
    );
  }

  function projectName(file: ProjectFile) {
    return projects.find((p) => p.id === file.project_id)?.name ?? "Unfiled";
  }

  return (
    <WorkspacePage
      title="Files"
      lead="Private workspace storage. Any file can be sent straight into a module as input."
      actions={<span className="label-mono">{formatBytes(totalBytes)} used</span>}
    >
      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="panel h-fit p-3">
          <span className="label-mono">Upload into</span>
          <ul className="mt-3 space-y-1 text-[0.7rem]">
            <li>
              <button
                onClick={() => setProjectId(null)}
                className={`block w-full truncate rounded px-1.5 py-1 text-left hover:bg-secondary ${
                  projectId === null ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                Unfiled
              </button>
            </li>
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setProjectId(p.id)}
                  className={`block w-full truncate rounded px-1.5 py-1 text-left hover:bg-secondary ${
                    projectId === p.id ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p.name}/
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files);
            }}
            className="panel flex w-full flex-col items-center justify-center gap-2 border-dashed px-4 py-10 text-center hover:bg-secondary/40"
          >
            {upload.isPending ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
            <span className="text-xs">
              {upload.isPending ? "Uploading…" : "Drag and drop files, or click to upload"}
            </span>
            <span className="max-w-sm text-[0.7rem] text-muted-foreground">
              Stored privately in your account, up to 25 MB per file, served through expiring links.
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              pick(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="panel">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files…"
                className="h-7 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>

            {isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading…</p>
            ) : visible.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {files.length === 0 ? "No files yet — upload your first one above." : "No files match that search."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-xs">{f.file_name}</span>
                    <span className="label-mono">{projectName(f)}</span>
                    <span className="label-mono">{formatBytes(Number(f.file_size ?? 0))}</span>
                    <span className="label-mono hidden sm:inline">{formatDate(f.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <Button asChild size="icon" variant="ghost" className="size-7" title="Send to AI module">
                        <Link to="/app/modules/$slug" params={{ slug: "document-intelligence" }} search={{ q: f.file_name }}>
                          <Send className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Rename"
                        onClick={() => {
                          const name = window.prompt("New file name", f.file_name);
                          if (name && name.trim()) rename.mutate({ id: f.id, name: name.trim() });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Download"
                        onClick={() =>
                          void downloadFile(f).catch(() => toast.error("Could not create a download link."))
                        }
                      >
                        <Download className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete ${f.file_name}?`)) remove.mutate(f);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}
