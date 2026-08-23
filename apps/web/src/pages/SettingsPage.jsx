import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-foreground-muted">
          Appearance and account preferences.
        </p>
      </div>

      <div className="max-w-xl px-6 py-6">
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Choose how FlowPilot looks on this device.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={[
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                theme === "dark"
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border text-foreground-muted hover:border-border-strong",
              ].join(" ")}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={[
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                theme === "light"
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border text-foreground-muted hover:border-border-strong",
              ].join(" ")}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              Light
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
