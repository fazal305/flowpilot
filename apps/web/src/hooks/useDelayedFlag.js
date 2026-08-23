import { useEffect, useState } from "react";

/**
 * Only flips true if `active` stays true past `delayMs`. IndexedDB reads
 * typically resolve in a few milliseconds — showing a spinner unconditionally
 * on every list page would just flash on screen for a frame, which reads as
 * jank rather than feedback. Genuinely slow loads still get a visible state.
 */
export function useDelayedFlag(active, delayMs = 200) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return undefined;
    }
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
}
