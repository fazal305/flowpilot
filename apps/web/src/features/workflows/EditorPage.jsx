import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { useEditorStore } from "./store/editorStore";
import { useWorkflow, WORKFLOWS_QUERY_KEY } from "./api/workflowDrafts";
import { LAST_OPENED_QUERY_KEY, LAST_OPENED_WORKFLOW_KEY } from "./api/preferences";
import { toReactFlowGraph } from "./graphAdapter";
import { putWorkflow, setPreference } from "@/lib/db";
import { useHotkeys } from "@/hooks/useHotkeys";
import { EditorCanvas } from "./EditorCanvas";
import { NodePalette } from "./NodePalette";
import { Inspector } from "./Inspector";
import { Toolbar } from "./Toolbar";

const AUTOSAVE_DELAY_MS = 800;

/** Debounced write-through to IndexedDB — this IS the real local-first save,
 * not a stub. Server sync (pushing this record to the API) arrives in Phase 4;
 * until then every draft's syncStatus stays "local-only", which is honest
 * about what's actually happening. */
function useAutosave() {
  const queryClient = useQueryClient();
  const timerRef = useRef(null);
  const isSavingRef = useRef(false);
  const rerunRequestedRef = useRef(false);
  const navigate = useNavigate();

  const dirty = useEditorStore((s) => s.dirty);
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const workflowName = useEditorStore((s) => s.workflowName);
  const workflowDescription = useEditorStore((s) => s.workflowDescription);
  const workflowStatus = useEditorStore((s) => s.workflowStatus);
  const saveRequestId = useEditorStore((s) => s.saveRequestId);

  // A stable function (never recreated) that always reads LIVE store state via
  // getState() rather than closing over render-time values, and serializes
  // overlapping calls instead of letting two in-flight saves each decide
  // independently that there's "no id yet" and mint two different UUIDs for
  // what should be the same draft.
  const performSaveRef = useRef(async function run() {
    if (isSavingRef.current) {
      rerunRequestedRef.current = true;
      return;
    }
    isSavingRef.current = true;
    const store = useEditorStore.getState();
    store.beginSaving();
    try {
      const now = new Date().toISOString();
      const id = store.workflowId ?? crypto.randomUUID();
      const record = {
        id,
        name: store.workflowName,
        description: store.workflowDescription,
        status: store.workflowStatus,
        graph: { nodes: store.nodes, edges: store.edges },
        syncStatus: "local-only",
        generatedByAi: store.generatedByAi,
        createdAt: store.createdAt ?? now,
        updatedAt: now,
      };
      await putWorkflow(record);
      await setPreference(LAST_OPENED_WORKFLOW_KEY, id);
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LAST_OPENED_QUERY_KEY });
      if (!store.workflowId) {
        useEditorStore.getState().setWorkflowId(id);
        navigate(`/workflows/${id}`, { replace: true });
      }
      useEditorStore.getState().markSaved();
    } finally {
      isSavingRef.current = false;
      if (rerunRequestedRef.current) {
        rerunRequestedRef.current = false;
        performSaveRef.current();
      }
    }
  });

  useEffect(() => {
    if (!dirty) return undefined;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSaveRef.current(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [dirty, nodes, edges, workflowName, workflowDescription, workflowStatus]);

  // Ctrl/Cmd+S and the command palette's "Save workflow" bump saveRequestId —
  // handle it here (bypassing the debounce) instead of duplicating the write.
  // Compares against the last-SEEN value (not a boolean "have I run yet"
  // flag) specifically because React StrictMode double-invokes effects on
  // mount: a boolean flag flips to false on the first (synthetic) run, so
  // the immediate second run would incorrectly slip past an "is this the
  // first render" guard and fire a save with not-yet-loaded state.
  const lastSaveRequestRef = useRef(saveRequestId);
  useEffect(() => {
    if (saveRequestId === lastSaveRequestRef.current) return;
    lastSaveRequestRef.current = saveRequestId;
    clearTimeout(timerRef.current);
    performSaveRef.current();
  }, [saveRequestId]);
}

/** Reads straight from the store (not local component state) because the
 * editor remounts per workflow id right after an AI draft's first autosave
 * assigns it a real id — local state would reset on that remount and the
 * banner would vanish before the user even saw it. */
function AiGeneratedBanner() {
  const generatedByAi = useEditorStore((s) => s.generatedByAi);
  const dismissAiBanner = useEditorStore((s) => s.dismissAiBanner);

  if (!generatedByAi) return null;

  return (
    <div className="flex items-center gap-2 border-b border-accent/30 bg-accent-soft px-4 py-2 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span>AI-generated draft — review and edit before running it.</span>
      <button
        type="button"
        onClick={dismissAiBanner}
        aria-label="Dismiss"
        className="ml-auto rounded p-1 text-foreground-muted hover:bg-surface-muted"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function EditorShortcuts() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const setSelectedNode = useEditorStore((s) => s.setSelectedNode);
  const requestImmediateSave = useEditorStore((s) => s.requestImmediateSave);

  useHotkeys({
    "mod+z": undo,
    "mod+shift+z": redo,
    "mod+y": redo,
    "mod+s": requestImmediateSave,
    delete: deleteSelected,
    backspace: deleteSelected,
    escape: () => setSelectedNode(null),
  });

  return null;
}

/**
 * Does the actual work, keyed by workflow id in the wrapper below. React
 * Router reuses the same component instance when only a route *param*
 * changes (e.g. navigating from one saved workflow straight to another),
 * so without the key, this component's refs/timers — including the
 * autosave debounce timer — would carry over between two different
 * workflows and could fire mid-transition with a stale id. The key forces
 * a full unmount/remount per workflow, which runs the debounce effect's
 * cleanup and guarantees clean state.
 */
function EditorPageInner({ routeId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadGraph = useEditorStore((s) => s.loadGraph);
  const isNew = !routeId || routeId === "new";
  const { data: existingWorkflow, isLoading, isError } = useWorkflow(routeId);
  const generated = isNew ? location.state?.generated : null;

  useAutosave();

  useEffect(() => {
    if (!isNew) return;
    if (generated) {
      const { nodes, edges } = toReactFlowGraph(generated.graph);
      loadGraph({ name: generated.name, description: generated.description, generatedByAi: true, nodes, edges });
      // Loaded content counts as an edit the user hasn't explicitly saved
      // yet, so autosave persists it locally like any other draft — but
      // nothing runs until Run is pressed, same as a hand-built workflow.
      useEditorStore.setState({ dirty: true, saveState: "unsaved" });
    } else {
      loadGraph({ name: "Untitled workflow", nodes: [], edges: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    if (!isNew && existingWorkflow) {
      loadGraph({
        id: existingWorkflow.id,
        name: existingWorkflow.name,
        description: existingWorkflow.description,
        status: existingWorkflow.status,
        syncStatus: existingWorkflow.syncStatus,
        createdAt: existingWorkflow.createdAt,
        generatedByAi: existingWorkflow.generatedByAi ?? false,
        nodes: existingWorkflow.graph.nodes,
        edges: existingWorkflow.graph.edges,
      });
      setPreference(LAST_OPENED_WORKFLOW_KEY, existingWorkflow.id).then(() =>
        queryClient.invalidateQueries({ queryKey: LAST_OPENED_QUERY_KEY })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingWorkflow, isNew]);

  useEffect(() => {
    if (!isNew && !isLoading && !existingWorkflow) {
      // Draft doesn't exist locally (bad link, cleared storage, different device
      // before Phase 4 sync exists) — send back to the list rather than showing
      // a dead editor.
      navigate("/workflows", { replace: true });
    }
  }, [isNew, isLoading, existingWorkflow, navigate]);

  if (!isNew && isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-foreground-muted">
        Loading workflow…
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-destructive">
        Couldn't load this workflow from local storage.
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <Toolbar />
        <AiGeneratedBanner />
        <div className="flex min-h-0 flex-1">
          <NodePalette />
          <div className="min-w-0 flex-1">
            <EditorCanvas />
          </div>
          <Inspector />
        </div>
      </div>
      <EditorShortcuts />
    </ReactFlowProvider>
  );
}

export function EditorPage() {
  const { workflowId: routeId } = useParams();
  return <EditorPageInner key={routeId ?? "new"} routeId={routeId} />;
}
