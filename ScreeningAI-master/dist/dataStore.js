"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillSuggestions = void 0;
exports.createJob = createJob;
exports.createJobAsync = createJobAsync;
exports.listJobs = listJobs;
exports.listJobsAsync = listJobsAsync;
exports.getJob = getJob;
exports.getJobAsync = getJobAsync;
exports.updateJobStatus = updateJobStatus;
exports.updateJobStatusAsync = updateJobStatusAsync;
exports.listCandidates = listCandidates;
exports.listCandidatesAsync = listCandidatesAsync;
exports.storeScreeningResults = storeScreeningResults;
exports.storeScreeningResultsAsync = storeScreeningResultsAsync;
exports.getDashboardSummary = getDashboardSummary;
exports.getDashboardSummaryAsync = getDashboardSummaryAsync;
exports.getJobSnapshot = getJobSnapshot;
exports.getJobSnapshotAsync = getJobSnapshotAsync;
const db_1 = require("./db");
exports.skillSuggestions = [
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
};
function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function relativeTime(date) {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMinutes < 1)
        return "Just now";
    if (diffMinutes < 60)
        return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7)
        return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
}
function avatarHue(value) {
    return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
}
function createCandidateTitle(skills) {
    if (skills.length === 0)
        return "Candidate profile";
    return `${skills.slice(0, 2).join(" / ")} specialist`;
}
function cloneJob(job) {
    return {
        ...job,
        postedAt: relativeTime(new Date(job.createdAt)),
    };
}
function createJob(job) {
    const createdAt = new Date().toISOString();
    const nextJob = {
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
async function createJobAsync(job) {
    const createdAt = new Date().toISOString();
    const nextJob = {
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
    const jobsCollection = await (0, db_1.getJobsCollection)();
    await jobsCollection.insertOne(nextJob);
    return cloneJob(nextJob);
}
function listJobs() {
    throw new Error("listJobs is now async; use listJobsAsync");
}
async function listJobsAsync() {
    const jobsCollection = await (0, db_1.getJobsCollection)();
    const jobs = (await jobsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray());
    return jobs.map(cloneJob);
}
function getJob(jobId) {
    throw new Error("getJob is now async; use getJobAsync");
}
async function getJobAsync(jobId) {
    const jobsCollection = await (0, db_1.getJobsCollection)();
    const job = (await jobsCollection.findOne({ id: jobId }));
    return job ? cloneJob(job) : undefined;
}
function updateJobStatus(jobId, status) {
    throw new Error("updateJobStatus is now async; use updateJobStatusAsync");
}
async function updateJobStatusAsync(jobId, status) {
    const jobsCollection = await (0, db_1.getJobsCollection)();
    const updated = await jobsCollection.findOneAndUpdate({ id: jobId }, { $set: { status } }, { returnDocument: "after" });
    if (!updated)
        return undefined;
    return cloneJob(updated);
}
function listCandidates(jobId) {
    throw new Error("listCandidates is now async; use listCandidatesAsync");
}
async function listCandidatesAsync(jobId) {
    const candidatesCollection = await (0, db_1.getCandidatesCollection)();
    const filter = jobId ? { jobId } : {};
    return (await candidatesCollection.find(filter).sort({ score: -1 }).toArray());
}
function storeScreeningResults(jobId, rawCandidates, results) {
    throw new Error("storeScreeningResults is now async; use storeScreeningResultsAsync");
}
async function storeScreeningResultsAsync(jobId, rawCandidates, results) {
    const candidatesCollection = await (0, db_1.getCandidatesCollection)();
    const mappedCandidates = results.map((result) => {
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
    const jobsCollection = await (0, db_1.getJobsCollection)();
    await jobsCollection.updateOne({ id: jobId }, {
        $set: {
            applicants: mergedCandidates.length,
            screened: mergedCandidates.length,
            topMatches: mergedCandidates.filter((candidate) => candidate.score >= 80).length,
        },
    });
    return mergedCandidates;
}
function getDashboardSummary() {
    throw new Error("getDashboardSummary is now async; use getDashboardSummaryAsync");
}
async function getDashboardSummaryAsync() {
    const allCandidates = await listCandidatesAsync();
    const allJobs = await listJobsAsync();
    const applicants = allJobs.reduce((sum, job) => sum + job.applicants, 0);
    const aiScreened = allJobs.reduce((sum, job) => sum + job.screened, 0);
    const topMatches = allCandidates.filter((candidate) => candidate.score >= 80).length;
    const averageScore = allCandidates.length > 0
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
function getJobSnapshot(jobId) {
    throw new Error("getJobSnapshot is now async; use getJobSnapshotAsync");
}
async function getJobSnapshotAsync(jobId, limit = 20) {
    const job = await getJobAsync(jobId);
    if (!job)
        return undefined;
    return {
        job,
        candidates: (await listCandidatesAsync(jobId)).slice(0, limit),
    };
}
