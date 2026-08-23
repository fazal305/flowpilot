import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { WorkflowsPage } from "@/pages/WorkflowsPage";
import { ExecutionsPage } from "@/pages/ExecutionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LoginPage } from "@/features/auth/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
