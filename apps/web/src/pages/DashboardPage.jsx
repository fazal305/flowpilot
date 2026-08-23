import { Link } from "react-router-dom";
import { Workflow, Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export function DashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-foreground-muted">
          What your workflows are doing right now.
        </p>
      </div>
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
    </div>
  );
}
