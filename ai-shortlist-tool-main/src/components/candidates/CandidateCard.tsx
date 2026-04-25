import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Briefcase, GraduationCap, Sparkles, Check, X, Plus } from "lucide-react";
import type { Candidate } from "@/types";
import { ScoreRing, MatchBadge } from "@/components/ui/MatchBadge";
import { cn } from "@/lib/utils";

export function CandidateCard({
  candidate,
  rank,
  selected,
  onToggleSelect,
  canSelect,
}: {
  candidate: Candidate;
  rank: number;
  selected: boolean;
  onToggleSelect: () => void;
  canSelect: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl border bg-surface shadow-soft hover:shadow-elevated transition-all overflow-hidden",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className="hidden sm:flex flex-col items-center justify-center w-10 shrink-0 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rank</span>
            <span className="font-display font-bold text-2xl leading-none">{rank}</span>
          </div>

          {/* Avatar */}
          <div
            className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-base font-semibold text-white"
            style={{ background: `linear-gradient(135deg, hsl(${candidate.avatarHue} 70% 55%), hsl(${(candidate.avatarHue + 40) % 360} 70% 45%))` }}
          >
            {candidate.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-base truncate">{candidate.name}</h3>
                  <MatchBadge score={candidate.score} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{candidate.title}</p>
              </div>
              <ScoreRing score={candidate.score} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />{candidate.location}</span>
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3 w-3" />{candidate.yearsExperience} yrs experience</span>
              <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3 w-3" />{candidate.education}</span>
            </div>

            <p className="text-sm text-foreground/80 mt-3 line-clamp-2">{candidate.summary}</p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {candidate.skills.slice(0, 6).map((s) => (
                <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                  {s}
                </span>
              ))}
              {candidate.skills.length > 6 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                  +{candidate.skills.length - 6}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>

          <button
            onClick={onToggleSelect}
            disabled={!canSelect && !selected}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            {selected ? <><Check className="h-3.5 w-3.5" /> Selected</> : <><Plus className="h-3.5 w-3.5" /> Compare</>}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-gradient-to-br from-primary-soft/40 to-transparent"
          >
            <div className="p-5 grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-success mb-2 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Strengths
                </h4>
                <ul className="space-y-1.5">
                  {candidate.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground/85 flex gap-2">
                      <span className="text-success mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-destructive mb-2 flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5" /> Gaps
                </h4>
                <ul className="space-y-1.5">
                  {candidate.gaps.map((g, i) => (
                    <li key={i} className="text-sm text-foreground/85 flex gap-2">
                      <span className="text-destructive mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sm:col-span-2 rounded-xl bg-surface border border-border p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">AI Recommendation</h4>
                </div>
                <p className="text-sm text-foreground/90">{candidate.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
