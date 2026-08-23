import { useReactFlow } from "@xyflow/react";
import { NODE_CATEGORIES, NODE_DEFINITIONS } from "./nodeDefinitions";
import { useEditorStore } from "./store/editorStore";
import { DRAG_DATA_KEY } from "./EditorCanvas";

const CATEGORY_TEXT = {
  trigger: "text-node-trigger",
  logic: "text-node-logic",
  action: "text-node-action",
};

export function NodePalette() {
  const addNode = useEditorStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  function handleAdd(type) {
    // Places the new node near the current viewport center, offset slightly
    // per click so repeated adds don't stack exactly on top of each other.
    const center = screenToFlowPosition({
      x: window.innerWidth / 2 + Math.random() * 60 - 30,
      y: window.innerHeight / 2 + Math.random() * 60 - 30,
    });
    addNode(type, center);
  }

  function handleDragStart(event, type) {
    event.dataTransfer.setData(DRAG_DATA_KEY, type);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-surface p-3">
      {NODE_CATEGORIES.map((category) => (
        <div key={category.id}>
          <h2 className={["mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide", CATEGORY_TEXT[category.id]].join(" ")}>
            {category.label}
          </h2>
          <div className="flex flex-col gap-1">
            {Object.values(NODE_DEFINITIONS)
              .filter((def) => def.category === category.id)
              .map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onClick={() => handleAdd(def.type)}
                    title={def.description}
                    className="flex items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-left text-sm text-foreground-muted transition-colors hover:border-border hover:bg-surface-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{def.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
      <p className="mt-auto px-1 text-[11px] leading-relaxed text-foreground-muted">
        Click to add at center, or drag onto the canvas.
      </p>
    </aside>
  );
}
