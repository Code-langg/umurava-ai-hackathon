export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
};

export type Job = {
  id?: string;
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperienceYears: number;
  educationLevel: string;
  description: string;
  department?: string;
  status?: "active" | "draft" | "closed";
};

export type Candidate = {
  id: string;
  name: string;
  skills: string[];
  experienceYears: number;
  educationLevel: string;
  summary: string;
};

export type AIResult = {
  candidateId: string;
  name: string;
  score: number;
  rank: number;
  decision: "Shortlist" | "Reject";
  strengths: string[];
  criticalGaps: string[];
  minorGaps: string[];
  whyShortlisted: string;
  recommendation: string;
  scoreBreakdown: {
    skills: number;
    experience: number;
    education: number;
    fit: number;
  };
};

export type FrontendCandidate = {
  id: string;
  jobId: string;
  name: string;
  title: string;
  email: string;
  location: string;
  yearsExperience: number;
  score: number;
  skills: string[];
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  education: string;
  avatarHue: number;
};

export type JobRecord = Job & {
  id: string;
  department: string;
  applicants: number;
  screened: number;
  topMatches: number;
  postedAt: string;
  createdAt: string;
  status: "active" | "draft" | "closed";
};

export type DashboardSummary = {
  applicants: number;
  aiScreened: number;
  topMatches: number;
  averageScore: number;
  unscreenedCandidates: number;
  distribution: Array<{
    name: "Strong" | "Possible" | "Low";
    value: number;
    color: string;
  }>;
  recentJobs: JobRecord[];
};
