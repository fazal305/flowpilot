import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { WorkflowsPage } from "@/pages/WorkflowsPage";
import { ExecutionsPage } from "@/pages/ExecutionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { EditorPage } from "@/features/workflows/EditorPage";
import { CommandPalette } from "@/components/CommandPalette";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

function GlobalShortcuts() {
  const toggle = useCommandPaletteStore((s) => s.toggle);
  useHotkeys({ "mod+k": toggle });
  return null;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* The editor is full-bleed (desktop-first canvas), so it lives outside AppShell's sidebar/topbar chrome. */}
        <Route path="/workflows/new" element={<EditorPage />} />
        <Route path="/workflows/:workflowId" element={<EditorPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/executions" element={<ExecutionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <GlobalShortcuts />
      <CommandPalette />
    </>
  );
}
