import { Dialog } from "./Dialog";

const SHORTCUTS = [
  { keys: ["Ctrl/⌘", "K"], description: "Open command palette" },
  { keys: ["Ctrl/⌘", "S"], description: "Save workflow" },
  { keys: ["Ctrl/⌘", "Z"], description: "Undo" },
  { keys: ["Ctrl/⌘", "Shift", "Z"], description: "Redo" },
  { keys: ["Delete"], description: "Delete selected node or connection" },
  { keys: ["Escape"], description: "Close dialogs and panels" },
];

export function ShortcutsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
      </div>
      <ul className="divide-y divide-border">
        {SHORTCUTS.map((s) => (
          <li key={s.description} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-foreground-muted">{s.description}</span>
            <span className="flex gap-1">
              {s.keys.map((k) => (
                <kbd
                  key={k}
                  className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono-token text-[11px]"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
