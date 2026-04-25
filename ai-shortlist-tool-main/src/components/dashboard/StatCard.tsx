import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="group rounded-xl border border-border bg-surface p-4 hover:border-primary/30 hover:shadow-card transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", accentMap[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        {delta && (
          <div className={cn("flex items-center gap-0.5 text-[11px] font-semibold", delta.positive ? "text-success" : "text-destructive")}>
            {delta.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta.value}
          </div>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
      <div className="text-2xl font-display font-bold tracking-tight mt-0.5">{value}</div>
    </div>
  );
}
