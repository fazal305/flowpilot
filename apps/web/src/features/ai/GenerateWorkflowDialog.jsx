import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { useAiDialogStore } from "@/stores/aiDialogStore";
import { useGenerateWorkflow } from "./api/generateWorkflow";

const EXAMPLE_PROMPT =
  "Create a workflow that takes new leads, checks whether their budget is above Rs. 100k, summarizes their requirements with AI, and sends qualified leads to my sales team.";

export function GenerateWorkflowDialog() {
  const open = useAiDialogStore((s) => s.open);
  const setOpen = useAiDialogStore((s) => s.setOpen);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const generate = useGenerateWorkflow();

  function handleClose() {
    setOpen(false);
    setPrompt("");
    generate.reset();
  }

  function handleOpenInEditor() {
    const result = generate.data;
    setOpen(false);
    setPrompt("");
    generate.reset();
    navigate("/workflows/new", { state: { generated: result } });
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Generate workflow with AI" className="max-w-xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Generate a workflow with AI</h2>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {!generate.data && (
          <>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground-muted">Describe what you want it to do</span>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={EXAMPLE_PROMPT}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus-visible:border-accent"
              />
            </label>

            {generate.isError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{generate.error?.message}</span>
              </div>
            )}

            <button
              type="button"
              disabled={prompt.trim().length < 5 || generate.isPending}
              onClick={() => generate.mutate(prompt.trim())}
              className="flex items-center justify-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              Generate
            </button>
          </>
        )}

        {generate.data && (
          <div className="flex flex-col gap-3">
            {generate.data.meta.mocked && (
              <p className="rounded-md border border-node-logic/30 bg-node-logic/10 p-2.5 text-xs text-node-logic">
                This is an educational/portfolio project — bring your own OpenRouter API key (set{" "}
                <code className="font-mono-token">OPENROUTER_API_KEY</code> in the backend's <code className="font-mono-token">.env</code>)
                for a real generation from your prompt. This is a fixed example draft instead.
              </p>
            )}

            <div className="rounded-md border border-border bg-surface-muted p-3">
              <p className="text-sm font-medium">{generate.data.name}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{generate.data.description}</p>
              <p className="mt-2 text-xs text-foreground-muted">
                {generate.data.graph.nodes.length} nodes · {generate.data.graph.edges.length} connections
                {!generate.data.meta.mocked && (
                  <> · {generate.data.meta.model} · {generate.data.meta.promptTokens + generate.data.meta.completionTokens} tokens · {generate.data.meta.latencyMs}ms</>
                )}
              </p>
            </div>

            <p className="text-xs text-foreground-muted">
              This opens in the editor as a normal, editable draft — nothing runs until you review it and press Run yourself.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => generate.reset()}
                className="flex-1 rounded-md border border-border px-3.5 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-muted"
              >
                Try a different prompt
              </button>
              <button
                type="button"
                onClick={handleOpenInEditor}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Open in editor <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
