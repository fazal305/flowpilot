export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      ) : null}
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-sm text-sm text-foreground-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
