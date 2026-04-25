import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Briefcase, Search, Plus, ArrowRight, Filter } from "lucide-react";
import { useJobs } from "@/lib/api/hooks";
import { JobActionsMenu } from "@/components/jobs/JobActionsMenu";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Job Postings — Hireloop" },
      { name: "description", content: "Browse all job postings, applicant counts, and screening progress." },
    ],
  }),
  component: JobsIndexPage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

type StatusFilter = "all" | "active" | "draft" | "closed";

function JobsIndexPage() {
  const { data: jobs = [] } = useJobs();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (status !== "all" && j.status !== status) return false;
      if (query && !`${j.title} ${j.department}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [jobs, query, status]);

  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => j.status === "active").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    closed: jobs.filter((j) => j.status === "closed").length,
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">All postings</p>
          <h1 className="text-2xl font-display font-bold tracking-tight">Job Postings</h1>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-semibold shadow-glow hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" /> New job
        </Link>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-surface p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs by title or department…"
            className="w-full h-9 pl-8 pr-3 rounded-md bg-secondary/50 border border-transparent text-sm focus:outline-none focus:border-ring focus:bg-surface transition"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          {(["all", "active", "draft", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-2.5 h-7 rounded-md font-semibold capitalize transition",
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {s} <span className="opacity-60 ml-0.5">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_minmax(0,1.2fr)_40px] gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/40 border-b border-border">
          <div>Job</div>
          <div>Department</div>
          <div>Applicants</div>
          <div>Top matches</div>
          <div>Screened</div>
          <div></div>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold">No jobs found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search or filter.</p>
            </div>
          ) : (
            filtered.map((job) => {
              const pct = job.applicants > 0 ? Math.round((job.screened / job.applicants) * 100) : 0;
              return (
                <Link
                  key={job.id}
                  to="/jobs/$jobId"
                  params={{ jobId: job.id }}
                  className="grid grid-cols-[1fr_40px] md:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr_minmax(0,1.2fr)_40px] gap-3 px-4 py-3 items-center hover:bg-secondary/40 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                        <span className={cn(
                          "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                          job.status === "active" && "bg-success/10 text-success",
                          job.status === "draft" && "bg-muted text-muted-foreground",
                          job.status === "closed" && "bg-destructive/10 text-destructive",
                        )}>{job.status}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        <span className="md:hidden">{job.department} · </span>{job.postedAt}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground truncate">{job.department}</div>
                  <div className="hidden md:block">
                    <div className="text-sm font-bold leading-none">{job.applicants}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">total</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-bold text-success leading-none">{job.topMatches}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">strong fit</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{job.screened}/{job.applicants}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                    <JobActionsMenu job={job} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
