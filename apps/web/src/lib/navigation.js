import {
  LayoutDashboard,
  Workflow,
  PlayCircle,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/workflows", label: "Workflows", icon: Workflow },
  { to: "/executions", label: "Executions", icon: PlayCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];
