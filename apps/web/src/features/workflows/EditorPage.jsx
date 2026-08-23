import { useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useEditorStore } from "./store/editorStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { EditorCanvas } from "./EditorCanvas";
import { NodePalette } from "./NodePalette";
import { Inspector } from "./Inspector";
import { Toolbar } from "./Toolbar";

const AUTOSAVE_DELAY_MS = 800;

/**
 * Autosave currently persists nothing beyond this browser tab's memory — it
 * exists to prove the debounce/status-indicator flow. Real persistence
 * (IndexedDB draft + server sync) lands in Phase 3.
 */
function useAutosave() {
  const dirty = useEditorStore((s) => s.dirty);
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const beginSaving = useEditorStore((s) => s.beginSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!dirty) return undefined;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      beginSaving();
      setTimeout(markSaved, 250);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, nodes, edges]);
}

function EditorShortcuts() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const deleteSelected = useEditorStore((s) => s.deleteSelected);
  const beginSaving = useEditorStore((s) => s.beginSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const setSelectedNode = useEditorStore((s) => s.setSelectedNode);

  useHotkeys({
    "mod+z": undo,
    "mod+shift+z": redo,
    "mod+y": redo,
    "mod+s": () => {
      beginSaving();
      setTimeout(markSaved, 250);
    },
    delete: deleteSelected,
    backspace: deleteSelected,
    escape: () => setSelectedNode(null),
  });

  return null;
}

export function EditorPage() {
  const loadGraph = useEditorStore((s) => s.loadGraph);
  useAutosave();

  useEffect(() => {
    // Fresh in-memory workflow. Loading a saved one by id arrives with
    // persistence in Phase 3/4.
    loadGraph({ name: "Untitled workflow", nodes: [], edges: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <Toolbar />
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
