import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatAccent = "primary" | "success" | "warning" | "destructive";

const accentMap: Record<StatAccent, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatBlock({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: StatAccent;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 hover:border-primary/30 transition">
      <div className="flex items-center gap-2">
        <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", accentMap[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground font-medium leading-tight truncate">{label}</div>
          <div className="text-base font-display font-bold leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}
