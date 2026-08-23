import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab/Shift+Tab cycling inside `containerRef` while `active`, moves
 * focus into it on activation, and restores focus to whatever had it
 * beforehand on deactivation — the baseline a screen-reader or keyboard-only
 * user needs from any dialog/drawer to not get lost behind an overlay.
 */
export function useFocusTrap(containerRef, active) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    previouslyFocused.current = document.activeElement;

    const container = containerRef.current;
    const getFocusable = () => Array.from(container?.querySelectorAll(FOCUSABLE_SELECTOR) ?? []);

    const firstFocusable = getFocusable()[0];
    (firstFocusable ?? container)?.focus();

    function handleKeyDown(event) {
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container?.addEventListener("keydown", handleKeyDown);
    return () => {
      container?.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [active, containerRef]);
}
