# Hireloop - AI Talent Screening Platform

## Project Overview

Hireloop screens and ranks candidates using AI. Recruiters create a job profile, upload resumes (`.csv`, `.xlsx`, `.xls`, `.pdf`), and get scored candidates with strengths, gaps, and recommendations.

Core capabilities:
- JWT-based authentication
- AI resume screening with Gemini
- Job and candidate management
- Candidate ranking and shortlist views
- MongoDB-backed persistence for users, jobs, candidates, profiles, and notifications

## Architecture Diagram (optional)

```text
Frontend (Vite + React, Vercel)
        |
        | HTTPS / JWT
        v
Backend API (Express + TypeScript, Railway/Render/Fly.io)
        |
        | MongoDB driver
        v
MongoDB Atlas (users, jobs, candidates, notifications, profiles, resetTokens)
```

## Setup Instructions

### 1) Clone and install

```bash
git clone <your-repo-url>
cd umurava_ai_hackathon-main
```

Backend:
```bash
cd ScreeningAI-master
npm install
```

Frontend (new terminal):
```bash
cd ai-shortlist-tool-main
npm install
```

### 2) Configure environment variables

Create `ScreeningAI-master/.env` and `ai-shortlist-tool-main/.env` using the tables below.

### 3) Run locally

Backend:
```bash
cd ScreeningAI-master
npm run server
```

Frontend:
```bash
cd ai-shortlist-tool-main
npm run dev
```

## Environment Variables

### Backend: `ScreeningAI-master/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | No | DB name (default: `hireloop`) |
| `PORT` | No | API port (default: `5000`) |
| `FRONTEND_URL` | Yes | Frontend URL for CORS/password reset links |
| `JWT_SECRET` | Yes | JWT signing secret |
| `GOOGLE_API_KEY` | Yes | Gemini API key |
| `SMTP_HOST` | No | SMTP host |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password/app password |
| `SMTP_SECURE` | No | `true`/`false` |
| `TOP_CANDIDATES_LIMIT` | No | Number of top candidates returned (`10`, `20`, etc; default `20`) |

### Frontend: `ai-shortlist-tool-main/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_SCREENING_API_URL` | Yes | Backend API base URL (example: `https://your-api.onrender.com/api`) |

## Deployment

### Frontend to Vercel

1. Push repo to GitHub.
2. In Vercel, import the repository.
3. Set project root to `ai-shortlist-tool-main`.
4. Add env var:
   - `VITE_SCREENING_API_URL=https://<your-backend-domain>/api`
5. Deploy.

### Backend to Railway / Render / Fly.io

Use `ScreeningAI-master` as the service root.

Build/start:
- Build command: `npm install`
- Start command: `npm run server`

Required env vars:
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_API_KEY`
- `FRONTEND_URL`

Optional:
- `MONGODB_DB_NAME`
- `TOP_CANDIDATES_LIMIT`
- SMTP variables

### Database to MongoDB Atlas

1. Create an Atlas project and cluster.
2. Create DB user credentials.
3. Add network access rules (allow your backend host/IP).
4. Copy the Node.js connection string.
5. Set it as `MONGODB_URI` in your backend host.

## AI Decision Flow Explanation

1. User uploads resume files.
2. Backend parses structured candidate data from CSV/XLSX/PDF.
3. Backend builds a strict JSON prompt for Gemini with:
   - job requirements
   - all candidates
4. Gemini returns scored results for each candidate.
5. Backend normalizes and sorts candidates by score.
6. Backend stores merged results in MongoDB.
7. API returns:
   - full results
   - shortlist
   - analytics (including top candidates list, configurable with `TOP_CANDIDATES_LIMIT`)

## Assumptions and Limitations

Assumptions:
- Resume content is sufficiently parseable from supported formats.
- Gemini API and MongoDB Atlas are reachable from backend runtime.
- Recruiters configure at least one job profile before screening.

Limitations:
- PDF parsing quality depends on resume formatting.
- API latency depends on Gemini response time.
- Current compare view supports up to 3 selected candidates.
- Frontend build toolchain may require Node `20.19+` in some environments.
