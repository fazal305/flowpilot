import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/apiClient";

export const RUNNING_STATES = new Set(["PENDING", "RUNNING"]);

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
    // Backstop, not the primary channel — WebSocket pushes (useExecutionSocket)
    // handle real-time updates while connected; this just guarantees the UI
    // still converges on the truth within a few seconds if the socket drops.
    refetchInterval: (query) => (RUNNING_STATES.has(query.state.data?.status) ? 4000 : false),
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
