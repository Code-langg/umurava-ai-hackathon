import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User as UserIcon, Mail, Save, Loader2 } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth-context";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Hireloop" },
      { name: "description", content: "Manage your account details and preferences." },
    ],
  }),
  component: ProfilePage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

interface ProfileForm {
  display_name: string;
  job_title: string;
  company: string;
  bio: string;
}

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ display_name: "", job_title: "", company: "", bio: "" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const data = await apiGet<{ profile: ProfileForm | null }>("/profile");
        if (cancelled) return;
        if (data.profile) {
          setForm(data.profile);
        }
      } catch (error) {
        toast.error("Couldn't load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await apiPatch("/profile", form);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const email = user?.email ?? "";
  const initials =
    (form.display_name || email.split("@")[0] || "U")
      .split(/[\s._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">Account settings</p>
        <h1 className="text-xl font-display font-bold tracking-tight">Your profile</h1>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground shadow-glow">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-base truncate">
            {form.display_name || email.split("@")[0]}
          </div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3 w-3" /> {email}
          </div>
        </div>
      </div>

      <form onSubmit={onSave} className="rounded-xl border border-border bg-surface p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <Field label="Display name">
              <input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Sarah Chen"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Job title">
                <input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  placeholder="Senior Recruiter"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <Field label="Company">
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Inc."
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
            </div>
            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell candidates about yourself…"
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </Field>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow hover:opacity-95 transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
        <UserIcon className="h-3 w-3" /> {label}
      </span>
      {children}
    </label>
  );
}
