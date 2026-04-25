import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Sparkles, Trophy, Target, ArrowRight, FileText, FileUp, FileSearch, FileCheck2 } from "lucide-react";
import { useDashboard, useJobs } from "@/lib/api/hooks";
import { FlowStepper, type FlowStep } from "@/components/dashboard/FlowStepper";
import { StatBlock } from "@/components/dashboard/StatBlock";
import { MatchPie } from "@/components/dashboard/MatchPie";
import { RecentJobsList } from "@/components/dashboard/RecentJobsList";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Hireloop" },
      { name: "description", content: "Overview of applicants, AI screening progress, and top matches across active job postings." },
    ],
  }),
  component: DashboardPage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

const flow: FlowStep[] = [
  { step: 1, label: "Create job", icon: FileText, to: "/jobs/new", current: true },
  { step: 2, label: "Upload candidates", icon: FileUp, to: "/candidates" },
  { step: 3, label: "AI screening", icon: FileSearch, to: "/candidates" },
  { step: 4, label: "Decide", icon: FileCheck2, to: "/candidates" },
];

function DashboardPage() {
  const { data: jobs = [] } = useJobs();
  const { data: dashboard } = useDashboard();
  const distribution = dashboard?.distribution ?? [
    { name: "Strong", value: 0, color: "var(--success)" },
    { name: "Possible", value: 0, color: "var(--warning)" },
    { name: "Low", value: 0, color: "var(--destructive)" },
  ];

  return (
    <div className="flex flex-col gap-3 max-w-[1280px] mx-auto w-full">
      {/* Header + Flow stepper */}
      <div className="flex items-start lg:items-center justify-between gap-2 flex-col sm:flex-row shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-none">Welcome back, Sarah 👋</p>
          <h1 className="text-base font-display font-bold tracking-tight leading-tight mt-0.5">Recruiter Dashboard</h1>
        </div>
        <FlowStepper steps={flow} />
      </div>

      {/* Stats */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 shrink-0">
        <StatBlock label="Applicants" value={dashboard?.applicants ?? 0} icon={Users} accent="primary" />
        <StatBlock label="AI screened" value={dashboard?.aiScreened ?? 0} icon={Sparkles} accent="primary" />
        <StatBlock label="Top matches" value={dashboard?.topMatches ?? 0} icon={Trophy} accent="success" />
        <StatBlock label="Avg. score" value={`${dashboard?.averageScore ?? 0}%`} icon={Target} accent="warning" />
      </div>

      {/* Main area — pie + CTA */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
        {/* Distribution — Pie */}
        <div className="sm:col-span-2 rounded-lg border border-border bg-surface p-2 flex flex-col h-[200px]">
          <div className="flex items-start justify-between shrink-0">
            <div>
              <h2 className="font-display font-semibold text-[12px] leading-tight">Match distribution</h2>
              <p className="text-[10px] text-muted-foreground">Across all active postings</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <MatchPie data={distribution} />
          </div>
        </div>

        {/* Next-action CTA */}
        <Link
          to="/candidates"
          className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2.5 text-primary-foreground relative overflow-hidden flex flex-col justify-between gap-1.5 group hover:shadow-glow transition h-[200px]"
        >
          <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/15 blur-2xl" />
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider opacity-90">
              <Sparkles className="h-3 w-3" /> Next action
            </div>
            <h3 className="font-display font-bold text-[13px] leading-snug mt-0.5">Run AI screening</h3>
            <p className="text-[10px] opacity-85 mt-0.5">
              {dashboard?.unscreenedCandidates ?? 0} unscreened candidates ready.
            </p>
          </div>
          <div className="inline-flex items-center justify-between rounded-md bg-white/15 px-2 py-1 text-[11px] font-semibold backdrop-blur group-hover:bg-white/25 transition">
            Start screening
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>

      {/* Recent jobs */}
      <RecentJobsList jobs={dashboard?.recentJobs ?? jobs.slice(0, 3)} />
    </div>
  );
}
