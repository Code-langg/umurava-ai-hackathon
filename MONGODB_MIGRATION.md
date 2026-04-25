# MongoDB Migration Guide

This guide explains how to migrate from in-memory storage to MongoDB Atlas for production use.

## Why MongoDB?

- **Persistent Storage**: Data survives server restarts
- **Scalability**: Easily handle thousands of candidates and jobs
- **Cloud-hosted**: No infrastructure management with Atlas free tier
- **Real-time Updates**: Better support for concurrent users
- **Backup & Recovery**: Automatic backups with Atlas

## Schema Design

### Users Collection

```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "name": "John Doe",
  "passwordHash": "$2b$10$...",
  "createdAt": ISODate("2026-04-25T10:00:00Z"),
  "updatedAt": ISODate("2026-04-25T10:00:00Z")
}
```

### Jobs Collection

```json
{
  "_id": ObjectId,
  "id": "job-abc123",
  "userId": ObjectId,
  "title": "Senior React Developer",
  "department": "Engineering",
  "description": "We're looking for...",
  "requiredSkills": ["React", "TypeScript", "Node.js"],
  "preferredSkills": ["GraphQL", "AWS"],
  "minimumExperienceYears": 3,
  "educationLevel": "Bachelor's",
  "status": "active",
  "applicants": 0,
  "screened": 0,
  "topMatches": 0,
  "createdAt": ISODate("2026-04-25T10:00:00Z"),
  "updatedAt": ISODate("2026-04-25T10:00:00Z")
}
```

### Candidates Collection

```json
{
  "_id": ObjectId,
  "id": "cand-xyz789",
  "jobId": "job-abc123",
  "userId": ObjectId,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "title": "React / TypeScript specialist",
  "location": "San Francisco, CA",
  "yearsExperience": 5,
  "score": 92,
  "skills": ["React", "TypeScript", "Node.js", "AWS"],
  "education": "Bachelor's in Computer Science",
  "summary": "Experienced full-stack engineer...",
  "strengths": ["Strong React expertise", "TypeScript mastery"],
  "gaps": ["Limited DevOps experience"],
  "recommendation": "Strong candidate, recommended for interview",
  "avatarHue": 245,
  "createdAt": ISODate("2026-04-25T10:00:00Z"),
  "updatedAt": ISODate("2026-04-25T10:00:00Z")
}
```

### Notifications Collection

```json
{
  "_id": ObjectId,
  "id": "notif-123",
  "userId": ObjectId,
  "type": "success",
  "title": "Screening complete",
  "body": "25 candidates have been screened",
  "link": "/jobs/job-abc123",
  "read": false,
  "createdAt": ISODate("2026-04-25T10:00:00Z")
}
```

### Password Reset Tokens Collection

```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "token": "05b941b8-804a-4dae-8aeb-a7400aa1ef9f",
  "expiresAt": ISODate("2026-04-25T10:15:00Z"),
  "createdAt": ISODate("2026-04-25T10:00:00Z")
}
```

## Step-by-Step Migration

### Step 1: Set Up MongoDB Atlas

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up with email
   - Create organization

2. **Create Project**
   - Click "New Project"
   - Name it "Hireloop"
   - Add yourself as project member

3. **Create Cluster**
   - Click "Create Deployment"
   - Select "M0 Sandbox" (free tier, 512 MB storage)
   - Choose region closest to your backend
   - Click "Create"

4. **Configure Security**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username: `hireloop_user`
   - Create password: `strong-password-here`
   - User Privileges: "Atlas Admin"
   - Click "Add User"

5. **Whitelist IP**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0) for development
   - For production, use specific IPs

6. **Get Connection String**
   - In "Database" section, click your cluster
   - Click "Connect"
   - Choose "Drivers"
   - Select "Node.js"
   - Copy connection string

### Step 2: Update Backend Code

1. **Install MongoDB driver**

   ```bash
   npm install mongoose
   npm install --save-dev @types/mongoose
   ```

2. **Create models directory**

   ```bash
   mkdir src/models
   ```

