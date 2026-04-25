import type { MatchTier } from "@/types";

export const tierFromScore = (score: number): MatchTier =>
  score >= 80 ? "high" : score >= 60 ? "medium" : "low";
