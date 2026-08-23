import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/** Only renders while offline — a permanent "Online" badge would just be noise. */
export function OfflineIndicator() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <span
      role="status"
      className="flex items-center gap-1.5 rounded-md border border-node-logic/30 bg-node-logic/10 px-2 py-1 text-xs font-medium text-node-logic"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      Offline — saving locally
    </span>
  );
}
