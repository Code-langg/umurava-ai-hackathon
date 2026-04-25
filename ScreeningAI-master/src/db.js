"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getUsersCollection = getUsersCollection;
exports.getResetTokensCollection = getResetTokensCollection;
exports.getJobsCollection = getJobsCollection;
exports.getCandidatesCollection = getCandidatesCollection;
exports.getNotificationsCollection = getNotificationsCollection;
exports.getProfilesCollection = getProfilesCollection;
exports.getCountersCollection = getCountersCollection;
exports.getNextSequence = getNextSequence;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB_NAME || "hireloop";
let client = null;
let database = null;
async function connectToDatabase() {
    if (database)
        return database;
    if (!uri) {
        throw new Error("MONGODB_URI is required");
    }
    client = new mongodb_1.MongoClient(uri);
    await client.connect();
    database = client.db(dbName);
    return database;
}
async function getCollection(name) {
    const db = await connectToDatabase();
    return db.collection(name);
}
async function getUsersCollection() {
    return getCollection("users");
}
async function getResetTokensCollection() {
    return getCollection("resetTokens");
}
async function getJobsCollection() {
    return getCollection("jobs");
}
async function getCandidatesCollection() {
    return getCollection("candidates");
}
async function getNotificationsCollection() {
    return getCollection("notifications");
}
async function getProfilesCollection() {
    return getCollection("profiles");
}
async function getCountersCollection() {
    return getCollection("counters");
}
async function getNextSequence(sequenceName) {
    const counters = await getCountersCollection();
    const result = await counters.findOneAndUpdate({ _id: sequenceName }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after" });
    return result?.value?.value ?? 1;
}
