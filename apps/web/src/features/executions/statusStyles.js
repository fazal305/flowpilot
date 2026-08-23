import { CheckCircle2, XCircle, Loader2, Clock, MinusCircle } from "lucide-react";

export const NODE_STATUS_STYLES = {
  PENDING: { icon: Clock, text: "text-status-pending", label: "Pending" },
  RUNNING: { icon: Loader2, text: "text-status-running", label: "Running", spin: true },
  SUCCESS: { icon: CheckCircle2, text: "text-status-success", label: "Success" },
  FAILED: { icon: XCircle, text: "text-status-error", label: "Failed" },
  SKIPPED: { icon: MinusCircle, text: "text-status-skipped", label: "Skipped" },
};

export const EXECUTION_STATUS_STYLES = {
  PENDING: { text: "text-status-pending", bg: "bg-status-pending/15", label: "Pending" },
  RUNNING: { text: "text-status-running", bg: "bg-status-running/15", label: "Running" },
  SUCCESS: { text: "text-status-success", bg: "bg-status-success/15", label: "Success" },
  FAILED: { text: "text-status-error", bg: "bg-status-error/15", label: "Failed" },
};

export function formatDuration(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function shortId(id) {
  return id ? id.slice(0, 8).toUpperCase() : "";
}
