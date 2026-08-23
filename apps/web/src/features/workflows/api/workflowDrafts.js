import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listWorkflows,
  getWorkflow,
  putWorkflow,
  deleteWorkflow,
} from "@/lib/db";

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
