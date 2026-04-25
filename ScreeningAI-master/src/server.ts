import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import session from "express-session";
import { randomUUID } from "crypto";

import { screenCandidates } from "./screeningService";
import { Job, Candidate } from "./types";
import { parseCSV } from "./utils/csvParser";
import { parseXLSX } from "./utils/xlsxParser";
import { extractTextFromPDF } from "./utils/pdfParser";
import { extractCandidateFromResumeText } from "./services/extractCandidateFromResume";
import { AuthService, AuthUser } from "./authService";
import {
  createJobAsync,
  getDashboardSummaryAsync,
  getJobSnapshotAsync,
  listCandidatesAsync,
  listJobsAsync,
  skillSuggestions,
  storeScreeningResultsAsync,
  updateJobStatusAsync,
} from "./dataStore";
import { connectToDatabase, getNotificationsCollection, getProfilesCollection } from "./db";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);
const TOP_CANDIDATES_LIMIT = Number(process.env.TOP_CANDIDATES_LIMIT ?? 20);

const upload = multer({ storage: multer.memoryStorage() });

type NotificationType = "success" | "warning" | "info" | "error";

type NotificationRecord = {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type ProfileRecord = {
  userId: number;
  display_name: string;
  job_title: string;
  company: string;
  bio: string;
};

const createNotification = async (userId: number, title: string, body: string | null = null, link: string | null = null, type: NotificationType = "info") => {
  const notifications = await getNotificationsCollection();
  await notifications.insertOne({
    id: randomUUID(),
    userId,
    type,
    title,
    body,
    link,
    read: false,
    createdAt: new Date().toISOString()
  });
};

const getUserProfile = async (userId: number) => {
  const profiles = await getProfilesCollection();
  return profiles.findOne({ userId }) as Promise<ProfileRecord | null>;
};

const upsertUserProfile = async (userId: number, profileData: Omit<ProfileRecord, "userId">) => {
  const profiles = await getProfilesCollection();
  await profiles.updateOne(
    { userId },
    { $set: { userId, ...profileData } },
    { upsert: true }
  );
  return (await profiles.findOne({ userId })) as ProfileRecord;
};

// Authentication middleware
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const user = await AuthService.verifyToken(token);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  req.user = user;
  next();
};

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "AI Screening API is running"
  });
});

/* -------------------- AUTHENTICATION ENDPOINTS -------------------- */
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const result = await AuthService.register({ email, password, name });

    if (!result.success) {
      return res.status(400).json(result);
    }

    if (result.user) {
      createNotification(
        result.user.id,
        "Welcome to Hireloop",
        "Your account is ready. Start screening candidates from the dashboard.",
        "/",
        "success"
      );
    }

    res.json(result);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const result = await AuthService.login({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user
  });
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

app.post("/api/auth/request-reset", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const result = await AuthService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ success: false, message: "Password reset request failed" });
  }
});

app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and password are required" });
    }

    const result = await AuthService.resetPassword(token, password);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
});

app.get("/api/profile", requireAuth, async (req: Request, res: Response) => {
  const profile = await getUserProfile(req.user!.id);
  res.json({ success: true, profile: profile ?? null });
});

app.patch("/api/profile", requireAuth, async (req: Request, res: Response) => {
  const { display_name, job_title, company, bio } = req.body;
  if (typeof display_name !== "string" || typeof job_title !== "string" || typeof company !== "string" || typeof bio !== "string") {
    return res.status(400).json({ success: false, message: "Invalid profile payload" });
  }

  const profile = await upsertUserProfile(req.user!.id, { display_name, job_title, company, bio });
  res.json({ success: true, profile });
});

app.get("/api/notifications/count", requireAuth, async (req: Request, res: Response) => {
  const notifications = await getNotificationsCollection();
  const count = await notifications.countDocuments({ userId: req.user!.id, read: false });
  res.json({ success: true, count });
});

