import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Hireloop" },
      { name: "description", content: "Sign in to your Hireloop recruiter account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    // For now, just show a message since we don't have email functionality
    toast.info("Password reset functionality will be available soon");
    setForgotLoading(false);
    setForgotOpen(false);
    setForgotEmail("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/40 via-background to-primary-soft/30 px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-base tracking-tight">Hireloop</div>
            <div className="text-[10px] text-muted-foreground font-medium">AI Talent Screening</div>
          </div>
        </Link>

        <div className="rounded-xl border border-border bg-surface shadow-sm p-6">
          <h1 className="text-lg font-display font-bold tracking-tight">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Sign in to continue screening candidates.</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="mt-5 text-[12px] text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setForgotOpen(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-display font-bold tracking-tight">Reset your password</h2>
                <p className="text-[12px] text-muted-foreground mt-1">We'll email you a secure link to reset it.</p>
              </div>
              <button type="button" onClick={() => setForgotOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={onForgot} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
