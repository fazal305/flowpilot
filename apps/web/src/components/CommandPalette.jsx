import { useMemo, useState } from "react";
import { Command } from "cmdk";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Workflow,
  PlayCircle,
  Settings,
  SunMoon,
  Save,
  Keyboard,
  Sparkles,
} from "lucide-react";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";
import { useAiDialogStore } from "@/stores/aiDialogStore";
import { useThemeStore } from "@/stores/themeStore";
import { useEditorStore } from "@/features/workflows/store/editorStore";
import { NODE_DEFINITIONS } from "@/features/workflows/nodeDefinitions";
import { ShortcutsDialog } from "./ShortcutsDialog";

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setAiDialogOpen = useAiDialogStore((s) => s.setOpen);
  const addNode = useEditorStore((s) => s.addNode);
  const requestImmediateSave = useEditorStore((s) => s.requestImmediateSave);

  const inEditor = location.pathname.startsWith("/workflows/");

  function run(fn) {
    return () => {
      fn();
      setOpen(false);
    };
  }

  const nodeCommands = useMemo(
    () =>
      Object.values(NODE_DEFINITIONS).map((def) => ({
        id: `add-${def.type}`,
        label: `Add ${def.label} node`,
        icon: def.icon,
        action: () => addNode(def.type, { x: 240, y: 160 }),
      })),
    [addNode]
  );

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command palette"
        className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
      >
        <Command.Input
          placeholder="Type a command or search…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-foreground-muted"
        />
        <Command.List className="max-h-80 overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-sm text-foreground-muted">
            No matching commands.
          </Command.Empty>

          <Command.Group heading="Navigate" className="px-2 py-1 text-[11px] uppercase tracking-wide text-foreground-muted [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1">
            <Command.Item onSelect={run(() => navigate("/workflows/new"))} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <Plus className="h-4 w-4" aria-hidden="true" /> Create workflow
            </Command.Item>
            <Command.Item onSelect={run(() => setAiDialogOpen(true))} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Generate workflow with AI
            </Command.Item>
            <Command.Item onSelect={run(() => navigate("/workflows"))} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <Workflow className="h-4 w-4" aria-hidden="true" /> Open workflows
            </Command.Item>
            <Command.Item onSelect={run(() => navigate("/executions"))} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <PlayCircle className="h-4 w-4" aria-hidden="true" /> Open executions
            </Command.Item>
            <Command.Item onSelect={run(() => navigate("/settings"))} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <Settings className="h-4 w-4" aria-hidden="true" /> Open settings
            </Command.Item>
          </Command.Group>

          <Command.Group heading="General" className="px-2 py-1 text-[11px] uppercase tracking-wide text-foreground-muted [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1">
            <Command.Item onSelect={run(toggleTheme)} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <SunMoon className="h-4 w-4" aria-hidden="true" /> Toggle theme
            </Command.Item>
            <Command.Item onSelect={run(() => setShortcutsOpen(true))} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted">
              <Keyboard className="h-4 w-4" aria-hidden="true" /> Show keyboard shortcuts
            </Command.Item>
          </Command.Group>

          {inEditor && (
            <Command.Group heading="Editor" className="px-2 py-1 text-[11px] uppercase tracking-wide text-foreground-muted [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1">
              <Command.Item
                onSelect={run(requestImmediateSave)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted"
              >
                <Save className="h-4 w-4" aria-hidden="true" /> Save workflow
              </Command.Item>
              {nodeCommands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  onSelect={run(cmd.action)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-surface-muted"
                >
                  <cmd.icon className="h-4 w-4" aria-hidden="true" /> {cmd.label}
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </>
  );
}
