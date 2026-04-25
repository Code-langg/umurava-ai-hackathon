import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Hireloop" },
      { name: "description", content: "Set a new password for your Hireloop account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const tokenParam = search?.get("token") ?? "";
    if (tokenParam) {
      setToken(tokenParam);
      setHasToken(true);
    }
    setReady(true);
  }, []);

  const requestReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiPost<{ success: boolean; message: string }>(
        "/auth/request-reset",
        { email }
      );
      setResetRequested(true);
      setResetToken(null);
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("Reset token is required.");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/auth/reset-password", { token, password });
      toast.success("Password updated successfully. You can now sign in.");
      navigate({ to: "/login" });
    } catch (error) {
      toast.error("Failed to reset password.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-lg font-display font-bold tracking-tight">Reset your password</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Use a reset token from your email or request one for your account.
          </p>

          {!ready ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasToken ? (
            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">New password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                Update password
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground font-semibold text-[13px] hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Request reset token
              </button>
              {resetRequested && (
                <p className="text-sm text-muted-foreground">If your email exists, a reset link has been sent.</p>
              )}
            </form>
          )}

          <p className="mt-5 text-[12px] text-center text-muted-foreground">
            Remembered it?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
