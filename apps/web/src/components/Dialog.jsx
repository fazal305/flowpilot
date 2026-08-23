import { useHotkeys } from "@/hooks/useHotkeys";

export function Dialog({ open, onClose, title, children, className = "" }) {
  useHotkeys({ escape: onClose });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={["w-full max-w-lg rounded-lg border border-border bg-surface shadow-lg", className].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
