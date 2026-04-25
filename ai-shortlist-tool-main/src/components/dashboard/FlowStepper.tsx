import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowStep {
  step: number;
  label: string;
  icon: LucideIcon;
  to: string;
  done?: boolean;
  current?: boolean;
}

export function FlowStepper({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-1.5 py-1.5 shadow-sm overflow-x-auto max-w-full no-scrollbar">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.step} className="flex items-center gap-1 shrink-0">
            <Link
              to={s.to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition shrink-0",
                s.current && "bg-primary text-primary-foreground shadow-glow",
                s.done && !s.current && "text-success hover:bg-success/10",
                !s.done && !s.current && "text-muted-foreground hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0",
                  s.current && "bg-white/25",
                  s.done && !s.current && "bg-success/15",
                  !s.done && !s.current && "bg-secondary",
                )}
              >
                {s.step}
              </span>
              <Icon className="h-3 w-3 shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">{s.label}</span>
            </Link>
            {i < steps.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
