import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { NODE_DEFINITIONS, nodeSummary } from "../nodeDefinitions";

const CATEGORY_STYLES = {
  trigger: { ring: "border-node-trigger", chip: "bg-node-trigger/15 text-node-trigger" },
  logic: { ring: "border-node-logic", chip: "bg-node-logic/15 text-node-logic" },
  action: { ring: "border-node-action", chip: "bg-node-action/15 text-node-action" },
};

const STATUS_DOT = {
  idle: "bg-status-pending",
  pending: "bg-status-pending",
  running: "bg-status-running animate-pulse",
  success: "bg-status-success",
  failed: "bg-status-error",
  skipped: "bg-status-skipped",
};

const HANDLE_BASE =
  "!h-2.5 !w-2.5 !rounded-full !border-2 !border-surface !bg-border-strong";

/**
 * React Flow re-renders every node component whenever the `nodes` array
 * reference changes — which happens on any drag, add, or edit anywhere on
 * the canvas, not just to the node that actually changed. Memoizing means a
 * given node only re-renders when its own `data`/`selected` props change,
 * which matters once a graph has more than a handful of nodes.
 */
export const WorkflowNode = memo(function WorkflowNode({ data, selected }) {
  const def = NODE_DEFINITIONS[data.nodeType];
  const Icon = def.icon;
  const styles = CATEGORY_STYLES[def.category];
  const isCondition = data.nodeType === "condition";
  const isTrigger = def.category === "trigger";

  return (
    <div
      className={[
        "relative w-56 rounded-lg border bg-surface shadow-sm transition-shadow",
        selected ? "border-ring ring-2 ring-ring" : styles.ring,
      ].join(" ")}
    >
      {!isTrigger && (
        <Handle type="target" position={Position.Left} className={HANDLE_BASE} />
      )}

      <div className="flex items-center gap-2 px-3 py-2">
        <span className={["flex h-6 w-6 shrink-0 items-center justify-center rounded", styles.chip].join(" ")}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
          {data.label}
        </span>
        <span
          className={["h-2 w-2 shrink-0 rounded-full", STATUS_DOT[data.status ?? "idle"]].join(" ")}
          role="img"
          aria-label={`Status: ${data.status ?? "idle"}`}
        />
      </div>

      <div className="truncate border-t border-border px-3 py-1.5 font-mono-token text-[11px] text-foreground-muted">
        {nodeSummary(data)}
      </div>

      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "38%" }}
            className={["!h-2.5 !w-2.5 !rounded-full !border-2 !border-surface", "!bg-status-success"].join(" ")}
          />
          <span className="pointer-events-none absolute right-[-18px] top-[30%] text-[10px] font-medium text-status-success">
            T
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "68%" }}
            className={["!h-2.5 !w-2.5 !rounded-full !border-2 !border-surface", "!bg-status-error"].join(" ")}
          />
          <span className="pointer-events-none absolute right-[-20px] top-[60%] text-[10px] font-medium text-status-error">
            F
          </span>
        </>
      ) : (
        <Handle type="source" position={Position.Right} className={HANDLE_BASE} />
      )}
    </div>
  );
});