3. **Create Mongoose schemas** (src/models/)

   **User.ts**

   ```typescript
   import mongoose from "mongoose";

   export const UserSchema = new mongoose.Schema({
     email: { type: String, required: true, unique: true },
     name: String,
     passwordHash: { type: String, required: true },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });

   export const User = mongoose.model("User", UserSchema);
   ```

   **Job.ts**

   ```typescript
   import mongoose from "mongoose";

   export const JobSchema = new mongoose.Schema({
     id: String,
     userId: mongoose.Schema.Types.ObjectId,
     title: String,
     department: String,
     description: String,
     requiredSkills: [String],
     preferredSkills: [String],
     minimumExperienceYears: Number,
     educationLevel: String,
     status: {
       type: String,
       enum: ["active", "draft", "closed"],
       default: "active",
     },
     applicants: { type: Number, default: 0 },
     screened: { type: Number, default: 0 },
     topMatches: { type: Number, default: 0 },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });

   export const Job = mongoose.model("Job", JobSchema);
   ```

   **Candidate.ts**

   ```typescript
   import mongoose from "mongoose";

   export const CandidateSchema = new mongoose.Schema({
     id: String,
     jobId: String,
     userId: mongoose.Schema.Types.ObjectId,
     name: String,
     email: String,
     title: String,
     location: String,
     yearsExperience: Number,
     score: Number,
     skills: [String],
     education: String,
     summary: String,
     strengths: [String],
     gaps: [String],
     recommendation: String,
     avatarHue: Number,
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
   });

   export const Candidate = mongoose.model("Candidate", CandidateSchema);
   ```

4. **Update server.ts to connect to MongoDB**

   ```typescript
   import mongoose from "mongoose";

   // Add this near the top of server initialization
   const connectDB = async () => {
     try {
       await mongoose.connect(process.env.MONGODB_URI || "");
       console.log("MongoDB connected");
     } catch (error) {
       console.error("MongoDB connection failed:", error);
       process.exit(1);
     }
   };

   // Call before starting server
   connectDB();
   ```

5. **Replace dataStore.ts logic** with MongoDB queries

   ```typescript
   // Instead of: jobs.push(newJob)
   // Use: await Job.create(newJob)

   // Instead of: jobs.find(j => j.id === jobId)
   // Use: await Job.findOne({ id: jobId })

   // Instead of: listCandidates(jobId)
   // Use: await Candidate.find({ jobId })
   ```

### Step 3: Create .env Configuration

```env
# Database
MONGODB_URI=mongodb+srv://hireloop_user:password@cluster-xyz.mongodb.net/hireloop?retryWrites=true&w=majority

# Rest of your env variables...
```

### Step 4: Create Database Indexes

For better performance, create indexes:

```typescript
// In your MongoDB Atlas dashboard, go to Indexes tab
// Or run these in your code:

await Job.collection.createIndex({ userId: 1, createdAt: -1 });
await Candidate.collection.createIndex({ jobId: 1, score: -1 });
await Candidate.collection.createIndex({ userId: 1 });
await User.collection.createIndex({ email: 1 }, { unique: true });
```

### Step 5: Testing

1. **Test locally** with MongoDB Atlas connection
2. **Verify migrations** work (if migrating from in-memory)
3. **Check indexes** are working

## Common Issues

### Connection Timeout

- **Cause**: IP not whitelisted or network issue
- **Fix**: Check "Network Access" in Atlas, add your IP

### Authentication Failed

- **Cause**: Wrong username/password
- **Fix**: Verify credentials in "Database Access"

### Mongoose Model Not Found

- **Cause**: Schema not registered
- **Fix**: Ensure models are imported before use

## Performance Tips

1. **Indexes**: Create indexes on frequently queried fields
2. **Pagination**: Use skip/limit for large result sets
3. **Projections**: Only fetch needed fields
4. **Connection Pooling**: Mongoose handles automatically

## Migration Checklist

- [ ] Create MongoDB Atlas account
- [ ] Create free cluster
- [ ] Create database user
- [ ] Whitelist IPs
- [ ] Get connection string
- [ ] Install mongoose
- [ ] Create models
- [ ] Update server.ts
- [ ] Replace in-memory logic with MongoDB queries
- [ ] Update .env with MongoDB URI
- [ ] Test locally
- [ ] Create indexes
- [ ] Deploy to production

## Next Steps

After setting up MongoDB:

1. Update all data access in `dataStore.ts` and `server.ts`
2. Replace arrays with database queries
3. Test all CRUD operations
4. Deploy to production platform (Railway/Render/Fly.io)
