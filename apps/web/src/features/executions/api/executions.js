import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/apiClient";

const RUNNING_STATES = new Set(["PENDING", "RUNNING"]);

export function useRecentExecutions() {
  return useQuery({
    queryKey: ["executions"],
    queryFn: async () => (await api.get("/api/executions")).executions,
  });
}

export function useExecution(id) {
  return useQuery({
    queryKey: ["executions", id],
    queryFn: async () => (await api.get(`/api/executions/${id}`)).execution,
    enabled: Boolean(id),
    // Polls while the run is in flight; stops once it lands on a terminal
    // status. WebSocket-pushed updates replace this in Phase 7 — this is a
    // real (if less elegant) way to reflect a real backend state in the
    // meantime, not a simulated/faked progress bar.
    refetchInterval: (query) => (RUNNING_STATES.has(query.state.data?.status) ? 1000 : false),
  });
}

export function useExecutionHistory(workflowId) {
  return useQuery({
    queryKey: ["workflows", workflowId, "executions"],
    queryFn: async () => (await api.get(`/api/workflows/${workflowId}/executions`)).executions,
    enabled: Boolean(workflowId),
  });
}

export function useTriggerExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, triggeredBy = "manual" }) =>
      (await api.post(`/api/workflows/${workflowId}/execute`, { triggeredBy })).executionId,
    onSuccess: (_data, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      queryClient.invalidateQueries({ queryKey: ["workflows", workflowId, "executions"] });
    },
  });
}
