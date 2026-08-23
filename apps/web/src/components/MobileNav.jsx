import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { Compass, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { useMobileNavStore } from "@/stores/mobileNavStore";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useFocusTrap } from "@/hooks/useFocusTrap";

/** The Sidebar hides below the md breakpoint (the workflow editor genuinely
 * needs the width back) — without this, there'd be no way to navigate
 * between Dashboard/Workflows/Executions/Settings on a phone at all. */
export function MobileNav() {
  const open = useMobileNavStore((s) => s.open);
  const setOpen = useMobileNavStore((s) => s.setOpen);
  const panelRef = useRef(null);
  useHotkeys({ escape: () => setOpen(false) });
  useFocusTrap(panelRef, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex md:hidden"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-64 flex-col border-r border-border bg-surface outline-none"
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <Compass className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-[15px] font-semibold tracking-tight">FlowPilot</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="ml-auto rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent-soft text-foreground font-medium"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
