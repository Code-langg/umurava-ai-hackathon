import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

export interface RouteErrorProps {
  error: Error;
  reset: () => void;
}

/** Route-level error fallback. Use directly as `errorComponent` on routes. */
export function RouteError({ error, reset }: RouteErrorProps) {
  const router = useRouter();
  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-display font-bold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mt-1.5">{error.message || "Unexpected error."}</p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-95 transition"
        >
          Try again
        </button>
        <Link
          to="/"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-secondary transition"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
