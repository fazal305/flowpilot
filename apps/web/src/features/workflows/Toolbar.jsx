import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Play,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CloudOff,
} from "lucide-react";
import { validateGraph, WORKFLOW_STATUSES } from "@flowpilot/shared";
import { useEditorStore } from "./store/editorStore";
import { toSharedGraph } from "./graphAdapter";
import { ValidationPanel } from "./ValidationPanel";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { usePublishWorkflow } from "./api/workflowDrafts";
import { useTriggerExecution } from "@/features/executions/api/executions";

const SAVE_LABEL = {
  saved: "Saved locally",
  saving: "Saving…",
  unsaved: "Unsaved changes",
};

export function Toolbar() {
  const [showIssues, setShowIssues] = useState(false);
  const [runError, setRunError] = useState(null);
  const navigate = useNavigate();
  const workflowId = useEditorStore((s) => s.workflowId);
  const workflowName = useEditorStore((s) => s.workflowName);
  const setWorkflowName = useEditorStore((s) => s.setWorkflowName);
  const workflowDescription = useEditorStore((s) => s.workflowDescription);
  const workflowStatus = useEditorStore((s) => s.workflowStatus);
  const setWorkflowStatus = useEditorStore((s) => s.setWorkflowStatus);
  const syncStatus = useEditorStore((s) => s.syncStatus);
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const saveState = useEditorStore((s) => s.saveState);

  const publishWorkflow = usePublishWorkflow();
  const triggerExecution = useTriggerExecution();
  const isRunning = publishWorkflow.isPending || triggerExecution.isPending;

  const graph = useMemo(() => toSharedGraph(nodes, edges), [nodes, edges]);
  const issues = useMemo(() => validateGraph(graph), [graph]);
  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;

  async function handleRun() {
    setRunError(null);
    try {
      await publishWorkflow.mutateAsync({
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
        status: workflowStatus,
        graph,
      });
      const executionId = await triggerExecution.mutateAsync({ workflowId, triggeredBy: "manual" });
      navigate(`/executions/${executionId}`);
    } catch (error) {
      setRunError(error.message ?? "Couldn't start this run.");
    }
  }

  return (
    <div className="relative flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
      <Link
        to="/workflows"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Workflows
      </Link>

      <div className="h-5 w-px bg-border" />

      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        aria-label="Workflow name"
        className="rounded-md bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus-visible:bg-surface-muted"
      />

      <select
        value={workflowStatus}
        onChange={(e) => setWorkflowStatus(e.target.value)}
        aria-label="Workflow status"
        className="rounded-md border border-border bg-surface-muted px-2 py-1 text-xs capitalize text-foreground-muted outline-none focus-visible:border-accent"
      >
        {WORKFLOW_STATUSES.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      <div className="ml-2 flex items-center gap-1">
        <button
          type="button"
          onClick={undo}
          disabled={past.length === 0}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={future.length === 0}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
          className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {runError && (
          <span className="max-w-xs truncate text-xs text-destructive" title={runError} role="alert">
            {runError}
          </span>
        )}

        <OfflineIndicator />

        <span
          title="Server sync happens when you Save or Run — see the README for current backend status."
          className="flex items-center gap-1.5 text-xs text-foreground-muted"
        >
          <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
          {syncStatus === "local-only" ? "Local only" : syncStatus}
        </span>

        <div className="flex items-center gap-1.5 text-xs text-foreground-muted" role="status">
          {saveState === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {SAVE_LABEL[saveState]}
        </div>

        <button
          type="button"
          onClick={() => setShowIssues((v) => !v)}
          className={[
            "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            errorCount > 0
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : warningCount > 0
                ? "border-node-logic/30 bg-node-logic/10 text-node-logic"
                : "border-border text-foreground-muted hover:bg-surface-muted",
          ].join(" ")}
          aria-expanded={showIssues}
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {issues.length === 0 ? "Valid" : `${issues.length} issue${issues.length > 1 ? "s" : ""}`}
        </button>

        <button
          type="button"
          onClick={handleRun}
          disabled={errorCount > 0 || !workflowId || isRunning}
          title={
            errorCount > 0
              ? "Fix validation errors before running"
              : !workflowId
                ? "Add a node first"
                : "Run this workflow now"
          }
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Run
        </button>
      </div>

      {showIssues && (
        <ValidationPanel issues={issues} onClose={() => setShowIssues(false)} />
      )}
    </div>
  );
}
