import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/apiClient";

/**
 * Returns { name, description, graph: {nodes, edges}, meta }. This never
 * saves or executes anything — it's a draft for the caller to load into the
 * editor, where the user reviews and edits it exactly like any hand-built
 * workflow before ever pressing Run.
 */
export function useGenerateWorkflow() {
  return useMutation({
    mutationFn: async (prompt) => api.post("/api/ai/generate-workflow", { prompt }),
  });
}
