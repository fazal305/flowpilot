import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as connectEdge,
} from "@xyflow/react";
import { defaultConfigForType } from "@flowpilot/shared";
import { defaultLabelForType } from "../nodeDefinitions";

const MAX_HISTORY = 50;

let counter = 0;
function generateId(prefix) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

function cloneGraph(nodes, edges) {
  return { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
}

export const useEditorStore = create((set, get) => ({
  workflowName: "Untitled workflow",
  nodes: [],
  edges: [],
  selectedNodeId: null,
  past: [],
  future: [],
  dirty: false,
  saveState: "saved", // "saved" | "saving" | "unsaved"
  lastSavedAt: null,

  loadGraph: ({ name, nodes, edges }) =>
    set({
      workflowName: name ?? "Untitled workflow",
      nodes: nodes ?? [],
      edges: edges ?? [],
      selectedNodeId: null,
      past: [],
      future: [],
      dirty: false,
      saveState: "saved",
    }),

  setWorkflowName: (name) => set({ workflowName: name, dirty: true, saveState: "unsaved" }),

  commitHistory: () => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, cloneGraph(nodes, edges)].slice(-MAX_HISTORY),
      future: [],
    });
  },

  onNodesChange: (changes) => {
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) get().commitHistory();
    set((s) => {
      const removedIds = changes
        .filter((c) => c.type === "remove")
        .map((c) => c.id);
      return {
        nodes: applyNodeChanges(changes, s.nodes),
        selectedNodeId: removedIds.includes(s.selectedNodeId)
          ? null
          : s.selectedNodeId,
        dirty: true,
        saveState: "unsaved",
      };
    });
  },

  onEdgesChange: (changes) => {
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) get().commitHistory();
    set((s) => ({
      edges: applyEdgeChanges(changes, s.edges),
      dirty: true,
      saveState: "unsaved",
    }));
  },

  onNodeDragStart: () => get().commitHistory(),

  onConnect: (connection) => {
    if (connection.source === connection.target) return;
    get().commitHistory();
    set((s) => ({
      edges: connectEdge({ ...connection, id: generateId("edge") }, s.edges),
      dirty: true,
      saveState: "unsaved",
    }));
  },

  addNode: (type, position) => {
    get().commitHistory();
    const id = generateId(type);
    const node = {
      id,
      type: "workflowNode",
      position,
      data: {
        nodeType: type,
        label: defaultLabelForType(type),
        config: defaultConfigForType(type),
        status: "idle",
      },
    };
    set((s) => ({
      nodes: [...s.nodes, node],
      selectedNodeId: id,
      dirty: true,
      saveState: "unsaved",
    }));
    return id;
  },

  duplicateNode: (id) => {
    const source = get().nodes.find((n) => n.id === id);
    if (!source) return;
    get().commitHistory();
    const newId = generateId(source.data.nodeType);
    const clone = {
      ...source,
      id: newId,
      position: { x: source.position.x + 32, y: source.position.y + 32 },
      data: { ...source.data, label: `${source.data.label} copy` },
      selected: false,
    };
    set((s) => ({
      nodes: [...s.nodes, clone],
      selectedNodeId: newId,
      dirty: true,
      saveState: "unsaved",
    }));
  },

  deleteNode: (id) => {
    get().commitHistory();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      dirty: true,
      saveState: "unsaved",
    }));
  },

  deleteSelected: () => {
    const { selectedNodeId } = get();
    if (selectedNodeId) get().deleteNode(selectedNodeId);
  },

  updateNodeConfig: (id, patch) => {
    get().commitHistory();
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } }
          : n
      ),
      dirty: true,
      saveState: "unsaved",
    }));
  },

  updateNodeLabel: (id, label) => {
    get().commitHistory();
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
      dirty: true,
      saveState: "unsaved",
    }));
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: past.slice(0, -1),
      future: [cloneGraph(nodes, edges), ...future],
      dirty: true,
      saveState: "unsaved",
    });
  },

  redo: () => {
    const { future, nodes, edges, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(1),
      past: [...past, cloneGraph(nodes, edges)],
      dirty: true,
      saveState: "unsaved",
    });
  },

  beginSaving: () => set({ saveState: "saving" }),
  markSaved: () =>
    set({ dirty: false, saveState: "saved", lastSavedAt: new Date().toISOString() }),
}));
