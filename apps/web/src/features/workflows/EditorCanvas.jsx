import { useCallback } from "react";
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEditorStore } from "./store/editorStore";
import { WorkflowNode } from "./nodes/WorkflowNode";

const nodeTypes = { workflowNode: WorkflowNode };
const DRAG_DATA_KEY = "application/flowpilot-node-type";

export function EditorCanvas() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange);
  const onConnect = useEditorStore((s) => s.onConnect);
  const onNodeDragStart = useEditorStore((s) => s.onNodeDragStart);
  const setSelectedNode = useEditorStore((s) => s.setSelectedNode);
  const addNode = useEditorStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(DRAG_DATA_KEY);
      if (!type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(type, position);
    },
    [addNode, screenToFlowPosition]
  );

  return (
    <div
      className="h-full w-full"
      style={{ width: "100%", height: "100%" }}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      <ReactFlow
        style={{ width: "100%", height: "100%" }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        minZoom={0.15}
        maxZoom={2}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} className="!bg-background" color="var(--color-border)" />
        <Controls showInteractive={false} className="!border !border-border !bg-surface !shadow-md [&_button]:!border-border [&_button]:!bg-surface [&_button]:!text-foreground [&_button:hover]:!bg-surface-muted" />
        <MiniMap
          pannable
          zoomable
          className="!border !border-border !bg-surface"
          maskColor="rgba(15, 23, 42, 0.55)"
        />
      </ReactFlow>
    </div>
  );
}

export { DRAG_DATA_KEY };
