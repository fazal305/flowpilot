import { useRef } from "react";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function Dialog({ open, onClose, title, children, className = "" }) {
  useHotkeys({ escape: onClose });
  const contentRef = useRef(null);
  useFocusTrap(contentRef, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={["w-full max-w-lg rounded-lg border border-border bg-surface shadow-lg outline-none", className].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
