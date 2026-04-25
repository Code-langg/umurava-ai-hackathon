import { motion } from "framer-motion";
import { X, Check, Minus } from "lucide-react";
import type { Candidate } from "@/types";
import { ScoreRing } from "@/components/ui/MatchBadge";
import { cn } from "@/lib/utils";

export function ComparisonView({
  candidates,
  onClose,
  onRemove,
}: {
  candidates: Candidate[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills)));

  const Row = ({ label, render }: { label: string; render: (c: Candidate) => React.ReactNode }) => (
    <div className="grid border-t border-border" style={{ gridTemplateColumns: `180px repeat(${candidates.length}, 1fr)` }}>
      <div className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/30">{label}</div>
      {candidates.map((c) => (
        <div key={c.id} className="p-4 border-l border-border text-sm">{render(c)}</div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl shadow-elevated max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-xl">Side-by-side comparison</h2>
            <p className="text-sm text-muted-foreground">Reviewing {candidates.length} candidates</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {/* Headers */}
          <div className="grid sticky top-0 bg-surface z-10" style={{ gridTemplateColumns: `180px repeat(${candidates.length}, 1fr)` }}>
            <div className="p-4 bg-secondary/30" />
            {candidates.map((c) => (
              <div key={c.id} className="p-5 border-l border-border relative">
                <button
                  onClick={() => onRemove(c.id)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-col items-center text-center">
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-semibold text-white mb-3"
                    style={{ background: `linear-gradient(135deg, hsl(${c.avatarHue} 70% 55%), hsl(${(c.avatarHue + 40) % 360} 70% 45%))` }}
                  >
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <h3 className="font-display font-semibold text-sm">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.title}</p>
                </div>
              </div>
            ))}
          </div>

          <Row label="AI Match Score" render={(c) => <div className="flex justify-center"><ScoreRing score={c.score} size={64} /></div>} />
          <Row label="Experience" render={(c) => <span className="font-medium">{c.yearsExperience} years</span>} />
          <Row label="Location" render={(c) => c.location} />
          <Row label="Education" render={(c) => <span className="text-xs">{c.education}</span>} />

          <Row
            label="Skills Match"
            render={(c) => (
              <div className="space-y-1.5">
                {allSkills.slice(0, 8).map((skill) => {
                  const has = c.skills.includes(skill);
                  return (
                    <div key={skill} className="flex items-center gap-2 text-xs">
                      <span className={cn("h-4 w-4 rounded flex items-center justify-center", has ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                        {has ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </span>
                      <span className={cn(has ? "font-medium" : "text-muted-foreground")}>{skill}</span>
                    </div>
                  );
                })}
              </div>
            )}
          />

          <Row
            label="Strengths"
            render={(c) => (
              <ul className="space-y-1 text-xs">
                {c.strengths.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-success">+</span>{s}</li>)}
              </ul>
            )}
          />
          <Row
            label="Gaps"
            render={(c) => (
              <ul className="space-y-1 text-xs">
                {c.gaps.map((g, i) => <li key={i} className="flex gap-1.5"><span className="text-destructive">−</span>{g}</li>)}
              </ul>
            )}
          />
          <Row
            label="Recommendation"
            render={(c) => <p className="text-xs text-foreground/85">{c.recommendation}</p>}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
