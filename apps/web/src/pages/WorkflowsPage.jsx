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
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New workflow
        </button>
      </div>
      <EmptyState
        icon={Workflow}
        title="No workflows yet"
        description="The visual editor arrives in the next build phase. This list will show your saved workflows, their status, and last run."
      />
    </div>
  );
}
