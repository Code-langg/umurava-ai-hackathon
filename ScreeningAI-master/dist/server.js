"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = require("crypto");
const screeningService_1 = require("./screeningService");
const csvParser_1 = require("./utils/csvParser");
const xlsxParser_1 = require("./utils/xlsxParser");
const pdfParser_1 = require("./utils/pdfParser");
const extractCandidateFromResume_1 = require("./services/extractCandidateFromResume");
const authService_1 = require("./authService");
const dataStore_1 = require("./dataStore");
const db_1 = require("./db");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 5000);
const TOP_CANDIDATES_LIMIT = Number(process.env.TOP_CANDIDATES_LIMIT ?? 20);
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const createNotification = async (userId, title, body = null, link = null, type = "info") => {
    const notifications = await (0, db_1.getNotificationsCollection)();
    await notifications.insertOne({
        id: (0, crypto_1.randomUUID)(),
        userId,
        type,
        title,
        body,
        link,
        read: false,
        createdAt: new Date().toISOString()
    });
};
const getUserProfile = async (userId) => {
    const profiles = await (0, db_1.getProfilesCollection)();
    return profiles.findOne({ userId });
};
const upsertUserProfile = async (userId, profileData) => {
    const profiles = await (0, db_1.getProfilesCollection)();
    await profiles.updateOne({ userId }, { $set: { userId, ...profileData } }, { upsert: true });
    return (await profiles.findOne({ userId }));
};
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const user = await authService_1.AuthService.verifyToken(token);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
};
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
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
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "AI Screening API is running"
    });
});
/* -------------------- AUTHENTICATION ENDPOINTS -------------------- */
app.post("/api/auth/register", async (req, res) => {
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
        const result = await authService_1.AuthService.register({ email, password, name });
        if (!result.success) {
            return res.status(400).json(result);
        }
        if (result.user) {
            createNotification(result.user.id, "Welcome to Hireloop", "Your account is ready. Start screening candidates from the dashboard.", "/", "success");
        }
        res.json(result);
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
});
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const result = await authService_1.AuthService.login({ email, password });
        if (!result.success) {
            return res.status(401).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});
