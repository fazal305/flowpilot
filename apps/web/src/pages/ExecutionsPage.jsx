import { Link } from "react-router-dom";
import { PlayCircle, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useRecentExecutions } from "@/features/executions/api/executions";
import { EXECUTION_STATUS_STYLES, formatDuration, shortId } from "@/features/executions/statusStyles";

export function ExecutionsPage() {
  const { data: executions = [], isLoading, isError, error } = useRecentExecutions();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Executions</h1>
        <p className="text-sm text-foreground-muted">
          Run history, node-by-node timing, and failures.
        </p>
      </div>

      {isLoading ? (
        <div className="px-6 py-6 text-sm text-foreground-muted">Loading executions…</div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          <p className="text-sm text-destructive">Couldn't reach the FlowPilot API.</p>
          <p className="max-w-sm text-xs text-foreground-muted">{error?.message}</p>
        </div>
      ) : executions.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No executions yet"
          description="Run a workflow from the editor to see per-node status, duration, and input/output here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-y-auto">
          {executions.map((execution) => {
            const style = EXECUTION_STATUS_STYLES[execution.status] ?? EXECUTION_STATUS_STYLES.PENDING;
            return (
              <li key={execution.id}>
                <Link
                  to={`/executions/${execution.id}`}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-surface-muted"
                >
                  <span className="font-mono-token text-xs text-foreground-muted">#{shortId(execution.id)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{execution.workflow?.name ?? "Unknown workflow"}</span>
                  <span className="text-xs text-foreground-muted">{execution.triggeredBy}</span>
                  <span className={["rounded-full px-2 py-0.5 text-[11px] font-medium", style.bg, style.text].join(" ")}>
                    {style.label}
                  </span>
                  <span className="w-16 shrink-0 text-right font-mono-token text-xs text-foreground-muted">
                    {formatDuration(execution.durationMs)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
