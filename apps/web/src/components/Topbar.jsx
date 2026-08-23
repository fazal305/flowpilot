import { Sun, Moon, Search } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

export function Topbar() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <button
        type="button"
        onClick={() => openCommandPalette(true)}
        className="flex w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-border-strong"
        aria-label="Search workflows and executions"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span>Search…</span>
        <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[11px] font-mono-token text-foreground-muted">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="ml-4 flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </header>
  );
}
