import { useQuery } from "@tanstack/react-query";
import { getPreference } from "@/lib/db";

export const LAST_OPENED_WORKFLOW_KEY = "lastOpenedWorkflowId";
export const LAST_OPENED_QUERY_KEY = ["preferences", LAST_OPENED_WORKFLOW_KEY];

export function useLastOpenedWorkflowId() {
  return useQuery({
    queryKey: LAST_OPENED_QUERY_KEY,
    queryFn: () => getPreference(LAST_OPENED_WORKFLOW_KEY, null),
  });
}