app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
app.post("/api/auth/logout", (req, res) => {
    // For JWT, logout is handled client-side by removing the token
    res.json({
        success: true,
        message: "Logged out successfully"
    });
});
app.post("/api/auth/request-reset", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        const result = await authService_1.AuthService.requestPasswordReset(email);
        res.json(result);
    }
    catch (error) {
        console.error("Password reset request error:", error);
        res.status(500).json({ success: false, message: "Password reset request failed" });
    }
});
app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: "Token and password are required" });
        }
        const result = await authService_1.AuthService.resetPassword(token, password);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ success: false, message: "Password reset failed" });
    }
});
app.get("/api/profile", requireAuth, async (req, res) => {
    const profile = await getUserProfile(req.user.id);
    res.json({ success: true, profile: profile ?? null });
});
app.patch("/api/profile", requireAuth, async (req, res) => {
    const { display_name, job_title, company, bio } = req.body;
    if (typeof display_name !== "string" || typeof job_title !== "string" || typeof company !== "string" || typeof bio !== "string") {
        return res.status(400).json({ success: false, message: "Invalid profile payload" });
    }
    const profile = await upsertUserProfile(req.user.id, { display_name, job_title, company, bio });
    res.json({ success: true, profile });
});
app.get("/api/notifications/count", requireAuth, async (req, res) => {
    const notifications = await (0, db_1.getNotificationsCollection)();
    const count = await notifications.countDocuments({ userId: req.user.id, read: false });
    res.json({ success: true, count });
});
app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await (0, db_1.getNotificationsCollection)();
    const userNotifications = await notifications
        .find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();
    res.json({ success: true, notifications: userNotifications });
});
app.patch("/api/notifications/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { read } = req.body;
    const notifications = await (0, db_1.getNotificationsCollection)();
    const notification = await notifications.findOne({ id, userId: req.user.id });
    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
    }
    if (typeof read === "boolean") {
        await notifications.updateOne({ id, userId: req.user.id }, { $set: { read } });
    }
    res.json({ success: true, notification: await notifications.findOne({ id, userId: req.user.id }) });
});
app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    const notifications = await (0, db_1.getNotificationsCollection)();
    await notifications.updateMany({ userId: req.user.id }, { $set: { read: true } });
    res.json({ success: true });
});
app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const notifications = await (0, db_1.getNotificationsCollection)();
    const result = await notifications.deleteOne({ id, userId: req.user.id });
    if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true });
});
app.get("/api/skills", requireAuth, (_req, res) => {
    res.json({
        success: true,
        skills: dataStore_1.skillSuggestions
    });
});
app.get("/api/jobs", requireAuth, async (_req, res) => {
    res.json({
        success: true,
        jobs: await (0, dataStore_1.listJobsAsync)()
    });
});
app.get("/api/jobs/:jobId", requireAuth, async (req, res) => {
    const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId[0];
    const snapshot = await (0, dataStore_1.getJobSnapshotAsync)(jobId, TOP_CANDIDATES_LIMIT);
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
app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
        const { title, requiredSkills = [], preferredSkills = [], minimumExperienceYears = 0, educationLevel = "No requirement", description = "", department = "General" } = req.body ?? {};
        if (!title || typeof title !== "string") {
            return res.status(400).json({
                success: false,
                message: "title is required"
            });
        }
        const job = await (0, dataStore_1.createJobAsync)({
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create job",
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
app.patch("/api/jobs/:jobId/status", requireAuth, async (req, res) => {
    const { status } = req.body ?? {};
    if (!["active", "draft", "closed"].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }
    const jobId = typeof req.params.jobId === "string" ? req.params.jobId : req.params.jobId[0];
    const job = await (0, dataStore_1.updateJobStatusAsync)(jobId, status);
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
app.get("/api/candidates", requireAuth, async (req, res) => {
    const jobId = typeof req.query.jobId === "string" ? req.query.jobId : undefined;
    return res.json({
        success: true,
        candidates: (await (0, dataStore_1.listCandidatesAsync)(jobId)).slice(0, TOP_CANDIDATES_LIMIT)
    });
});
app.get("/api/dashboard", requireAuth, async (_req, res) => {
    return res.json({
        success: true,
        dashboard: await (0, dataStore_1.getDashboardSummaryAsync)()
    });
});
/* -------------------- SCREEN ENDPOINT -------------------- */
app.post("/api/screen", requireAuth, upload.array("files", 10), async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);
        let rawJob = req.body.job;
        let rawCandidates = req.body.candidates;
        const jobId = typeof req.body.jobId === "string" ? req.body.jobId : undefined;
        // Parse job
        if (typeof rawJob === "string") {
            rawJob = JSON.parse(rawJob);
        }
        // Parse candidates (if provided manually)
        if (typeof rawCandidates === "string") {
            rawCandidates = JSON.parse(rawCandidates);
        }
        let candidates = Array.isArray(rawCandidates)
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
                const ext = path_1.default.extname(file.originalname).toLowerCase();
                if (!allowedExtensions.includes(ext)) {
                    return res.status(400).json({
                        success: false,
                        message: `Unsupported file format: ${file.originalname}`
                    });
                }
            }
            // If no candidates passed manually, extract from files
            if (!candidates || candidates.length === 0) {
                const firstExt = path_1.default.extname(files[0].originalname).toLowerCase();
                // CSV
                if (firstExt === ".csv") {
                    const csvText = files[0].buffer.toString("utf-8");
                    candidates = (0, csvParser_1.parseCSV)(csvText);
                }
                // Excel
                else if (firstExt === ".xlsx" || firstExt === ".xls") {
                    candidates = (0, xlsxParser_1.parseXLSX)(files[0].buffer);
                }
                // PDF resumes (multiple)
                else if (firstExt === ".pdf") {
                    const pdfFiles = files.filter((f) => path_1.default.extname(f.originalname).toLowerCase() === ".pdf");
                    const extracted = [];
                    for (let i = 0; i < pdfFiles.length; i++) {
                        const file = pdfFiles[i];
                        const text = await (0, pdfParser_1.extractTextFromPDF)(file.buffer);
                        console.log(`PDF TEXT [${file.originalname}]`, text);
                        const candidate = await (0, extractCandidateFromResume_1.extractCandidateFromResumeText)(text, `pdf-${i + 1}`);
                        extracted.push(candidate);
                    }
                    candidates = extracted;
                }
            }
        }
        // Final validation
        if (!rawJob ||
            typeof rawJob === "string" ||
            !candidates ||
            candidates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Job + candidates (or files) are required"
            });
        }
        const job = rawJob;
        const { results, shortlist } = await (0, screeningService_1.screenCandidates)(job, candidates, TOP_CANDIDATES_LIMIT);
        const analytics = {
            totalCandidates: results.length,
            averageScore: results.length > 0
                ? Number((results.reduce((sum, candidate) => sum + candidate.score, 0) /
                    results.length).toFixed(2))
                : 0,
            topCandidate: results[0] ?? null,
            topCandidates: results.slice(0, TOP_CANDIDATES_LIMIT),
            topSkillGaps: Object.entries(results.reduce((acc, result) => {
                for (const gap of result.criticalGaps) {
                    acc[gap] = (acc[gap] ?? 0) + 1;
                }
                return acc;
            }, {}))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
        const storedCandidates = jobId && rawJob ? await (0, dataStore_1.storeScreeningResultsAsync)(jobId, candidates, results) : undefined;
        return res.json({
            success: true,
            candidates: storedCandidates,
            results,
            shortlist,
            analytics
        });
    }
    catch (error) {
        console.error("Screening API error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to screen candidates",
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
/* -------------------- ANALYTICS ENDPOINT (NEW) -------------------- */
app.post("/api/analyze", requireAuth, async (req, res) => {
    try {
        const { results } = req.body;
        if (!results || !Array.isArray(results)) {
            return res.status(400).json({
                success: false,
                message: "results array is required"
            });
        }
        const totalCandidates = results.length;
        const averageScore = results.reduce((sum, c) => sum + (c.score || 0), 0) / totalCandidates;
        const topCandidate = results[0];
        const topCandidates = results.slice(0, TOP_CANDIDATES_LIMIT);
        const gapMap = {};
        results.forEach((c) => {
            (c.criticalGaps || []).forEach((gap) => {
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
    }
    catch (error) {
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
        await (0, db_1.connectToDatabase)();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
void startServer();
