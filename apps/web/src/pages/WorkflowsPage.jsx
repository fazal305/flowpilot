import { Link } from "react-router-dom";
import { Workflow, Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export function WorkflowsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div>
          <h1 className="text-lg font-semibold">Workflows</h1>
          <p className="text-sm text-foreground-muted">
            Trigger → condition → action graphs you've built.
          </p>
        </div>
        <Link
          to="/workflows/new"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New workflow
        </Link>
      </div>
      <EmptyState
        icon={Workflow}
        title="No saved workflows yet"
        description="Workflows you build in the editor will be saved and listed here once persistence lands in Phase 3."
        action={
          <Link
            to="/workflows/new"
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            Open the editor
          </Link>
        }
      />
    </div>
  );
}
