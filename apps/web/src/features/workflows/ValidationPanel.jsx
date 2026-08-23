import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useEditorStore } from "./store/editorStore";

export function ValidationPanel({ issues, onClose }) {
  const setSelectedNode = useEditorStore((s) => s.setSelectedNode);

  return (
    <div className="absolute right-3 top-full z-10 mt-1 w-96 rounded-lg border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">Validation</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close validation panel"
          className="rounded p-1 text-foreground-muted hover:bg-surface-muted"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-status-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          No issues found. This workflow is ready to run.
        </div>
      ) : (
        <ul className="max-h-72 overflow-y-auto py-1">
          {issues.map((issue, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => issue.nodeId && setSelectedNode(issue.nodeId)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                {issue.level === "error" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-node-logic" aria-hidden="true" />
                )}
                <span>{issue.message}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
