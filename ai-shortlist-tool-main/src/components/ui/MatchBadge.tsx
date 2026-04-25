import { tierFromScore } from "@/lib/data/candidates";
import { cn } from "@/lib/utils";

export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const tier = tierFromScore(score);
  const styles = {
    high: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/15 text-warning-foreground border-warning/30",
    low: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const label = { high: "Strong match", medium: "Possible match", low: "Low match" }[tier];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", styles[tier], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const tier = tierFromScore(score);
  const color = tier === "high" ? "var(--success)" : tier === "medium" ? "var(--warning)" : "var(--destructive)";
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-base leading-none">{score}</span>
        <span className="text-[9px] text-muted-foreground leading-none mt-0.5">match</span>
      </div>
    </div>
  );
}
