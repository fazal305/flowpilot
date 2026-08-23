import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Workflow, Plus, Search, Copy, Trash2, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import {
  useWorkflowsList,
  useDeleteWorkflow,
  useDuplicateWorkflow,
} from "@/features/workflows/api/workflowDrafts";
import { useAiDialogStore } from "@/stores/aiDialogStore";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";

const STATUS_STYLES = {
  draft: "bg-surface-muted text-foreground-muted",
  active: "bg-status-success/15 text-status-success",
  inactive: "bg-status-pending/15 text-status-pending",
};

function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function WorkflowsPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: workflows = [], isLoading } = useWorkflowsList();
  const deleteWorkflow = useDeleteWorkflow();
  const duplicateWorkflow = useDuplicateWorkflow();
  const setAiDialogOpen = useAiDialogStore((s) => s.setOpen);
  const showLoading = useDelayedFlag(isLoading);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workflows;
    return workflows.filter((w) => w.name.toLowerCase().includes(query));
  }, [workflows, search]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div>
          <h1 className="text-lg font-semibold">Workflows</h1>
          <p className="text-sm text-foreground-muted">
            Trigger → condition → action graphs you've built. Saved to this browser.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAiDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate with AI
          </button>
          <Link
            to="/workflows/new"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New workflow
          </Link>
        </div>
      </div>

      {!isLoading && workflows.length > 0 && (
        <div className="border-b border-border px-6 py-3">
          <label className="flex max-w-xs items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground-muted">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows…"
              aria-label="Search workflows"
              className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground-muted"
            />
          </label>
        </div>
      )}

      {isLoading ? (
        showLoading && <div className="px-6 py-6 text-sm text-foreground-muted">Loading workflows…</div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No saved workflows yet"
          description="Build one in the editor — it autosaves to this browser as you work."
          action={
            <Link
              to="/workflows/new"
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Open the editor
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-foreground-muted">
          No workflows match "{search}".
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-y-auto">
          {filtered.map((workflow) => (
            <li
              key={workflow.id}
              className="group flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-surface-muted"
              onClick={() => navigate(`/workflows/${workflow.id}`)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
                <Workflow className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{workflow.name}</p>
                <p className="truncate text-xs text-foreground-muted">
                  {workflow.graph.nodes.length} node{workflow.graph.nodes.length === 1 ? "" : "s"} · updated {formatRelativeTime(workflow.updatedAt)}
                </p>
              </div>
              <span className={["rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", STATUS_STYLES[workflow.status]].join(" ")}>
                {workflow.status}
              </span>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateWorkflow.mutate(workflow);
                  }}
                  aria-label={`Duplicate ${workflow.name}`}
                  title="Duplicate"
                  className="rounded-md p-1.5 text-foreground-muted hover:bg-surface hover:text-foreground"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${workflow.name}"? This can't be undone.`)) {
                      deleteWorkflow.mutate(workflow.id);
                    }
                  }}
                  aria-label={`Delete ${workflow.name}`}
                  title="Delete"
                  className="rounded-md p-1.5 text-foreground-muted hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
