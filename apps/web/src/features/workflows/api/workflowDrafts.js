import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listWorkflows,
  getWorkflow,
  putWorkflow,
  deleteWorkflow,
} from "@/lib/db";
import { api } from "@/services/apiClient";

export const WORKFLOWS_QUERY_KEY = ["workflows"];

export function useWorkflowsList() {
  return useQuery({ queryKey: WORKFLOWS_QUERY_KEY, queryFn: listWorkflows });
}

export function useWorkflow(id) {
  return useQuery({
    queryKey: ["workflows", id],
    queryFn: () => getWorkflow(id),
    enabled: Boolean(id) && id !== "new",
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY }),
  });
}

/**
 * Pushes the current local draft to the server so the execution engine has
 * something to run against. This is the frontend's first real sync write —
 * everything before this point (drafts, autosave) stayed entirely local.
 */
export function usePublishWorkflow() {
  return useMutation({
    mutationFn: async (workflow) =>
      (await api.put(`/api/workflows/${workflow.id}`, {
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        graph: workflow.graph,
      })).workflow,
  });
}

export function useDuplicateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workflow) => {
      const now = new Date().toISOString();
      const copy = {
        ...workflow,
        id: crypto.randomUUID(),
        name: `${workflow.name} copy`,
        createdAt: now,
        updatedAt: now,
        syncStatus: "local-only",
      };
      await putWorkflow(copy);
      return copy;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY }),
  });
}
