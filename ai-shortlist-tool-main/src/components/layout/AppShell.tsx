import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
  Bell,
  Search,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api/client";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/jobs/new", label: "Create Job", icon: Sparkles },
  { to: "/candidates/all", label: "Candidates", icon: Users },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard overview",
  "/jobs": "Job postings",
  "/jobs/new": "Create new job",
  "/candidates": "Candidates",
  "/candidates/all": "All candidates",
  "/notifications": "Notifications",
  "/profile": "Profile",
};

function isActiveItem(itemTo: string, pathname: string) {
  if (itemTo === "/") return pathname === "/";
  if (itemTo === "/jobs") return pathname.startsWith("/jobs") && !pathname.startsWith("/jobs/new");
  if (itemTo === "/candidates/all") return pathname.startsWith("/candidates");
  return pathname === itemTo || pathname.startsWith(itemTo + "/");
}

function SidebarContent({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        to="/"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 h-14 border-b border-border/60",
          collapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary shadow-glow shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display font-bold text-sm tracking-tight">Hireloop</div>
            <div className="text-[9px] text-muted-foreground font-medium">AI Talent Screening</div>
          </div>
        )}
      </Link>

      <nav className={cn("flex-1 flex flex-col gap-0.5 overflow-y-auto", collapsed ? "p-1.5" : "p-2.5")}>
        {!collapsed && (
          <div className="px-2.5 pt-2 pb-1.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
            Menu
          </div>
        )}
        {nav.map((item) => {
          const active = isActiveItem(item.to, pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center h-9 rounded-md text-[13px] font-medium transition-all",
                collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2.5px] rounded-r-full bg-primary" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-2.5">
          <div className="rounded-lg bg-gradient-to-br from-primary to-primary/85 p-3 text-primary-foreground relative overflow-hidden">
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <div className="text-[10px] font-semibold opacity-90 uppercase tracking-wider">AI Credits</div>
            </div>
            <div className="text-lg font-display font-bold mt-1">2,847</div>
            <button className="mt-1 text-[10px] font-semibold underline underline-offset-2 opacity-90 hover:opacity-100">
              Upgrade plan
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sidebar-collapsed") === "1";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Live unread notification count
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    let cancelled = false;

    const loadUnread = async () => {
      try {
        const data = await apiGet<{ count: number }>("/notifications/count");
        if (!cancelled) setUnread(data.count ?? 0);
      } catch (error) {
        console.error("Failed to load unread notifications", error);
      }
    };

    loadUnread();

    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/candidates")
      ? "Candidates"
      : pathname.startsWith("/jobs")
        ? "Jobs"
        : "Dashboard");

  const isFixedHeight = pathname === "/candidates";

  const email = user?.email ?? "";
  const initials = email
    ? email
        .split("@")[0]
        .split(/[._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("") || email[0].toUpperCase()
    : "U";
  const displayName = email ? email.split("@")[0] : "Account";

  const desktopWidth = collapsed ? "lg:w-[64px]" : "lg:w-[208px]";

  return (
    <div className={cn("flex w-full bg-secondary/30", isFixedHeight ? "min-h-screen lg:h-screen lg:overflow-hidden" : "min-h-screen")}>
      {/* Static desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col border-r border-border bg-surface h-screen sticky top-0 transition-[width] duration-200",
          desktopWidth,
        )}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-[240px] flex-col bg-surface border-r border-border animate-in slide-in-from-left duration-200">
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 backdrop-blur-xl px-3 lg:px-5">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sm">Hireloop</span>
          </div>

          <h1 className="hidden lg:block text-[13px] font-semibold text-foreground/80 ml-1">{title}</h1>

          <div className="flex-1 max-w-sm hidden md:block lg:ml-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                className="w-full h-8 pl-8 pr-3 rounded-md bg-secondary/60 border border-transparent text-[13px] focus:outline-none focus:border-ring focus:bg-surface transition"
              />
            </div>
          </div>

          <div className="hidden md:block flex-1" />
          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary transition text-muted-foreground hover:text-foreground"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/notifications"
              className="relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary transition"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 pl-2 md:pl-2.5 md:border-l md:border-border">
              <Link to="/profile" className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="hidden sm:block leading-tight max-w-[140px] truncate">
                  <div className="text-[12px] font-semibold truncate group-hover:text-primary transition">{displayName}</div>
                  <div className="text-[10px] text-muted-foreground">Recruiter</div>
                </div>
              </Link>
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className={cn("flex-1 min-h-0", isFixedHeight ? "lg:overflow-hidden p-3 lg:p-4" : "p-3 sm:p-4 lg:p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
