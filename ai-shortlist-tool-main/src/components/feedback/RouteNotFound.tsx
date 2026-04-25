import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

export function RouteNotFound({
  title = "Page not found",
  description = "We couldn't find what you're looking for.",
  homeLabel = "Back to dashboard",
  homeTo = "/",
}: {
  title?: string;
  description?: string;
  homeLabel?: string;
  homeTo?: string;
}) {
  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-display font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
      <Link
        to={homeTo}
        className="mt-5 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-95 transition"
      >
        {homeLabel}
      </Link>
    </div>
  );
}
