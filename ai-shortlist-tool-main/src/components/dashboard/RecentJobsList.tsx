import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase } from "lucide-react";
import type { JobPosting } from "@/types";
import { cn } from "@/lib/utils";

export function RecentJobsList({ jobs }: { jobs: JobPosting[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden shrink-0">
      <div className="px-3 py-2 flex items-center justify-between border-b border-border gap-2">
        <h2 className="font-display font-semibold text-[12px] truncate">Recent job postings</h2>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/jobs" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            View all jobs <ArrowRight className="h-3 w-3" />
          </Link>
          <Link to="/jobs/new" className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1">
            <Briefcase className="h-3 w-3" /> New
          </Link>
        </div>
      </div>
      <div className="divide-y divide-border">
        {jobs.map((job) => {
          const pct = job.applicants > 0 ? Math.round((job.screened / job.applicants) * 100) : 0;
          return (
            <Link
              key={job.id}
              to="/jobs/$jobId"
              params={{ jobId: job.id }}
              className="px-3 py-2 flex items-center gap-2.5 hover:bg-secondary/50 transition"
            >
              <div className="h-6 w-6 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Briefcase className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-[12px] truncate">{job.title}</h3>
                  <span
                    className={cn(
                      "text-[8px] uppercase font-bold tracking-wider px-1 py-0.5 rounded shrink-0",
                      job.status === "active" && "bg-success/10 text-success",
                      job.status === "draft" && "bg-muted text-muted-foreground",
                      job.status === "closed" && "bg-destructive/10 text-destructive",
                    )}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {job.department} · {job.postedAt}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[11px] font-bold leading-none">{job.applicants}</div>
                  <div className="text-[9px] text-muted-foreground">applicants</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-success leading-none">{job.topMatches}</div>
                  <div className="text-[9px] text-muted-foreground">top</div>
                </div>
                <div className="w-16">
                  <div className="text-[9px] text-muted-foreground text-right">{pct}%</div>
                  <div className="h-1 rounded-full bg-secondary overflow-hidden mt-0.5">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
