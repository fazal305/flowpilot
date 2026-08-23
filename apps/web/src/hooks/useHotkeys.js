import { useEffect } from "react";

function isEditableTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

/**
 * Registers global keyboard shortcuts.
 *
 * `bindings` maps a combo string ("mod+s", "mod+shift+z", "delete", "escape")
 * to a handler. Combos are ignored while typing in an input/textarea/
 * contenteditable element, except "escape" which always fires.
 */
export function useHotkeys(bindings) {
  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push("mod");
      if (event.shiftKey) parts.push("shift");
      parts.push(key === " " ? "space" : key);
      const combo = parts.join("+");

      const handler = bindings[combo];
      if (!handler) return;
      if (combo !== "escape" && isEditableTarget(event.target)) return;

      event.preventDefault();
      handler(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bindings]);
}
