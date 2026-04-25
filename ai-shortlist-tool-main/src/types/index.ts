export type MatchTier = "high" | "medium" | "low";

export interface Candidate {
  id: string;
  jobId?: string;
  name: string;
  title: string;
  email: string;
  location: string;
  yearsExperience: number;
  score: number; // 0-100
  skills: string[];
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  education: string;
  avatarHue: number;
}

export interface ScreeningJob {
  id?: string;
  department?: string;
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperienceYears: number;
  educationLevel: string;
  description: string;
}

export interface ScreeningAnalytics {
  totalCandidates: number;
  averageScore: number;
  topCandidate: Candidate | null;
  topCandidates: Candidate[];
  topSkillGaps: Array<[string, number]>;
}

export interface DashboardSummary {
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
  recentJobs: JobPosting[];
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  applicants: number;
  screened: number;
  topMatches: number;
  postedAt: string;
  status: "active" | "draft" | "closed";
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  minimumExperienceYears?: number;
  educationLevel?: string;
}
