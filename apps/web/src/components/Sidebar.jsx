import { NavLink } from "react-router-dom";
import { Compass } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface"
      aria-label="Primary"
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <Compass className="h-5 w-5 text-accent" aria-hidden="true" />
        <span className="text-[15px] font-semibold tracking-tight">
          FlowPilot
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]",
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
    </aside>
  );
}
