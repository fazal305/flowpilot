import { Component } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Last-resort net: an uncaught render error anywhere in the tree would
 * otherwise unmount the whole app to a blank white page, which is exactly
 * what the project explicitly must never do.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium">Something went wrong.</p>
          <p className="max-w-sm text-xs text-foreground-muted">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