app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
  const notifications = await getNotificationsCollection();
  const userNotifications = await notifications
    .find({ userId: req.user!.id })
    .sort({ createdAt: -1 })
    .toArray();

  res.json({ success: true, notifications: userNotifications });
});

app.patch("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { read } = req.body;
  const notifications = await getNotificationsCollection();
  const notification = await notifications.findOne({ id, userId: req.user!.id });
  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  if (typeof read === "boolean") {
    await notifications.updateOne({ id, userId: req.user!.id }, { $set: { read } });
  }
  res.json({ success: true, notification: await notifications.findOne({ id, userId: req.user!.id }) });
});

app.post("/api/notifications/mark-all-read", requireAuth, async (req: Request, res: Response) => {
  const notifications = await getNotificationsCollection();
  await notifications.updateMany({ userId: req.user!.id }, { $set: { read: true } });
  res.json({ success: true });
});

app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const notifications = await getNotificationsCollection();
  const result = await notifications.deleteOne({ id, userId: req.user!.id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  res.json({ success: true });
});

app.get("/api/skills", requireAuth, (_req: Request, res: Response) => {
  res.json({
    success: true,
    skills: skillSuggestions
  });
});

app.get("/api/jobs", requireAuth, async (_req: Request, res: Response) => {
  res.json({
    success: true,
    jobs: await listJobsAsync()
  });
});

app.get("/api/jobs/:jobId", requireAuth, async (req: Request, res: Response) => {
  const jobId =
    typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId[0];
  const snapshot = await getJobSnapshotAsync(jobId, TOP_CANDIDATES_LIMIT);

  if (!snapshot) {
    return res.status(404).json({
      success: false,
      message: "Job not found"
    });
  }

  return res.json({
    success: true,
    ...snapshot
  });
});

app.post("/api/jobs", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      requiredSkills = [],
      preferredSkills = [],
      minimumExperienceYears = 0,
      educationLevel = "No requirement",
      description = "",
      department = "General"
    } = req.body ?? {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        success: false,
        message: "title is required"
      });
    }

    const job = await createJobAsync({
      title,
      requiredSkills,
      preferredSkills,
      minimumExperienceYears: Number(minimumExperienceYears) || 0,
      educationLevel,
      description,
      department,
      status: "active"
    });

    return res.status(201).json({
      success: true,
      job
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.patch("/api/jobs/:jobId/status", requireAuth, async (req: Request, res: Response) => {
  const { status } = req.body ?? {};

  if (!["active", "draft", "closed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  const jobId =
    typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId[0];
  const job = await updateJobStatusAsync(jobId, status);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found"
    });
  }

  return res.json({
    success: true,
    job
  });
});

app.get("/api/candidates", requireAuth, async (req: Request, res: Response) => {
  const jobId =
    typeof req.query.jobId === "string" ? req.query.jobId : undefined;

  return res.json({
    success: true,
    candidates: (await listCandidatesAsync(jobId)).slice(0, TOP_CANDIDATES_LIMIT)
  });
});

app.get("/api/dashboard", requireAuth, async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    dashboard: await getDashboardSummaryAsync()
  });
});

