import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, Loader2, Inbox } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Hireloop" },
      { name: "description", content: "Recent activity and alerts across your hiring pipeline." },
    ],
  }),
  component: NotificationsPage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiGet<{ notifications: Notification[] }>("/notifications");
        if (cancelled) return;
        setItems(data.notifications ?? []);
      } catch (error) {
        toast.error("Couldn't load notifications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      await apiPost("/notifications/mark-all-read", {});
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const toggleRead = async (n: Notification) => {
    const next = !n.read;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: next } : x)));
    try {
      await apiPatch(`/notifications/${n.id}`, { read: next });
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiDelete(`/notifications/${id}`);
    } catch (error) {
      toast.error("Failed to remove notification");
    }
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">{unread} unread</p>
          <h1 className="text-xl font-display font-bold tracking-tight">Notifications</h1>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-sm">You're all caught up</p>
            <p className="text-xs text-muted-foreground mt-1">New activity will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "px-4 py-3 flex gap-3 items-start group transition",
                  !n.read && "bg-primary-soft/20",
                )}
              >
                <button
                  onClick={() => toggleRead(n)}
                  aria-label={n.read ? "Mark unread" : "Mark read"}
                  className={cn(
                    "mt-1 h-2 w-2 rounded-full shrink-0 transition",
                    n.read ? "bg-muted hover:bg-primary/60" : "bg-primary",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                        n.type === "success" && "bg-success/10 text-success",
                        n.type === "warning" && "bg-warning/15 text-warning-foreground",
                        n.type === "info" && "bg-primary/10 text-primary",
                        n.type === "error" && "bg-destructive/10 text-destructive",
                      )}
                    >
                      {n.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mt-0.5">{n.title}</h3>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  {n.link && (
                    <Link to={n.link} className="text-[11px] font-semibold text-primary hover:underline mt-1 inline-block">
                      View →
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => remove(n.id)}
                  aria-label="Delete notification"
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && items.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center inline-flex items-center gap-1.5 justify-center w-full">
          <Bell className="h-3 w-3" /> Showing {items.length} notification{items.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
