# Deployment Guide

Complete step-by-step instructions for deploying Hireloop to production.

## Overview

- **Frontend**: Deployed to Vercel (free tier available)
- **Backend**: Deployed to Railway/Render/Fly.io (choose one)
- **Database**: MongoDB Atlas (free tier: 512 MB)

## Prerequisites

1. GitHub account with code pushed to repository
2. MongoDB Atlas account and cluster created (see MONGODB_MIGRATION.md)
3. Google Gemini API key
4. Gmail account with app password (for SMTP)

---

## Part 1: Frontend Deployment to Vercel

### Step 1: Prepare Repository

Ensure your frontend code is in the correct structure:

```
umurava_ai_hackathon/
├── ai-shortlist-tool-main/   ← Frontend root
├── ScreeningAI-master/        ← Backend (separate)
└── README.md
```

### Step 2: Create Vercel Project

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Sign Up"
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your repositories

2. **Import Project**
   - Click "New Project"
   - Search for `umurava_ai_hackathon`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `ai-shortlist-tool-main`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 3: Set Environment Variables

1. **In Vercel Dashboard**
   - Go to your project settings
   - Click "Environment Variables"
   - Add the following:

   | Key                      | Value                                 |
   | ------------------------ | ------------------------------------- |
   | `VITE_SCREENING_API_URL` | `https://your-backend-domain.com/api` |

   (You'll get the backend URL after deploying the backend)

2. **Save and redeploy**
   - Click "Deployments"
   - Click "Redeploy" on latest deployment

### Step 4: Verify Deployment

- Frontend will be live at: `https://your-project.vercel.app`
- Check that API calls work by testing login/registration

### Troubleshooting Vercel

**Build fails:**

- Check build logs in Vercel dashboard
- Ensure Node version is 18+
- Verify `package.json` exists in `ai-shortlist-tool-main/`

**API calls not working:**

- Verify `VITE_SCREENING_API_URL` is set correctly
- Check backend is running and accessible
- Look for CORS errors in browser console

---

## Part 2A: Backend Deployment to Railway

### Step 1: Prepare Backend Repository

```bash
cd ScreeningAI-master

# Ensure package.json has correct scripts
# "server": "ts-node src/server.ts"
# "build": "tsc"
```

### Step 2: Create Railway Project

1. **Go to Railway**
   - Visit https://railway.app
   - Click "Login"
   - Choose "Login with GitHub"
   - Authorize Railway

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Find and select `umurava_ai_hackathon`
   - Click "Deploy"

### Step 3: Configure Build Settings

1. **In Railway Dashboard**
   - Select your project
   - Click "Settings"
   - Set:
     - **Start Command**: `npm run server`
     - **Build Command**: Leave empty (optional)

### Step 4: Add PostgreSQL/MongoDB

**Option A: Use MongoDB Atlas (Recommended)**

1. Create MongoDB Atlas cluster (see MONGODB_MIGRATION.md)
2. Get connection string
3. Add environment variable (see Step 5)

**Option B: Use Railway's PostgreSQL**

1. In Railway project, click "Add Service"
2. Select "PostgreSQL"
3. Auto-generates `DATABASE_URL`

### Step 5: Set Environment Variables

1. **In Railway Dashboard**
   - Click "Variables"
   - Add all backend environment variables:

   | Key              | Value                             |
   | ---------------- | --------------------------------- |
   | `MONGODB_URI`    | Your MongoDB connection string    |
   | `PORT`           | `3000`                            |
   | `FRONTEND_URL`   | `https://your-project.vercel.app` |
   | `JWT_SECRET`     | Generate a random string          |
   | `SMTP_HOST`      | `smtp.gmail.com`                  |
   | `SMTP_PORT`      | `587`                             |
   | `SMTP_USER`      | Your Gmail address                |
   | `SMTP_PASS`      | Your Gmail app password           |
   | `SMTP_SECURE`    | `false`                           |
   | `GOOGLE_API_KEY` | Your Gemini API key               |

2. **Save variables**
   - Railway auto-deploys when you save

### Step 6: Get Backend URL

1. **In Railway Dashboard**
   - Go to "Deployments"
   - Look for "Domains"
   - Copy the domain (e.g., `hireloop-prod.railway.app`)
   - Backend API: `https://hireloop-prod.railway.app/api`

2. **Update Vercel**
   - Go to Vercel project settings
   - Update `VITE_SCREENING_API_URL` with this URL
   - Redeploy frontend

### Troubleshooting Railway

**Build fails:**

- Check "Build Logs" tab
- Verify `package.json` exists
- Ensure all dependencies are listed

**Port error:**

- Railway assigns a port via `process.env.PORT`
- Don't hardcode port to 5000

**Deployment stuck:**

- Check "Deployments" tab for errors
- Click "View Logs"

---

## Part 2B: Backend Deployment to Render

### Step 1: Prepare Backend

```bash
# Ensure Procfile exists or package.json has correct scripts
# "start": "npm run server"
# "build": "tsc" (optional)
```

### Step 2: Create Render Service

1. **Go to Render**
   - Visit https://render.com
   - Click "Sign Up"
   - Choose "Continue with GitHub"
   - Authorize Render

2. **Create New Service**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub repository
   - Select `umurava_ai_hackathon`
   - Click "Connect"

3. **Configure Build**
   - Name: `hireloop-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build` (if needed)
   - Start Command: `npm run server`
   - Instance Type: `Free`
   - Plan: `Free`

### Step 3: Add PostgreSQL (Optional)

1. Click "New +"
2. Select "PostgreSQL"
3. Name: `hireloop-db`
4. Auto-generates `DATABASE_URL`

### Step 4: Set Environment Variables

1. **In Render Dashboard**
   - Go to your Web Service
   - Click "Environment"
   - Add all variables (same as Railway section above)

2. **Special Note**
   - Render reads `DATABASE_URL` automatically
   - If using MongoDB, set `MONGODB_URI` instead

### Step 5: Get Backend URL

- Render generates URL like: `https://hireloop-api.onrender.com`
- Backend API: `https://hireloop-api.onrender.com/api`
- Update Vercel environment variables

### Troubleshooting Render

**Free tier goes to sleep:**

- Render free tier services spin down after 15 min inactivity
- First request takes ~30 seconds
- Upgrade to paid tier to prevent

**Build fails:**

- Check "Events" tab
- Ensure `npm run server` works locally

---

## Part 2C: Backend Deployment to Fly.io

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Windows (PowerShell)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```

### Step 2: Initialize Fly App

```bash
cd ScreeningAI-master
flyctl launch
# Follow prompts
# - App name: hireloop-api
# - Region: Choose closest to users
# - Postgres: No (use MongoDB Atlas)
```

### Step 3: Set Environment Variables

```bash
flyctl secrets set \
  MONGODB_URI="mongodb+srv://..." \
  JWT_SECRET="your-secret" \
  FRONTEND_URL="https://your-project.vercel.app" \
  SMTP_HOST="smtp.gmail.com" \
  SMTP_PORT="587" \
  SMTP_USER="your-email@gmail.com" \
  SMTP_PASS="your-app-password" \
  GOOGLE_API_KEY="your-gemini-key"
```

### Step 4: Deploy

```bash
flyctl deploy
```

### Step 5: Get Backend URL

```bash
flyctl info
# Look for hostname: e.g., hireloop-api.fly.dev
# Backend API: https://hireloop-api.fly.dev/api
```

### Troubleshooting Fly.io

**Deployment fails:**

```bash
flyctl logs
```

**Connection issues:**

- Check firewall rules
- Ensure port is exposed in `fly.toml`

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables documented
- [ ] API tested locally
- [ ] Frontend tested locally with backend

### Frontend (Vercel)

- [ ] Project imported to Vercel
- [ ] Build succeeds
- [ ] Environment variables set (empty initially, update after backend deployment)
- [ ] Deployment successful

### Backend (Choose one)

- [ ] Service created
- [ ] Environment variables configured
- [ ] Build succeeds
- [ ] Deployment successful
- [ ] Health check passes (`GET /` returns success)

### Post-Deployment

- [ ] Frontend environment variables updated with backend URL
- [ ] Frontend redeployed
- [ ] Test login/registration
- [ ] Test candidate upload and screening
- [ ] Test password reset with email
- [ ] Monitor logs for errors

---

## Environment Variable Reference

### All Backends (Railway/Render/Fly.io)

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hireloop

# Server
PORT=3000
FRONTEND_URL=https://your-project.vercel.app

# Authentication
JWT_SECRET=your-random-secret-key-min-32-chars

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_SECURE=false

# AI
GOOGLE_API_KEY=AIzaSyD...
```

### Frontend (Vercel)

```env
VITE_SCREENING_API_URL=https://hireloop-api.example.com/api
```

---

## Monitoring & Maintenance

### Check Logs

- **Vercel**: Dashboard → Deployments → View Log
- **Railway**: Project → Deployments → View Logs
- **Render**: Web Service → Events or Logs
- **Fly.io**: `flyctl logs`

### Update Code

All platforms auto-deploy on push to main branch.

### Scale Resources

- **Vercel**: Automatic (no configuration needed)
- **Railway**: Click "Upgrade Plan"
- **Render**: Increase instance size
- **Fly.io**: `flyctl scale count 2`

---

## Cost Estimation

| Service       | Free Tier                    | Limits                             |
| ------------- | ---------------------------- | ---------------------------------- |
| Vercel        | ✅ Unlimited                 | 12 deployments/day                 |
| Railway       | ✅ $5/month credits          | ~50 hours of runtime               |
| Render        | ✅ Free                      | Spins down after 15 min inactivity |
| Fly.io        | ✅ 3 shared-cpu-1x 256MB VMs | -                                  |
| MongoDB Atlas | ✅ Free                      | 512 MB storage, 1 million reads    |

**Recommended Setup**: Vercel Free + Railway Free tier = ~$0/month for MVP

---

## Common Issues & Solutions

### CORS Errors

**Symptom**: Frontend can't call backend API
**Solution**: Ensure backend has CORS enabled with correct origin

### Timeout on First Request

**Symptom**: First API call hangs then times out
**Solution**: Normal for free tier services, upgrade for instant response

### Environment Variables Not Applied

**Solution**: Redeploy after changing variables

### Memory Errors

**Symptom**: "JavaScript heap out of memory"
**Solution**: Upgrade to paid tier or optimize code

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://railway.app/docs
- **Render Docs**: https://render.com/docs
- **Fly.io Docs**: https://fly.io/docs/
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
