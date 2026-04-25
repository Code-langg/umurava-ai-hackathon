import { AIResult, Candidate, DashboardSummary, FrontendCandidate, Job, JobRecord } from "./types";
import { getCandidatesCollection, getJobsCollection } from "./db";

export const skillSuggestions = [
  "React",
  "TypeScript",
  "Node.js",
  "GraphQL",
  "Next.js",
  "AWS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "Python",
  "Go",
  "System Design",
  "REST APIs",
  "Redis",
  "CI/CD",
  "TailwindCSS",
  "Figma",
  "PyTorch",
];

const distributionColors = {
  Strong: "var(--success)",
  Possible: "var(--warning)",
  Low: "var(--destructive)",
} as const;

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
}

function avatarHue(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
}

function createCandidateTitle(skills: string[]) {
  if (skills.length === 0) return "Candidate profile";
  return `${skills.slice(0, 2).join(" / ")} specialist`;
}

function cloneJob(job: JobRecord): JobRecord {
  return {
    ...job,
    postedAt: relativeTime(new Date(job.createdAt)),
  };
}

export function createJob(job: Job): JobRecord {
  const createdAt = new Date().toISOString();
  const nextJob: JobRecord = {
    id: job.id ?? createId("job"),
    title: job.title,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    minimumExperienceYears: job.minimumExperienceYears,
    educationLevel: job.educationLevel,
    description: job.description,
    department: job.department?.trim() || "General",
    applicants: 0,
    screened: 0,
    topMatches: 0,
    postedAt: "Just now",
    createdAt,
    status: job.status ?? "active",
  };

  throw new Error("createJob is now async; use createJobAsync");
}

export async function createJobAsync(job: Job): Promise<JobRecord> {
  const createdAt = new Date().toISOString();
  const nextJob: JobRecord = {
    id: job.id ?? createId("job"),
    title: job.title,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    minimumExperienceYears: job.minimumExperienceYears,
    educationLevel: job.educationLevel,
    description: job.description,
    department: job.department?.trim() || "General",
    applicants: 0,
    screened: 0,
    topMatches: 0,
    postedAt: "Just now",
    createdAt,
    status: job.status ?? "active",
  };

  const jobsCollection = await getJobsCollection();
  await jobsCollection.insertOne(nextJob);
  return cloneJob(nextJob);
}

export function listJobs(): JobRecord[] {
  throw new Error("listJobs is now async; use listJobsAsync");
}

export async function listJobsAsync(): Promise<JobRecord[]> {
  const jobsCollection = await getJobsCollection();
  const jobs = (await jobsCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray()) as JobRecord[];
  return jobs.map(cloneJob);
}

export function getJob(jobId: string): JobRecord | undefined {
  throw new Error("getJob is now async; use getJobAsync");
}

export async function getJobAsync(jobId: string): Promise<JobRecord | undefined> {
  const jobsCollection = await getJobsCollection();
  const job = (await jobsCollection.findOne({ id: jobId })) as JobRecord | null;
  return job ? cloneJob(job) : undefined;
}

export function updateJobStatus(jobId: string, status: JobRecord["status"]): JobRecord | undefined {
  throw new Error("updateJobStatus is now async; use updateJobStatusAsync");
}

export async function updateJobStatusAsync(
  jobId: string,
  status: JobRecord["status"]
): Promise<JobRecord | undefined> {
  const jobsCollection = await getJobsCollection();
  const updated = await jobsCollection.findOneAndUpdate(
    { id: jobId },
    { $set: { status } },
    { returnDocument: "after" }
  );

  if (!updated) return undefined;
  return cloneJob(updated as JobRecord);
}

export function listCandidates(jobId?: string): FrontendCandidate[] {
  throw new Error("listCandidates is now async; use listCandidatesAsync");
}

export async function listCandidatesAsync(jobId?: string): Promise<FrontendCandidate[]> {
  const candidatesCollection = await getCandidatesCollection();
  const filter = jobId ? { jobId } : {};
  return (await candidatesCollection.find(filter).sort({ score: -1 }).toArray()) as FrontendCandidate[];
}

