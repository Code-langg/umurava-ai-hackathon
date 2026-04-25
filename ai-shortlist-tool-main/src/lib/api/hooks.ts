import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiForm, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  Candidate,
  DashboardSummary,
  JobPosting,
  ScreeningAnalytics,
  ScreeningJob,
} from "@/types";

type JobsResponse = { success: boolean; jobs: JobPosting[] };
type JobResponse = { success: boolean; job: JobPosting; candidates: Candidate[] };
type DashboardResponse = { success: boolean; dashboard: DashboardSummary };
type CandidatesResponse = { success: boolean; candidates: Candidate[] };
type SkillsResponse = { success: boolean; skills: string[] };
type CreateJobResponse = { success: boolean; job: JobPosting };
type UpdateJobResponse = { success: boolean; job: JobPosting };
type ScreenResponse = {
  success: boolean;
  candidates: Candidate[];
  analytics: ScreeningAnalytics;
};

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  jobs: ["jobs"] as const,
  job: (jobId: string) => ["jobs", jobId] as const,
  candidates: (jobId?: string) =>
    jobId ? (["candidates", jobId] as const) : (["candidates"] as const),
  skills: ["skills"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await apiGet<DashboardResponse>("/dashboard")).dashboard,
  });
}

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: async () => (await apiGet<JobsResponse>("/jobs")).jobs,
    placeholderData: keepPreviousData,
  });
}

export function useJob(jobId?: string) {
  return useQuery({
    queryKey: queryKeys.job(jobId || "missing"),
    enabled: Boolean(jobId),
    queryFn: async () => await apiGet<JobResponse>(`/jobs/${jobId}`),
  });
}

export function useCandidates(jobId?: string) {
  const suffix = jobId ? `?jobId=${encodeURIComponent(jobId)}` : "";

  return useQuery({
    queryKey: queryKeys.candidates(jobId),
    queryFn: async () => (await apiGet<CandidatesResponse>(`/candidates${suffix}`)).candidates,
    placeholderData: keepPreviousData,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills,
    queryFn: async () => (await apiGet<SkillsResponse>("/skills")).skills,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: ScreeningJob) =>
      (await apiPost<CreateJobResponse>("/jobs", job)).job,
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.setQueryData(queryKeys.job(job.id), {
        success: true,
        job,
        candidates: [],
      } satisfies JobResponse);
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      status,
    }: {
      jobId: string;
      status: JobPosting["status"];
    }) =>
      (
        await apiPatch<UpdateJobResponse>(`/jobs/${jobId}/status`, {
          status,
        })
      ).job,
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.job(job.id) });
    },
  });
}

export function useScreenCandidates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      job,
      file,
    }: {
      jobId: string;
      job: ScreeningJob;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("job", JSON.stringify(job));
      formData.append("files", file);

      return await apiForm<ScreenResponse>("/screen", formData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      queryClient.invalidateQueries({ queryKey: queryKeys.job(variables.jobId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.candidates(variables.jobId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates() });
    },
  });
}
