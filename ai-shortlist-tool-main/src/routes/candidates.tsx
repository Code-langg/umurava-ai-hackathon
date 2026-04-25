import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  Sparkles,
  Filter,
  ArrowDownUp,
  Users,
  GitCompare,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import type { Candidate, ScreeningAnalytics } from "@/types";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { ComparisonView } from "@/components/candidates/ComparisonView";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { cn } from "@/lib/utils";
import { emptyAnalytics } from "@/lib/screening/mapper";
import {
  useJob,
  useJobs,
  useScreenCandidates,
} from "@/lib/api/hooks";

const candidatesSearchSchema = z.object({
  jobId: z.string().optional(),
});

export const Route = createFileRoute("/candidates")({
  validateSearch: (search) => candidatesSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Candidates - Hireloop" },
      {
        name: "description",
        content: "Upload, AI-screen, rank, and compare candidates side by side.",
      },
    ],
  }),
  component: CandidatesPage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

type Phase = "empty" | "ready" | "screening" | "results";

function CandidatesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { jobId } = Route.useSearch();
  const { data: jobs = [] } = useJobs();
  const activeJobId = jobId ?? jobs[0]?.id;
  const jobQuery = useJob(activeJobId);
  const screenCandidates = useScreenCandidates();

  const activeJob = jobQuery.data?.job;
  const initialCandidates = jobQuery.data?.candidates ?? [];

  const [phase, setPhase] = useState<Phase>(
    initialCandidates.length > 0 ? "results" : "empty",
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [screenedCandidates, setScreenedCandidates] =
    useState<Candidate[]>(initialCandidates);
  const [analytics, setAnalytics] = useState<ScreeningAnalytics>(emptyAnalytics);

  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [skillFilter, setSkillFilter] = useState("");
  const [expFilter, setExpFilter] = useState("any");
  const [sortBy, setSortBy] = useState<"score" | "experience">("score");

  const candidates =
    screenedCandidates.length > 0 ? screenedCandidates : initialCandidates;
  const activeAnalytics =
    candidates.length > 0
      ? analytics.totalCandidates > 0
        ? analytics
        : {
            ...emptyAnalytics,
            totalCandidates: candidates.length,
            averageScore: Math.round(
              candidates.reduce((sum, candidate) => sum + candidate.score, 0) /
                candidates.length,
            ),
            topCandidate: [...candidates].sort((a, b) => b.score - a.score)[0] ?? null,
            topCandidates: [...candidates].sort((a, b) => b.score - a.score).slice(0, 20),
          }
      : emptyAnalytics;

  useEffect(() => {
    if (initialCandidates.length > 0 && screenedCandidates.length === 0 && !showUploadZone) {
      setPhase("results");
    }
  }, [initialCandidates.length, screenedCandidates.length, showUploadZone]);

  useEffect(() => {
    setFile(null);
    setError(null);
    setSelected([]);
    setShowCompare(false);
    setShowUploadZone(false);
    setScreenedCandidates([]);
    setAnalytics(emptyAnalytics);
    setPhase("empty");
  }, [activeJobId]);

  const acceptFile = (nextFile: File) => {
    setError(null);

    if (!/\.(csv|xlsx?|pdf)$/i.test(nextFile.name)) {
      setError("Unsupported file type. Please upload CSV, Excel, or PDF.");
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB).");
      return;
    }

    setFile(nextFile);
    setPhase("ready");
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) acceptFile(droppedFile);
  };

  const runScreening = async () => {
    if (!file) {
      setError("Choose a file before running screening.");
      return;
    }

    if (!activeJobId || !activeJob) {
      setError("Create a job first so candidates can be screened against it.");
      return;
    }

    setError(null);
    setPhase("screening");

    try {
      const result = await screenCandidates.mutateAsync({
        jobId: activeJobId,
        job: {
          id: activeJob.id,
          department: activeJob.department,
          title: activeJob.title,
          description: activeJob.description || "",
          requiredSkills: activeJob.requiredSkills || [],
          preferredSkills: activeJob.preferredSkills || [],
          minimumExperienceYears: activeJob.minimumExperienceYears || 0,
          educationLevel: activeJob.educationLevel || "No requirement",
        },
        file,
      });

      setScreenedCandidates(result.candidates ?? []);
      setAnalytics(result.analytics ?? emptyAnalytics);
      setSelected([]);
      setShowUploadZone(false);
      setPhase("results");
    } catch (screeningError) {
      setPhase("ready");
      setError(
        screeningError instanceof Error
          ? screeningError.message
          : "Failed to screen candidates.",
      );
    }
  };

  const reset = () => {
    setFile(null);
    setError(null);
    setSelected([]);
    setShowCompare(false);
    setShowUploadZone(true);
    setScreenedCandidates([]);
    setAnalytics(emptyAnalytics);
    setPhase("empty");
  };

  const allSkills = useMemo(
    () => Array.from(new Set(candidates.flatMap((candidate) => candidate.skills))).sort(),
    [candidates],
  );

  const filtered = useMemo(() => {
    return candidates
      .filter(
        (candidate) =>
          candidate.score >= scoreRange[0] && candidate.score <= scoreRange[1],
      )
      .filter((candidate) => !skillFilter || candidate.skills.includes(skillFilter))
      .filter((candidate) => {
        if (expFilter === "any") return true;
        if (expFilter === "junior") return candidate.yearsExperience <= 3;
        if (expFilter === "mid") {
          return candidate.yearsExperience > 3 && candidate.yearsExperience <= 6;
        }
        if (expFilter === "senior") return candidate.yearsExperience > 6;
        return true;
      })
      .sort((left, right) =>
        sortBy === "score"
          ? right.score - left.score
          : right.yearsExperience - left.yearsExperience,
      );
  }, [candidates, expFilter, scoreRange, skillFilter, sortBy]);

  const toggleSelect = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );

  if (!activeJobId || !activeJob) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-8 text-center">
        <Briefcase className="h-10 w-10 text-primary mb-3" />
        <h1 className="text-xl font-display font-bold tracking-tight">
          Create a job before screening
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          The screening flow needs a real job profile so the backend can rank candidates.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: "/jobs/new" })}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
        >
          <Briefcase className="h-4 w-4" />
          Create job
        </button>
      </div>
    );
  }

  if (phase === "empty" || phase === "ready" || phase === "screening") {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-4">
        <div className="text-center mb-5">
          <h1 className="text-xl font-display font-bold tracking-tight">
            Upload candidates
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Candidates will be screened against{" "}
            <span className="font-semibold text-foreground">{activeJob.title}</span>.
          </p>
        </div>

        {phase === "empty" && (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary bg-surface/60 hover:bg-primary-soft/30 transition-all cursor-pointer p-8 text-center"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              hidden
              onChange={(event) =>
                event.target.files?.[0] && acceptFile(event.target.files[0])
              }
            />
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3">
              <Upload className="h-5 w-5" />
            </div>
            <h3 className="font-display font-semibold text-sm">
              Drop your file here, or click to browse
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Supports CSV, XLSX, PDF · up to 10MB
            </p>
            <div className="flex justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-secondary">CSV</span>
              <span className="px-1.5 py-0.5 rounded bg-secondary">Excel</span>
              <span className="px-1.5 py-0.5 rounded bg-secondary">PDF</span>
            </div>
            {error && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </div>
            )}
          </div>
        )}

        {phase === "ready" && (
          <div className="w-full rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{file?.name}</span>
                  <button
                    onClick={reset}
                    type="button"
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  File validated. Ready to run AI screening on the backend.
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                Active job profile
              </div>
              <div>
                <div className="font-semibold text-sm">{activeJob.title}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeJob.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(activeJob.requiredSkills || []).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-destructive font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </div>
            )}

            <button
              onClick={runScreening}
              disabled={screenCandidates.isPending}
              type="button"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-5 py-3.5 text-sm font-semibold shadow-glow hover:opacity-95 transition disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4" />
              Run AI Screening
            </button>
          </div>
        )}

        {phase === "screening" && (
          <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-soft text-center">
            <div className="relative mx-auto h-20 w-20 mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-primary-soft" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h3 className="font-display font-bold text-xl">Analyzing candidates...</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              The backend is parsing resumes, calling Gemini, and ranking matches.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-[1280px] mx-auto w-full">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] mb-3 shrink-0">
        <div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} candidates · sorted by {sortBy}
          </p>
          <h1 className="text-xl font-display font-bold tracking-tight mt-0.5">
            AI shortlist
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Source file: {file?.name ?? "latest screening run"}
          </p>
        </div>
        <div className="flex items-center gap-2 justify-start lg:justify-end">
          <Link
            to="/candidates/all"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-secondary"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            onClick={reset}
            type="button"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-secondary"
          >
            Upload more
          </button>
          {selected.length >= 2 && (
            <button
              onClick={() => setShowCompare(true)}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-glow"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare {selected.length}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[240px_1fr] flex-1 min-h-0">
        <aside className="hidden lg:block min-h-0">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-soft h-full overflow-y-auto">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Summary
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {activeAnalytics.totalCandidates} screened
                </div>
                <div className="text-xs text-muted-foreground">
                  Average score: {Math.round(activeAnalytics.averageScore)}%
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Top candidates
                </div>
                <div className="mt-2 space-y-1.5">
                  {activeAnalytics.topCandidates.length === 0 && (
                    <div className="text-xs text-muted-foreground">No results yet</div>
                  )}
                  {activeAnalytics.topCandidates.slice(0, 10).map((candidate, index) => (
                    <div key={candidate.id} className="flex items-center justify-between text-xs">
                      <span className="truncate pr-2">
                        {index + 1}. {candidate.name}
                      </span>
                      <span className="font-semibold">{candidate.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Filters</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Match score
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scoreRange[0]}
                        onChange={(event) =>
                          setScoreRange([+event.target.value, scoreRange[1]])
                        }
                        className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-sm"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scoreRange[1]}
                        onChange={(event) =>
                          setScoreRange([scoreRange[0], +event.target.value])
                        }
                        className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Skill
                    </label>
                    <select
                      value={skillFilter}
                      onChange={(event) => setSkillFilter(event.target.value)}
                      className="w-full mt-2 px-2 py-1.5 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Any</option>
                      {allSkills.map((skill) => (
                        <option key={skill}>{skill}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Experience
                    </label>
                    <select
                      value={expFilter}
                      onChange={(event) => setExpFilter(event.target.value)}
                      className="w-full mt-2 px-2 py-1.5 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="any">Any</option>
                      <option value="junior">0-3 years</option>
                      <option value="mid">4-6 years</option>
                      <option value="senior">7+ years</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Common gaps
                    </label>
                    <div className="mt-2 space-y-1.5">
                      {activeAnalytics.topSkillGaps.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No gap analytics returned yet.
                        </p>
                      )}
                      {activeAnalytics.topSkillGaps.map(([gap, count]) => (
                        <div
                          key={gap}
                          className="flex items-center justify-between text-xs rounded-md bg-secondary px-2 py-1.5"
                        >
                          <span className="truncate pr-2">{gap}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowDownUp className="h-3 w-3" /> Sort by
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {(["score", "experience"] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => setSortBy(option)}
                          type="button"
                          className={cn(
                            "text-xs font-semibold py-1.5 rounded-md transition capitalize",
                            sortBy === option
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-col min-h-0">
          {selected.length > 0 && (
            <div className="mb-2.5 rounded-lg border border-primary/30 bg-primary-soft/40 px-3 py-2 flex items-center justify-between text-xs shrink-0">
              <span>
                <strong>{selected.length}</strong> selected for comparison · Pick up to 3
              </span>
              <button
                onClick={() => setSelected([])}
                type="button"
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-semibold text-sm">No candidates match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try widening the score range or clearing filters.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
              <motion.div layout className="space-y-2.5 pb-2">
                <AnimatePresence>
                  {filtered.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      rank={index + 1}
                      selected={selected.includes(candidate.id)}
                      onToggleSelect={() => toggleSelect(candidate.id)}
                      canSelect={selected.length < 3}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCompare && (
          <ComparisonView
            candidates={candidates.filter((candidate) => selected.includes(candidate.id))}
            onClose={() => setShowCompare(false)}
            onRemove={(id) => {
              const nextSelection = selected.filter((entry) => entry !== id);
              setSelected(nextSelection);
              if (nextSelection.length < 2) setShowCompare(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