/* -------------------- SCREEN ENDPOINT -------------------- */
app.post(
  "/api/screen",
  requireAuth,
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      let rawJob = req.body.job as Job | string | undefined;
      let rawCandidates = req.body.candidates as Candidate[] | string | undefined;
      const jobId =
        typeof req.body.jobId === "string" ? req.body.jobId : undefined;

      // Parse job
      if (typeof rawJob === "string") {
        rawJob = JSON.parse(rawJob);
      }

      // Parse candidates (if provided manually)
      if (typeof rawCandidates === "string") {
        rawCandidates = JSON.parse(rawCandidates);
      }

      let candidates: Candidate[] | undefined = Array.isArray(rawCandidates)
        ? rawCandidates
        : undefined;

      const files = Array.isArray(req.files) ? req.files : undefined;

      if (files && files.length > 0) {
        // Validate files
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: `File too large: ${file.originalname}`
            });
          }
        }

        const allowedExtensions = [".csv", ".xlsx", ".xls", ".pdf"];

        for (const file of files) {
          const ext = path.extname(file.originalname).toLowerCase();
          if (!allowedExtensions.includes(ext)) {
            return res.status(400).json({
              success: false,
              message: `Unsupported file format: ${file.originalname}`
            });
          }
        }

        // If no candidates passed manually, extract from files
        if (!candidates || candidates.length === 0) {
          const firstExt = path.extname(files[0].originalname).toLowerCase();

          // CSV
          if (firstExt === ".csv") {
            const csvText = files[0].buffer.toString("utf-8");
            candidates = parseCSV(csvText);
          }

          // Excel
          else if (firstExt === ".xlsx" || firstExt === ".xls") {
            candidates = parseXLSX(files[0].buffer);
          }

          // PDF resumes (multiple)
          else if (firstExt === ".pdf") {
            const pdfFiles = files.filter(
              (f) => path.extname(f.originalname).toLowerCase() === ".pdf"
            );

            const extracted: Candidate[] = [];

            for (let i = 0; i < pdfFiles.length; i++) {
              const file = pdfFiles[i];

              const text = await extractTextFromPDF(file.buffer);
              console.log(`PDF TEXT [${file.originalname}]`, text);

              const candidate = await extractCandidateFromResumeText(
                text,
                `pdf-${i + 1}`
              );

              extracted.push(candidate);
            }

            candidates = extracted;
          }
        }
      }

      // Final validation
      if (
        !rawJob ||
        typeof rawJob === "string" ||
        !candidates ||
        candidates.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Job + candidates (or files) are required"
        });
      }

      const job: Job = rawJob;

      const { results, shortlist } = await screenCandidates(job, candidates, TOP_CANDIDATES_LIMIT);
      const analytics = {
        totalCandidates: results.length,
        averageScore:
          results.length > 0
            ? Number(
                (
                  results.reduce((sum, candidate) => sum + candidate.score, 0) /
                  results.length
                ).toFixed(2)
              )
            : 0,
        topCandidate: results[0] ?? null,
        topCandidates: results.slice(0, TOP_CANDIDATES_LIMIT),
        topSkillGaps: Object.entries(
          results.reduce<Record<string, number>>((acc, result) => {
            for (const gap of result.criticalGaps) {
              acc[gap] = (acc[gap] ?? 0) + 1;
            }
            return acc;
          }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      };

      const storedCandidates =
        jobId && rawJob ? await storeScreeningResultsAsync(jobId, candidates, results) : undefined;

      return res.json({
        success: true,
        candidates: storedCandidates,
        results,
        shortlist,
        analytics
      });
    } catch (error) {
      console.error("Screening API error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to screen candidates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/* -------------------- ANALYTICS ENDPOINT (NEW) -------------------- */
app.post("/api/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: "results array is required"
      });
    }

    const totalCandidates = results.length;

    const averageScore =
      results.reduce((sum, c) => sum + (c.score || 0), 0) / totalCandidates;

    const topCandidate = results[0];
    const topCandidates = results.slice(0, TOP_CANDIDATES_LIMIT);

    const gapMap: Record<string, number> = {};

    results.forEach((c) => {
      (c.criticalGaps || []).forEach((gap: string) => {
        gapMap[gap] = (gapMap[gap] || 0) + 1;
      });
    });

    const topSkillGaps = Object.entries(gapMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return res.json({
      success: true,
      analytics: {
        totalCandidates,
        averageScore: Number(averageScore.toFixed(2)),
        topCandidate,
        topCandidates,
        topSkillGaps
      }
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze results"
    });
  }
});

/* -------------------- START SERVER -------------------- */
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
