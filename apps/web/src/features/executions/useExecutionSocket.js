import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const WS_URL = API_URL.replace(/^http/, "ws");

/**
 * Pushes execution updates live instead of waiting for the poll backstop in
 * useExecution. Messages carry no payload beyond "something changed" — the
 * REST fetch (already correct, already tested) stays the single source of
 * truth for what the execution actually looks like; this just tells the
 * query cache to go get it sooner than the 4s poll would.
 *
 * Connection failures are silent by design: the poll backstop in useExecution
 * means a dropped or refused socket degrades to "a few seconds slower,"
 * never to "broken" — there's nothing useful to show the user about a
 * real-time channel that isn't required for correctness.
 */
export function useExecutionSocket(executionId, enabled) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !executionId) {
      setConnected(false);
      return undefined;
    }

    const socket = new WebSocket(`${WS_URL}/ws/executions/${executionId}`);
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["executions", executionId] });
    };

    return () => socket.close();
  }, [executionId, enabled, queryClient]);

  return connected;
}
