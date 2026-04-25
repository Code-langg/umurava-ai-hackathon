import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users, Upload } from "lucide-react";
import { useCandidates } from "@/lib/api/hooks";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/candidates/all")({
  head: () => ({
    meta: [
      { title: "All candidates — Hireloop" },
      { name: "description", content: "Every candidate across all jobs in one searchable list." },
    ],
  }),
  component: AllCandidatesPage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

function AllCandidatesPage() {
  const { data: all = [] } = useCandidates();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = useMemo(() => {
    return all.filter((c) => {
      if (q && !`${c.name} ${c.title} ${c.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (tier === "high") return c.score >= 80;
      if (tier === "medium") return c.score >= 60 && c.score < 80;
      if (tier === "low") return c.score < 60;
      return true;
    });
  }, [all, q, tier]);

  const counts = {
    all: all.length,
    high: all.filter((c) => c.score >= 80).length,
    medium: all.filter((c) => c.score >= 60 && c.score < 80).length,
    low: all.filter((c) => c.score < 60).length,
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">{filtered.length} of {all.length} candidates</p>
          <h1 className="text-2xl font-display font-bold tracking-tight">All candidates</h1>
        </div>
        <Link
          to="/candidates"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold shadow-glow hover:opacity-95 transition"
        >
          <Upload className="h-3.5 w-3.5" /> Upload candidates
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, title, or skill…"
            className="w-full h-9 pl-8 pr-3 rounded-md bg-secondary/50 border border-transparent text-sm focus:outline-none focus:border-ring focus:bg-surface transition"
          />
        </div>
        <div className="flex items-center gap-1 text-xs flex-wrap">
          {(["all", "high", "medium", "low"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "px-2.5 h-7 rounded-md font-semibold capitalize transition",
                tier === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {t} <span className="opacity-60 ml-0.5">{counts[t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(0,1.5fr)_80px] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/40 border-b border-border">
          <div>Candidate</div>
          <div>Title</div>
          <div>Experience</div>
          <div>Skills</div>
          <div className="text-right">Score</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold">No candidates match</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[1fr_60px] md:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(0,1.5fr)_80px] gap-3 px-4 py-3 items-center hover:bg-secondary/40 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: `hsl(${c.avatarHue} 65% 50%)` }}
                  >
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate md:hidden">{c.title}</div>
                  </div>
                </div>
                <div className="hidden md:block text-sm text-muted-foreground truncate">{c.title}</div>
                <div className="hidden md:block text-sm text-muted-foreground">{c.yearsExperience} yrs</div>
                <div className="hidden md:flex flex-wrap gap-1 min-w-0">
                  {c.skills.slice(0, 3).map((s) => (
                    <span key={s} className="text-[10px] font-semibold bg-secondary px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                  {c.skills.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{c.skills.length - 3}</span>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "inline-block text-xs font-bold px-2 py-0.5 rounded",
                      c.score >= 80 && "bg-success/10 text-success",
                      c.score >= 60 && c.score < 80 && "bg-warning/15 text-warning-foreground",
                      c.score < 60 && "bg-destructive/10 text-destructive",
                    )}
                  >
                    {c.score}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
