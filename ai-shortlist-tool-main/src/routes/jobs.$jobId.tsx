import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Users,
  Trophy,
  Sparkles,
  Calendar,
  Building2,
  ArrowRight,
  Target,
} from "lucide-react";
import { useJob } from "@/lib/api/hooks";
import type { Candidate, JobPosting } from "@/types";
import { JobActionsMenu } from "@/components/jobs/JobActionsMenu";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job - Hireloop" },
      { name: "description", content: "Job details and screening results." },
    ],
  }),
  component: JobDetailPage,
  errorComponent: RouteError,
  notFoundComponent: () => (
    <RouteNotFound
      title="Job not found"
      description="This posting may have been removed or never existed."
      homeLabel="Back to jobs"
      homeTo="/jobs"
    />
  ),
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { data, isLoading } = useJob(jobId);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data?.job) {
    return <RouteNotFound />;
  }

  return <JobDetailContent job={data.job} candidates={data.candidates} />;
}

function JobDetailContent({
  job,
  candidates,
}: {
  job: JobPosting;
  candidates: Candidate[];
}) {
  const pct = job.applicants > 0 ? Math.round((job.screened / job.applicants) * 100) : 0;
  const avg =
    candidates.length > 0
      ? Math.round(
          candidates.reduce((sum, candidate) => sum + candidate.score, 0) /
            candidates.length,
        )
      : 0;

  return (
    <div className="max-w-[1100px] mx-auto w-full space-y-4">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All jobs
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-glow">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                {job.title}
              </h1>
              <span
                className={cn(
                  "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                  job.status === "active" && "bg-success/10 text-success",
                  job.status === "draft" && "bg-muted text-muted-foreground",
                  job.status === "closed" && "bg-destructive/10 text-destructive",
                )}
              >
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {job.department}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Posted {job.postedAt}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/candidates"
              search={{ jobId: job.id }}
              className="flex-1 sm:flex-none inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-semibold shadow-glow hover:opacity-95 transition justify-center"
            >
              <Sparkles className="h-4 w-4" /> Run AI screening
            </Link>
            <JobActionsMenu job={job} size="md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Applicants", value: job.applicants, icon: Users, accent: "primary" },
          { label: "Screened", value: `${job.screened} (${pct}%)`, icon: Sparkles, accent: "primary" },
          { label: "Top matches", value: job.topMatches, icon: Trophy, accent: "success" },
          { label: "Avg. score", value: `${avg}%`, icon: Target, accent: "warning" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  stat.accent === "primary" && "bg-primary/10 text-primary",
                  stat.accent === "success" && "bg-success/10 text-success",
                  stat.accent === "warning" && "bg-warning/15 text-warning-foreground",
                )}
              >
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                  {stat.label}
                </div>
                <div className="text-base sm:text-lg font-display font-bold leading-tight mt-0.5 truncate">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="font-display font-semibold text-sm mb-2">About the role</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {job.description ||
                `We're looking for a talented ${job.title} to join our ${job.department} team.`}
            </p>
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm mb-2">Required skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {(job.requiredSkills || []).map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] font-semibold bg-secondary text-foreground px-2 py-0.5 rounded-md"
                >
                  {skill}
                </span>
              ))}
              {(job.requiredSkills || []).length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No required skills added yet.
                </span>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm mb-2">Screening progress</h2>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                {job.screened} of {job.applicants} screened
              </span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <h2 className="font-display font-semibold text-sm">Top candidates</h2>
            <Link
              to="/candidates"
              search={{ jobId: job.id }}
              className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {candidates.length === 0 && (
              <div className="px-4 py-4 text-sm text-muted-foreground">
                No screened candidates yet for this job.
              </div>
            )}
            {candidates.slice(0, 20).map((candidate) => (
              <div key={candidate.id} className="px-4 py-2.5 flex items-center gap-2.5">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: `hsl(${candidate.avatarHue} 65% 50%)` }}
                >
                  {candidate.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate">{candidate.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{candidate.title}</div>
                </div>
                <div
                  className={cn(
                    "text-[11px] font-bold px-1.5 py-0.5 rounded",
                    candidate.score >= 80
                      ? "bg-success/10 text-success"
                      : candidate.score >= 60
                        ? "bg-warning/15 text-warning-foreground"
                        : "bg-destructive/10 text-destructive",
                  )}
                >
                  {candidate.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
