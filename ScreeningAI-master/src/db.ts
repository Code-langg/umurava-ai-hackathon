import { Collection, Db, Document, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB_NAME || "hireloop";

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectToDatabase() {
  if (database) return database;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);
  return database;
}

async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await connectToDatabase();
  return db.collection<T>(name);
}

export async function getUsersCollection() {
  return getCollection<any>("users");
}

export async function getResetTokensCollection() {
  return getCollection<any>("resetTokens");
}

export async function getJobsCollection() {
  return getCollection<any>("jobs");
}

export async function getCandidatesCollection() {
  return getCollection<any>("candidates");
}

export async function getNotificationsCollection() {
  return getCollection<any>("notifications");
}

export async function getProfilesCollection() {
  return getCollection<any>("profiles");
}

export async function getCountersCollection() {
  return getCollection<any>("counters");
}

export async function getNextSequence(sequenceName: string): Promise<number> {
  const counters = await getCountersCollection();
  const result = await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return result?.value?.value ?? 1;
}
