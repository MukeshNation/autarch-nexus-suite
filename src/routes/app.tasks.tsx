import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { DEMO_TASKS } from "@/lib/demo-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/tasks")({
  component: TasksPage,
});

const COLUMNS = ["Backlog", "Todo", "In Progress", "Done"] as const;

function TasksPage() {
  return (
    <WorkspacePage title="Tasks" lead="Kanban and list views over every project task." actions={<DemoDataBadge />}>
      <Tabs defaultValue="board">
        <TabsList className="font-mono text-xs">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="pt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <section key={col} className="panel p-3">
                <div className="flex items-center gap-2">
                  <span className="label-mono">{col}</span>
                  <span className="label-mono ml-auto">{DEMO_TASKS.filter((t) => t.status === col).length}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {DEMO_TASKS.filter((t) => t.status === col).map((t) => (
                    <li key={t.id} className="hover-lift rounded-md border border-border px-3 py-2">
                      <span className="block text-xs">{t.title}</span>
                      <span className="label-mono mt-1 block">
                        {t.id} · {t.project} · {t.assignee}
                      </span>
                    </li>
                  ))}
                  {DEMO_TASKS.filter((t) => t.status === col).length === 0 && (
                    <li className="rounded-md border border-dashed border-border px-3 py-6 text-center font-mono text-[0.65rem] text-muted-foreground">
                      Empty
                    </li>
                  )}
                </ul>
              </section>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <div className="panel overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  {["ID", "Task", "Project", "Status", "Owner"].map((h) => (
                    <th key={h} className="label-mono px-3 py-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_TASKS.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-[0.68rem] text-muted-foreground">{t.id}</td>
                    <td className="px-3 py-2">{t.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.project}</td>
                    <td className="px-3 py-2 font-mono text-[0.68rem]">{t.status}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.assignee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}
