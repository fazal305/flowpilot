import { Link } from "react-router-dom";
import { Workflow, Plus, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useWorkflowsList } from "@/features/workflows/api/workflowDrafts";
import { useLastOpenedWorkflowId } from "@/features/workflows/api/preferences";

const STATUS_STYLES = {
  draft: "bg-surface-muted text-foreground-muted",
  active: "bg-status-success/15 text-status-success",
  inactive: "bg-status-pending/15 text-status-pending",
};

export function DashboardPage() {
  const { data: workflows = [], isLoading } = useWorkflowsList();
  const { data: lastOpenedId } = useLastOpenedWorkflowId();
  const recent = workflows.slice(0, 5);
  const lastOpened = workflows.find((w) => w.id === lastOpenedId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-foreground-muted">
          What your workflows are doing right now.
        </p>
      </div>

      {isLoading ? (
        <div className="px-6 py-6 text-sm text-foreground-muted">Loading…</div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No workflows yet"
          description="Create your first workflow to see live activity, run status, and execution history here."
          action={
            <Link
              to="/workflows/new"
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New workflow
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 p-6">
          {lastOpened && (
            <Link
              to={`/workflows/${lastOpened.id}`}
              className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 hover:opacity-90"
            >
              <Workflow className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="text-sm">
                Continue editing <span className="font-medium">{lastOpened.name}</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            </Link>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recently edited</h2>
            <Link to="/workflows" className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {recent.map((workflow) => (
              <li key={workflow.id}>
                <Link
                  to={`/workflows/${workflow.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
                >
                  <Workflow className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm">{workflow.name}</span>
                  <span className={["rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", STATUS_STYLES[workflow.status]].join(" ")}>
                    {workflow.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-foreground-muted">
            Execution activity will appear here once the run engine ships in Phase 4.
          </p>
        </div>
      )}
    </div>
  );
}