export function storeScreeningResults(jobId: string, rawCandidates: Candidate[], results: AIResult[]) {
  throw new Error("storeScreeningResults is now async; use storeScreeningResultsAsync");
}

export async function storeScreeningResultsAsync(jobId: string, rawCandidates: Candidate[], results: AIResult[]) {
  const candidatesCollection = await getCandidatesCollection();

  const mappedCandidates: FrontendCandidate[] = results.map((result) => {
    const matched = rawCandidates.find((candidate) => candidate.id === result.candidateId);
    const skills = matched?.skills ?? [];
    const experienceYears = matched?.experienceYears ?? 0;
    const educationLevel = matched?.educationLevel || "Not provided";

    return {
      id: result.candidateId,
      jobId,
      name: result.name,
      title: createCandidateTitle(skills),
      email: "",
      location: "Not provided",
      yearsExperience: experienceYears,
      score: result.score,
      skills,
      summary: matched?.summary || result.recommendation || "",
      strengths: result.strengths,
      gaps: [...result.criticalGaps, ...result.minorGaps],
      recommendation: result.recommendation,
      education: educationLevel,
      avatarHue: avatarHue(result.candidateId || result.name),
    };
  });

  if (mappedCandidates.length > 0) {
    const operations = mappedCandidates.map((candidate) => ({
      updateOne: {
        filter: { id: candidate.id, jobId },
        update: { $set: candidate },
        upsert: true,
      },
    }));
    await candidatesCollection.bulkWrite(operations);
  }

  const mergedCandidates = await listCandidatesAsync(jobId);
  const jobsCollection = await getJobsCollection();
  await jobsCollection.updateOne(
    { id: jobId },
    {
      $set: {
        applicants: mergedCandidates.length,
        screened: mergedCandidates.length,
        topMatches: mergedCandidates.filter((candidate) => candidate.score >= 80).length,
      },
    }
  );

  return mergedCandidates;
}

export function getDashboardSummary(): DashboardSummary {
  throw new Error("getDashboardSummary is now async; use getDashboardSummaryAsync");
}

export async function getDashboardSummaryAsync(): Promise<DashboardSummary> {
  const allCandidates = await listCandidatesAsync();
  const allJobs = await listJobsAsync();
  const applicants = allJobs.reduce((sum, job) => sum + job.applicants, 0);
  const aiScreened = allJobs.reduce((sum, job) => sum + job.screened, 0);
  const topMatches = allCandidates.filter((candidate) => candidate.score >= 80).length;
  const averageScore =
    allCandidates.length > 0
      ? Math.round(allCandidates.reduce((sum, candidate) => sum + candidate.score, 0) / allCandidates.length)
      : 0;

  return {
    applicants,
    aiScreened,
    topMatches,
    averageScore,
    unscreenedCandidates: Math.max(applicants - aiScreened, 0),
    distribution: [
      {
        name: "Strong",
        value: allCandidates.filter((candidate) => candidate.score >= 80).length,
        color: distributionColors.Strong,
      },
      {
        name: "Possible",
        value: allCandidates.filter((candidate) => candidate.score >= 60 && candidate.score < 80).length,
        color: distributionColors.Possible,
      },
      {
        name: "Low",
        value: allCandidates.filter((candidate) => candidate.score < 60).length,
        color: distributionColors.Low,
      },
    ],
    recentJobs: allJobs.slice(0, 3),
  };
}

export function getJobSnapshot(jobId: string) {
  throw new Error("getJobSnapshot is now async; use getJobSnapshotAsync");
}

export async function getJobSnapshotAsync(jobId: string, limit = 20) {
  const job = await getJobAsync(jobId);
  if (!job) return undefined;

  return {
    job,
    candidates: (await listCandidatesAsync(jobId)).slice(0, limit),
  };
}
