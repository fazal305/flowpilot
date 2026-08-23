import { useState } from "react";
import { Compass } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    // Wired to the real /api/auth/login endpoint once the backend is deployed
    // (Phase 4). For now this validates the form shell only.
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Compass className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">
            FlowPilot
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface p-6"
        >
          <h1 className="text-base font-semibold">Sign in</h1>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground-muted">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 w-full rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
          <p className="mt-3 text-center text-xs text-foreground-muted">
            Authentication connects to the live API in Phase 4.
          </p>
        </form>
      </div>
    </div>
  );
}
