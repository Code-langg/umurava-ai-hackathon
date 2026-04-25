import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Plus,
  Briefcase,
  GraduationCap,
  FileText,
} from "lucide-react";
import { useCreateJob, useSkills } from "@/lib/api/hooks";
import { RouteError } from "@/components/feedback/RouteError";
import { RouteNotFound } from "@/components/feedback/RouteNotFound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs/new")({
  head: () => ({
    meta: [
      { title: "Create job posting - Hireloop" },
      {
        name: "description",
        content:
          "Define a role and Hireloop's AI will surface the best matched candidates automatically.",
      },
    ],
  }),
  component: NewJobPage,
  errorComponent: RouteError,
  notFoundComponent: () => <RouteNotFound />,
});

const steps = [
  { id: 1, name: "Basics", icon: FileText },
  { id: 2, name: "Skills", icon: Sparkles },
  { id: 3, name: "Experience", icon: Briefcase },
  { id: 4, name: "Education", icon: GraduationCap },
];

const experienceYearsMap: Record<string, number> = {
  "Entry (0-2 yrs)": 0,
  "Mid (3-5 yrs)": 3,
  "Senior (6-9 yrs)": 6,
  "Staff / Principal (10+ yrs)": 10,
};

function NewJobPage() {
  const navigate = useNavigate();
  const createJob = useCreateJob();
  const { data: skillSuggestions = [] } = useSkills();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    title: "",
    description: "",
    skills: [] as string[],
    experience: "",
    educationLevel: "",
    educationField: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSkill = (value: string) => {
    const skill = value.trim();
    if (!skill || data.skills.includes(skill)) return;
    setData((current) => ({ ...current, skills: [...current.skills, skill] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) =>
    setData((current) => ({
      ...current,
      skills: current.skills.filter((entry) => entry !== skill),
    }));

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (data.title.trim().length < 3) {
        nextErrors.title = "Job title is required (min 3 chars)";
      }
      if (data.description.trim().length < 20) {
        nextErrors.description = "Description should be at least 20 characters";
      }
    }

    if (step === 2 && data.skills.length < 2) {
      nextErrors.skills = "Add at least 2 required skills";
    }

    if (step === 3 && !data.experience) {
      nextErrors.experience = "Select an experience level";
    }

    if (step === 4 && !data.educationLevel) {
      nextErrors.educationLevel = "Select minimum education level";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = async () => {
    if (!validate()) return;

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    const requiredSkills = data.skills.slice(0, 5);
    const preferredSkills = data.skills.slice(5);
    const screeningJob = {
      title: data.title.trim(),
      description: data.description.trim(),
      requiredSkills,
      preferredSkills,
      minimumExperienceYears: experienceYearsMap[data.experience] ?? 0,
      educationLevel:
        data.educationField.trim().length > 0
          ? `${data.educationLevel} in ${data.educationField.trim()}`
          : data.educationLevel,
    };

    const createdJob = await createJob.mutateAsync({
      ...screeningJob,
      department: "General",
    });

    navigate({
      to: "/candidates",
      search: { jobId: createdJob.id },
    });
  };

  const suggested = skillSuggestions
    .filter((skill) => !data.skills.includes(skill))
    .slice(0, 8);
  const progress = (step / steps.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Step {step} of {steps.length}
        </p>
        <h1 className="text-3xl font-display font-bold tracking-tight mt-1">
          Create a new job posting
        </h1>
        <p className="text-muted-foreground mt-1">
          Hireloop AI will instantly start matching incoming candidates.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-3">
          {steps.map((currentStep, index) => {
            const done = step > currentStep.id;
            const current = step === currentStep.id;

            return (
              <div
                key={currentStep.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                      done && "bg-success text-success-foreground",
                      current &&
                        "bg-primary text-primary-foreground shadow-glow ring-4 ring-primary/15",
                      !done && !current && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <currentStep.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] mt-1.5 font-medium",
                      current ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {currentStep.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-secondary mx-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-success transition-all duration-500",
                        done ? "w-full" : "w-0",
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <div className="space-y-5">
                <Field label="Job title" error={errors.title}>
                  <input
                    value={data.title}
                    onChange={(event) =>
                      setData({ ...data, title: event.target.value })
                    }
                    placeholder="e.g. Senior Frontend Engineer"
                    className="input"
                  />
                </Field>
                <Field
                  label="Job description"
                  error={errors.description}
                  hint="Describe the role, responsibilities, and what makes it unique."
                >
                  <textarea
                    value={data.description}
                    onChange={(event) =>
                      setData({ ...data, description: event.target.value })
                    }
                    rows={6}
                    placeholder="We're looking for an experienced engineer to lead..."
                    className="input resize-none"
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <Field
                  label="Required skills"
                  error={errors.skills}
                  hint="Press Enter or comma to add. AI uses these to rank candidates."
                >
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background min-h-[48px] focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring">
                    {data.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-md"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:opacity-80"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={skillInput}
                      onChange={(event) => setSkillInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          addSkill(skillInput);
                        } else if (
                          event.key === "Backspace" &&
                          !skillInput &&
                          data.skills.length
                        ) {
                          removeSkill(data.skills[data.skills.length - 1]);
                        }
                      }}
                      placeholder={
                        data.skills.length ? "" : "Type a skill and press Enter"
                      }
                      className="flex-1 min-w-[120px] bg-transparent text-sm outline-none px-1"
                    />
                  </div>
                </Field>

                {suggested.length > 0 && (
                  <div className="rounded-xl border border-dashed border-primary/30 bg-primary-soft/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        AI suggestions for this role
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggested.map((skill) => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md bg-surface border border-border text-xs font-medium px-2.5 py-1 hover:border-primary hover:text-primary transition"
                        >
                          <Plus className="h-3 w-3" /> {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <Field label="Experience level" error={errors.experience}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.keys(experienceYearsMap).map((option) => (
                    <button
                      key={option}
                      onClick={() => setData({ ...data, experience: option })}
                      type="button"
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all",
                        data.experience === option
                          ? "border-primary bg-primary-soft"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <div className="font-semibold text-sm">{option}</div>
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <Field label="Minimum education" error={errors.educationLevel}>
                  <select
                    value={data.educationLevel}
                    onChange={(event) =>
                      setData({ ...data, educationLevel: event.target.value })
                    }
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option>No requirement</option>
                    <option>High School</option>
                    <option>Bachelor&apos;s degree</option>
                    <option>Master&apos;s degree</option>
                    <option>PhD</option>
                  </select>
                </Field>
                <Field label="Field of study (optional)">
                  <input
                    value={data.educationField}
                    onChange={(event) =>
                      setData({ ...data, educationField: event.target.value })
                    }
                    placeholder="e.g. Computer Science"
                    className="input"
                  />
                </Field>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1}
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={createJob.isPending}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-glow hover:opacity-95 transition disabled:opacity-60"
          >
            {step === 4 && createJob.isPending ? "Publishing..." : step === 4 ? "Publish & continue" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.625rem;
          border: 1px solid var(--input);
          background: var(--background);
          font-size: 0.875rem;
          color: var(--foreground);
          transition: all 150ms;
        }

        .input:focus {
          outline: none;
          border-color: var(--ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 20%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label}</label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive mt-1.5 font-medium">{error}</p>
      )}
    </div>
  );
}
