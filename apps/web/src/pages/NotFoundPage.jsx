import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-center text-foreground">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Link to="/" className="text-sm text-accent hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
