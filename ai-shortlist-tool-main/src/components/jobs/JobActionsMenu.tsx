import { useState } from "react";
import { MoreVertical, CheckCircle2, PauseCircle, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateJobStatus } from "@/lib/api/hooks";
import type { JobPosting } from "@/types";
import { toast } from "sonner";

export function JobActionsMenu({
  job,
  align = "end",
  size = "sm",
}: {
  job: JobPosting;
  align?: "start" | "end";
  size?: "sm" | "md";
}) {
  const [confirm, setConfirm] = useState<null | { status: JobPosting["status"]; label: string }>(null);
  const updateJobStatus = useUpdateJobStatus();

  const apply = async () => {
    if (!confirm) return;
    await updateJobStatus.mutateAsync({ jobId: job.id, status: confirm.status });
    toast.success(`Job ${confirm.label.toLowerCase()}`, { description: job.title });
    setConfirm(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="Job actions"
            className={
              size === "md"
                ? "h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-surface hover:bg-secondary transition"
                : "h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
            }
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          {job.status !== "active" && (
            <DropdownMenuItem onSelect={() => setConfirm({ status: "active", label: "Activated" })}>
              <CheckCircle2 className="h-4 w-4 mr-2 text-success" /> Activate
            </DropdownMenuItem>
          )}
          {job.status === "active" && (
            <DropdownMenuItem onSelect={() => setConfirm({ status: "draft", label: "Deactivated" })}>
              <PauseCircle className="h-4 w-4 mr-2 text-warning-foreground" /> Deactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirm({ status: "closed", label: "Archived" })}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="h-4 w-4 mr-2" /> Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.label.replace(/d$/, "")} this job?</AlertDialogTitle>
            <AlertDialogDescription>
              "{job.title}" will be marked as <strong>{confirm?.status}</strong>.
              {confirm?.status === "draft" && " Candidates won't be able to apply until you reactivate."}
              {confirm?.status === "closed" && " This hides the posting from active lists."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={apply}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
