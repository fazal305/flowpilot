import { PlayCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export function ExecutionsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Executions</h1>
        <p className="text-sm text-foreground-muted">
          Run history, node-by-node timing, and failures.
        </p>
      </div>
      <EmptyState
        icon={PlayCircle}
        title="No executions yet"
        description="Once workflows can run (Phase 4), each run will appear here with per-node status, duration, and input/output."
      />
    </div>
  );
}
