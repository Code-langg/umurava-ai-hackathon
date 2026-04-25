import type { ScreeningAnalytics } from "@/types";

export const emptyAnalytics: ScreeningAnalytics = {
  totalCandidates: 0,
  averageScore: 0,
  topCandidate: null,
  topCandidates: [],
  topSkillGaps: [],
};
