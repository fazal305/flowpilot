import { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/app/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { WorkflowsPage } from "@/pages/WorkflowsPage";
import { ExecutionsPage } from "@/pages/ExecutionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { CommandPalette } from "@/components/CommandPalette";
import { GenerateWorkflowDialog } from "@/features/ai/GenerateWorkflowDialog";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";
import { seedDemoWorkflowsIfEmpty } from "@/lib/demoData";
import { WORKFLOWS_QUERY_KEY } from "@/features/workflows/api/workflowDrafts";

// React Flow (and its transitive weight) is only needed on these two routes —
// code-splitting them keeps everyone who's just browsing the dashboard or
// workflow list from downloading it upfront.
const EditorPage = lazy(() => import("@/features/workflows/EditorPage").then((m) => ({ default: m.EditorPage })));
const ExecutionDetailPage = lazy(() =>
  import("@/features/executions/ExecutionDetailPage").then((m) => ({ default: m.ExecutionDetailPage }))
);

function RouteFallback() {
  return <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-foreground-muted">Loading…</div>;
}

function GlobalShortcuts() {
  const toggle = useCommandPaletteStore((s) => s.toggle);
  useHotkeys({ "mod+k": toggle });
  return null;
}

function useSeedDemoData() {
  const queryClient = useQueryClient();
  useEffect(() => {
    seedDemoWorkflowsIfEmpty().then((seeded) => {
      if (seeded) queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function App() {
  useSeedDemoData();
  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* The editor is full-bleed (desktop-first canvas), so it lives outside AppShell's sidebar/topbar chrome. */}
          <Route path="/workflows/new" element={<EditorPage />} />
          <Route path="/workflows/:workflowId" element={<EditorPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/executions" element={<ExecutionsPage />} />
            <Route path="/executions/:executionId" element={<ExecutionDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
      <GlobalShortcuts />
      <CommandPalette />
      <GenerateWorkflowDialog />
    </>
  );
}
