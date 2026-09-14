/**
 * MALVISION AUTHORITATIVE SERVER DATABASE LAYER (MongoDB Atlas)
 * 
 * SERVER-AUTHORITATIVE ONLY. NEVER EXPOSED DIRECTLY TO BROWSER CLIENTS.
 * MongoDB Atlas is the exclusive, persistent source of truth for:
 * Database: threat-detection
 * Collections: users, scans, vision_scans, sessions
 */

import { MongoClient, Db } from 'mongodb';
import crypto from 'node:crypto';

export interface ServerUserRecord {
  id: string; // Immutable identifier: 'usr_xxxxxxxx'
  email: string;
  normalizedEmail: string;
  username: string;
  normalizedUsername: string;
  fullName: string;
  passwordHash?: string;
  salt?: string;
  provider: 'email' | 'google';
  role: 'user' | 'superadmin';
  status: 'active' | 'disabled';
  googleSub?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  failedLoginAttempts: number;
  lockoutUntil?: number;
}

export interface ServerAuditLogRecord {
  id: string;
  adminUserId: string;
  adminUsername: string;
  action: string;
  targetType: 'user' | 'scan' | 'vision' | 'session' | 'security' | 'system';
  targetId?: string;
  details?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
}

export interface ServerScanRecord {
  id: string;
  userId: string; // Ownership boundary: immutable userId derived strictly from authenticated server session
  target: string;
  targetType: 'file' | 'pdf' | 'url' | 'hash';
  status: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';
  score: number;
  summary: string;
  explanation: string;
  findings: Array<{ type: 'info' | 'warning' | 'danger' | 'success'; title: string; detail: string }>;
  recommendedAction: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ServerVisionRecord {
  id: string;
  userId: string; // Ownership boundary
  imageName: string;
  prompt: string;
  resultSummary: string;
  riskScore: number;
  threatClassification: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';
  createdAt: string;
  updatedAt: string;
}

export interface ServerSessionRecord {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: Date; // BSON Date object for native MongoDB TTL index
  ipAddress?: string;
  userAgent?: string;
}

// Environment Configuration Helpers
function getEnv(key: string, fallback = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key]!;
  }
  return fallback;
}

const MONGO_URI = getEnv(
  'MONGODB_URI',
  'mongodb+srv://yaseenashu18:yaseenashu18@threat-detection.f39agqr.mongodb.net/?appName=threat-detection'
);
const MONGO_DB_NAME = getEnv('MONGODB_DB_NAME', 'threat-detection');

// MongoDB Atlas Connection Manager
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<Db> | null = null;
let indexesInitialized = false;

export async function getMongoDb(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const uri = MONGO_URI.trim();
    if (!uri) {
      throw new Error('[MongoDB Atlas] Connection failed: MONGODB_URI environment variable is not configured.');
    }

    try {
      if (!cachedClient) {
        cachedClient = new MongoClient(uri, {
          connectTimeoutMS: 8000,
          serverSelectionTimeoutMS: 8000,
          maxPoolSize: 10,
        });
        await cachedClient.connect();
      }

      const dbName = MONGO_DB_NAME.trim() || 'threat-detection';
      cachedDb = cachedClient.db(dbName);

      if (!indexesInitialized) {
        await ensureIndexes(cachedDb);
        indexesInitialized = true;
      }

      // Safe logging without leaking URI credentials
      console.log(`[MongoDB] Connected successfully to database: ${dbName}`);
      return cachedDb;
    } catch (err: any) {
      console.error(`[MongoDB] Failed to connect to database '${MONGO_DB_NAME}':`, err?.message || err);
      cachedClient = null;
      cachedDb = null;
      throw new Error(`[MongoDB Atlas Error] Unable to connect to database server: ${err?.message || 'Connection refused'}`);
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

async function ensureIndexes(db: Db) {
  try {
    // Ensure collections exist before creating indexes
    await db.createCollection('users').catch(() => {});
    await db.createCollection('scans').catch(() => {});
    await db.createCollection('vision_scans').catch(() => {});
    await db.createCollection('sessions').catch(() => {});
    await db.createCollection('admin_audit_logs').catch(() => {});

    // 1. Users collection indexes
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ normalizedEmail: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ status: 1 });

    // Partial unique index for normalizedUsername ($gt: '' matches non-empty string usernames)
    await db.collection('users').createIndex(
      { normalizedUsername: 1 },
      { unique: true, partialFilterExpression: { normalizedUsername: { $gt: '' } } }
    );

    // Partial unique index for googleSub ($gt: '' matches non-empty Google sub strings)
    await db.collection('users').createIndex(
      { googleSub: 1 },
      { unique: true, partialFilterExpression: { googleSub: { $gt: '' } } }
    );

    // 2. Scans collection indexes
    await db.collection('scans').createIndex({ id: 1 }, { unique: true });
    await db.collection('scans').createIndex({ userId: 1, createdAt: -1 });

    // 3. Vision Scans collection indexes
    await db.collection('vision_scans').createIndex({ id: 1 }, { unique: true });
    await db.collection('vision_scans').createIndex({ userId: 1, createdAt: -1 });

    // 4. Sessions collection indexes (with native BSON Date TTL index)
    await db.collection('sessions').createIndex({ sessionId: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // 5. Admin Audit Logs collection indexes
    await db.collection('admin_audit_logs').createIndex({ id: 1 }, { unique: true });
    await db.collection('admin_audit_logs').createIndex({ timestamp: -1 });
    await db.collection('admin_audit_logs').createIndex({ adminUserId: 1 });
    await db.collection('admin_audit_logs').createIndex({ targetType: 1, targetId: 1 });

    // Bootstrap Super Admin account if not existing
    await ensureSuperAdminAccount(db);
  } catch (err: any) {
    console.warn('[MongoDB] Index initialization notice:', err?.message || err);
  }
}

// Helper to strip MongoDB `_id` field cleanly
function cleanDoc<T>(doc: any): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest as T;
}

// --- USER OPERATIONS ---

export async function dbFindUserById(id: string): Promise<ServerUserRecord | null> {
  const db = await getMongoDb();
  const doc = await db.collection('users').findOne({ id });
  return cleanDoc<ServerUserRecord>(doc);
}

export async function dbFindUserByEmail(email: string): Promise<ServerUserRecord | null> {
  const norm = email.trim().toLowerCase();
  if (!norm) return null;
  const db = await getMongoDb();
  const doc = await db.collection('users').findOne({ normalizedEmail: norm });
  return cleanDoc<ServerUserRecord>(doc);
}

export async function dbFindUserByUsername(username: string): Promise<ServerUserRecord | null> {
  const norm = username.trim().toLowerCase();
  if (!norm) return null;
  const db = await getMongoDb();
  const doc = await db.collection('users').findOne({ normalizedUsername: norm });
  return cleanDoc<ServerUserRecord>(doc);
}

export async function dbFindUserByIdentity(identifier: string): Promise<ServerUserRecord | null> {
  const norm = identifier.trim().toLowerCase();
  if (!norm) return null;

  const db = await getMongoDb();
  const query: any = {
    $or: [{ normalizedEmail: norm }, { normalizedUsername: norm }],
  };
  if (norm.includes('@')) {
    query.$or.push({ normalizedUsername: norm.split('@')[0] });
  }
  const doc = await db.collection('users').findOne(query);
  return cleanDoc<ServerUserRecord>(doc);
}

export async function dbFindUserByGoogleSub(googleSub: string): Promise<ServerUserRecord | null> {
  if (!googleSub) return null;
  const db = await getMongoDb();
  const doc = await db.collection('users').findOne({ googleSub });
  return cleanDoc<ServerUserRecord>(doc);
}

export async function dbGetAllUsers(): Promise<ServerUserRecord[]> {
  const db = await getMongoDb();
  const docs = await db.collection('users').find({}).toArray();
  return docs.map((d) => cleanDoc<ServerUserRecord>(d)!).filter(Boolean);
}

export async function dbCreateUser(
  user: Omit<ServerUserRecord, 'id' | 'createdAt' | 'updatedAt' | 'role'> & { role?: 'user' | 'superadmin' }
): Promise<{ success: boolean; error?: string; user?: ServerUserRecord }> {
  const normEmail = user.normalizedEmail.trim().toLowerCase();
  const normUsername = user.normalizedUsername ? user.normalizedUsername.trim().toLowerCase() : '';

  const db = await getMongoDb();

  // Pre-validate uniqueness
  const existingEmail = await db.collection('users').findOne({ normalizedEmail: normEmail });
  if (existingEmail) {
    return { success: false, error: 'Email address is already registered.' };
  }

  if (normUsername) {
    const existingUser = await db.collection('users').findOne({ normalizedUsername: normUsername });
    if (existingUser) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }
  }

  if (user.googleSub) {
    const existingSub = await db.collection('users').findOne({ googleSub: user.googleSub });
    if (existingSub) {
      return { success: false, error: 'Google account is already linked to another profile.' };
    }
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  const record: ServerUserRecord = {
    ...user,
    id: userId,
    normalizedEmail: normEmail,
    username: user.username ? user.username.trim() : '',
    normalizedUsername: normUsername,
    role: user.role || 'user',
    status: user.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const res = await db.collection('users').insertOne({ ...record });
    if (!res.acknowledged) {
      throw new Error('MongoDB insert unacknowledged.');
    }
    return { success: true, user: record };
  } catch (err: any) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      if (field === 'normalizedUsername') {
        return { success: false, error: 'Username is already taken. Please choose another.' };
      }
      if (field === 'normalizedEmail') {
        return { success: false, error: 'Email address is already registered.' };
      }
      return { success: false, error: 'Account with this email or username already exists.' };
    }
    console.error('[MongoDB] dbCreateUser insert error:', err);
    throw err;
  }
}

export async function dbCheckUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; reason?: 'taken' | 'invalid' }> {
  const norm = username.trim().toLowerCase();
  if (!norm || norm.length < 3 || norm.length > 30 || !/^[a-z0-9_]+$/.test(norm)) {
    return { available: false, reason: 'invalid' };
  }

  const db = await getMongoDb();
  const filter: any = { normalizedUsername: norm };
  if (excludeUserId) {
    filter.id = { $ne: excludeUserId };
  }
  const existing = await db.collection('users').findOne(filter);
  if (existing) {
    return { available: false, reason: 'taken' };
  }
  return { available: true };
}

export async function dbSetUserUsername(
  userId: string,
  rawUsername: string
): Promise<{ success: boolean; code?: string; error?: string; user?: ServerUserRecord }> {
  const cleanUsername = rawUsername.trim();
  const normUsername = cleanUsername.toLowerCase();

  // Validate format
  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_]+$/.test(normUsername)) {
    return { success: false, code: 'INVALID_USERNAME', error: 'Username must be 3–30 characters, using letters, numbers, and underscores.' };
  }

  const db = await getMongoDb();

  // MongoDB unique constraint pre-check
  const existing = await db.collection('users').findOne({ normalizedUsername: normUsername });
  if (existing && existing.id !== userId) {
    return { success: false, code: 'USERNAME_TAKEN', error: 'Username taken. Try another.' };
  }

  const existingUser = await dbFindUserById(userId);
  if (!existingUser) {
    return { success: false, error: 'User account not found.' };
  }

  const now = new Date().toISOString();

  try {
    const updateResult = await db.collection('users').findOneAndUpdate(
      { id: userId },
      { $set: { username: cleanUsername, normalizedUsername: normUsername, updatedAt: now } },
      { returnDocument: 'after' }
    );

    const updatedDoc = cleanDoc<ServerUserRecord>(updateResult);
    if (updatedDoc) {
      return { success: true, user: updatedDoc };
    }

    const fallbackUser: ServerUserRecord = {
      ...existingUser,
      username: cleanUsername,
      normalizedUsername: normUsername,
      updatedAt: now,
    };
    return { success: true, user: fallbackUser };
  } catch (err: any) {
    if (err.code === 11000) {
      return { success: false, code: 'USERNAME_TAKEN', error: 'Username taken. Try another.' };
    }
    console.error('[MongoDB] dbSetUserUsername error:', err);
    throw err;
  }
}

export async function dbUpdateUser(id: string, updates: Partial<ServerUserRecord>): Promise<ServerUserRecord | null> {
  const db = await getMongoDb();
  const now = new Date().toISOString();

  const res = await db.collection('users').findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: now } },
    { returnDocument: 'after' }
  );

  return cleanDoc<ServerUserRecord>(res);
}

export async function dbDeleteUserAccount(userId: string): Promise<{ success: boolean; deletedCount: number }> {
  if (!userId) return { success: false, deletedCount: 0 };
  const db = await getMongoDb();

  const userRes = await db.collection('users').deleteOne({ id: userId });
  const sessRes = await db.collection('sessions').deleteMany({ userId });
  const scanRes = await db.collection('scans').deleteMany({ userId });
  const visRes = await db.collection('vision_scans').deleteMany({ userId });

  return {
    success: Boolean(userRes.acknowledged && userRes.deletedCount > 0),
    deletedCount: (userRes.deletedCount || 0) + (sessRes.deletedCount || 0) + (scanRes.deletedCount || 0) + (visRes.deletedCount || 0),
  };
}

// --- SESSION OPERATIONS ---

export async function dbCreateSession(userId: string, ttlMs: number = 7 * 24 * 60 * 60 * 1000): Promise<ServerSessionRecord> {
  // CS-PRNG Session ID using crypto.randomUUID()
  const sessionId = `sess_${crypto.randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  const record: ServerSessionRecord = {
    sessionId,
    userId,
    createdAt: now.toISOString(),
    expiresAt,
  };

  const db = await getMongoDb();
  const res = await db.collection('sessions').insertOne({
    sessionId: record.sessionId,
    userId: record.userId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt, // BSON Date for native MongoDB TTL index
  });

  if (!res.acknowledged) {
    throw new Error('[MongoDB] Failed to write session to database.');
  }

  return record;
}

export async function dbGetSession(sessionId: string): Promise<ServerSessionRecord | null> {
  if (!sessionId) return null;
  const db = await getMongoDb();
  const doc = await db.collection('sessions').findOne({ sessionId });
  if (!doc) return null;

  const session = cleanDoc<ServerSessionRecord>(doc)!;
  const expTime = session.expiresAt instanceof Date ? session.expiresAt.getTime() : new Date(session.expiresAt).getTime();
  
  // App explicit expiration validation
  if (expTime < Date.now()) {
    await db.collection('sessions').deleteOne({ sessionId });
    return null;
  }

  return session;
}

export async function dbGetSessionByUserId(userId: string): Promise<ServerSessionRecord | null> {
  if (!userId) return null;
  const db = await getMongoDb();
  const docs = await db.collection('sessions').find({ userId }).sort({ _id: -1 }).limit(1).toArray();
  if (!docs || docs.length === 0) return null;

  const session = cleanDoc<ServerSessionRecord>(docs[0])!;
  const expTime = session.expiresAt instanceof Date ? session.expiresAt.getTime() : new Date(session.expiresAt).getTime();

  if (expTime < Date.now()) {
    await db.collection('sessions').deleteOne({ sessionId: session.sessionId });
    return null;
  }

  return session;
}

export async function dbGetActiveSessionsForUser(userId: string): Promise<ServerSessionRecord[]> {
  if (!userId) return [];
  const db = await getMongoDb();
  const docs = await db.collection('sessions').find({ userId, expiresAt: { $gt: new Date() } }).sort({ _id: -1 }).toArray();
  return (docs || []).map((d) => cleanDoc<ServerSessionRecord>(d)!);
}

export async function dbDeleteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const db = await getMongoDb();
  await db.collection('sessions').deleteOne({ sessionId });
}

export async function dbDeleteUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  const db = await getMongoDb();
  await db.collection('sessions').deleteMany({ userId });
}

// --- SCAN HISTORY OPERATIONS ---

export async function dbGetScansByUserId(userId: string): Promise<ServerScanRecord[]> {
  if (!userId) return [];
  const db = await getMongoDb();
  const docs = await db.collection('scans').find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => cleanDoc<ServerScanRecord>(d)!).filter(Boolean);
}

export async function dbGetScanById(scanId: string, userId: string): Promise<ServerScanRecord | null> {
  if (!scanId || !userId) return null;
  const db = await getMongoDb();
  const doc = await db.collection('scans').findOne({ id: scanId, userId });
  return cleanDoc<ServerScanRecord>(doc);
}

export async function dbSaveScan(
  userId: string,
  scanData: Omit<ServerScanRecord, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ServerScanRecord> {
  if (!userId) {
    throw new Error('Unauthorized: User ID is required to save scan to database.');
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();

  // ID Collision & Ownership Defense: Ensure existing scan record belongs strictly to authenticated user
  const existingScan = await db.collection('scans').findOne({ id: scanData.id });
  if (existingScan && existingScan.userId !== userId) {
    throw new Error('Forbidden: Cannot overwrite a scan record belonging to another user (IDOR protection).');
  }

  const record: ServerScanRecord = {
    ...scanData,
    userId, // Enforce immutable server userId
    createdAt: existingScan ? existingScan.createdAt : now,
    updatedAt: now,
  };

  const result = await db.collection('scans').updateOne(
    { id: record.id, userId },
    { $set: record },
    { upsert: true }
  );

  if (!result.acknowledged) {
    throw new Error('MongoDB write unacknowledged: Failed to persist scan record.');
  }

  return record;
}

export async function dbDeleteScan(scanId: string, userId: string): Promise<boolean> {
  if (!scanId || !userId) return false;
  const db = await getMongoDb();
  const res = await db.collection('scans').deleteOne({ id: scanId, userId });
  return Boolean(res.acknowledged && res.deletedCount && res.deletedCount > 0);
}

export async function dbClearUserScans(userId: string): Promise<void> {
  if (!userId) return;
  const db = await getMongoDb();
  await db.collection('scans').deleteMany({ userId });
}

// --- VISION HISTORY OPERATIONS ---

export async function dbGetVisionByUserId(userId: string): Promise<ServerVisionRecord[]> {
  if (!userId) return [];
  const db = await getMongoDb();
  const docs = await db.collection('vision_scans').find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => cleanDoc<ServerVisionRecord>(d)!).filter(Boolean);
}

export async function dbSaveVision(
  userId: string,
  item: Omit<ServerVisionRecord, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ServerVisionRecord> {
  if (!userId) {
    throw new Error('Unauthorized: User ID is required to save vision scan.');
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();

  const existingVision = await db.collection('vision_scans').findOne({ id: item.id });
  if (existingVision && existingVision.userId !== userId) {
    throw new Error('Forbidden: Cannot overwrite vision record belonging to another user (IDOR protection).');
  }

  const record: ServerVisionRecord = {
    ...item,
    userId, // Ownership boundary
    createdAt: existingVision ? existingVision.createdAt : now,
    updatedAt: now,
  };

  const result = await db.collection('vision_scans').updateOne(
    { id: record.id, userId },
    { $set: record },
    { upsert: true }
  );

  if (!result.acknowledged) {
    throw new Error('MongoDB write unacknowledged: Failed to persist vision record.');
  }

  return record;
}

/* ==========================================================================
   SUPER ADMIN DATABASE OPERATIONS & AUDIT LOGGING
   ========================================================================== */

/**
 * Ensures authoritative Super Admin account exists in MongoDB Atlas
 */
export async function ensureSuperAdminAccount(dbInstance?: Db): Promise<ServerUserRecord | null> {
  const db = dbInstance || (await getMongoDb());
  const adminUsername = (getEnv('SUPERADMIN_USERNAME', 'yaseenashu1874')).trim();
  const adminPassword = getEnv('SUPERADMIN_PASSWORD', 'Yaseen@1874');

  if (!adminUsername || !adminPassword) return null;

  const normUsername = adminUsername.toLowerCase();
  const existing = await db.collection('users').findOne({
    $or: [{ normalizedUsername: normUsername }, { username: adminUsername }, { role: 'superadmin' }],
  });

  if (existing) {
    if (existing.role !== 'superadmin' || existing.status !== 'active') {
      await db.collection('users').updateOne(
        { id: existing.id },
        { $set: { role: 'superadmin', status: 'active', updatedAt: new Date().toISOString() } }
      );
    }
    return cleanDoc<ServerUserRecord>({ ...existing, role: 'superadmin', status: 'active' });
  }

  // Hash initial password using PBKDF2-SHA256
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const hash = crypto.pbkdf2Sync(adminPassword, salt, iterations, 32, 'sha256').toString('hex');
  const passwordHash = `pbkdf2_sha256$${iterations}$${salt}$${hash}`;

  const now = new Date().toISOString();
  const superAdminRecord: ServerUserRecord = {
    id: `usr_superadmin_master`,
    email: 'admin@malvision.io',
    normalizedEmail: 'admin@malvision.io',
    username: adminUsername,
    normalizedUsername: normUsername,
    fullName: 'Super Admin',
    passwordHash,
    salt,
    provider: 'email',
    role: 'superadmin',
    status: 'active',
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection('users').insertOne({ ...superAdminRecord });
    console.log(`[MongoDB] Initialized Super Admin account: @${adminUsername} (role: superadmin)`);
    return superAdminRecord;
  } catch (err: any) {
    console.warn('[MongoDB] Super Admin initialization notice:', err?.message || err);
    const retry = await db.collection('users').findOne({ normalizedUsername: normUsername });
    return cleanDoc<ServerUserRecord>(retry);
  }
}

/**
 * Aggregates real MongoDB statistics for Super Admin dashboard
 */
export async function dbGetAdminStats() {
  const db = await getMongoDb();

  const [
    totalUsers,
    activeUsers,
    disabledUsers,
    superAdminUsers,
    totalScans,
    safeScans,
    suspiciousScans,
    maliciousScans,
    unknownScans,
    totalVisionScans,
    activeSessions,
    totalAuditLogs,
    recentUsersRaw,
    recentScansRaw,
    recentAuditRaw,
  ] = await Promise.all([
    db.collection('users').countDocuments({}),
    db.collection('users').countDocuments({ status: { $ne: 'disabled' } }),
    db.collection('users').countDocuments({ status: 'disabled' }),
    db.collection('users').countDocuments({ role: 'superadmin' }),
    db.collection('scans').countDocuments({}),
    db.collection('scans').countDocuments({ status: 'Safe' }),
    db.collection('scans').countDocuments({ status: 'Suspicious' }),
    db.collection('scans').countDocuments({ status: 'Malicious' }),
    db.collection('scans').countDocuments({ status: { $nin: ['Safe', 'Suspicious', 'Malicious'] } }),
    db.collection('vision_scans').countDocuments({}),
    db.collection('sessions').countDocuments({ expiresAt: { $gt: new Date() } }),
    db.collection('admin_audit_logs').countDocuments({}),
    db.collection('users').find({}).sort({ createdAt: -1 }).limit(5).toArray(),
    db.collection('scans').find({}).sort({ createdAt: -1 }).limit(5).toArray(),
    db.collection('admin_audit_logs').find({}).sort({ timestamp: -1 }).limit(5).toArray(),
  ]);

  return {
    totalUsers,
    activeUsers,
    disabledUsers,
    superAdminUsers,
    totalScans,
    safeScans,
    suspiciousScans,
    maliciousScans,
    unknownScans,
    totalVisionScans,
    activeSessions,
    totalAuditLogs,
    recentUsers: recentUsersRaw.map((u) => cleanDoc<ServerUserRecord>(u)!),
    recentScans: recentScansRaw.map((s) => cleanDoc<ServerScanRecord>(s)!),
    recentAuditLogs: recentAuditRaw.map((a) => cleanDoc<ServerAuditLogRecord>(a)!),
  };
}

/**
 * Super Admin: Search & Filter Users
 */
export async function dbGetAdminUsers(query: {
  search?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getMongoDb();
  const filter: any = {};

  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { normalizedEmail: { $regex: s, $options: 'i' } },
      { normalizedUsername: { $regex: s, $options: 'i' } },
      { fullName: { $regex: s, $options: 'i' } },
      { id: s },
    ];
  }

  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  const limit = Math.min(Math.max(query.limit || 50, 1), 200);
  const skip = Math.max(query.offset || 0, 0);

  const [total, users] = await Promise.all([
    db.collection('users').countDocuments(filter),
    db.collection('users').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return {
    total,
    users: users.map((u) => cleanDoc<ServerUserRecord>(u)!),
  };
}

/**
 * Super Admin: Get Full Detailed View of Target User
 */
export async function dbGetAdminUserDetail(userId: string) {
  const db = await getMongoDb();
  const user = await dbFindUserById(userId);
  if (!user) return null;

  const [scanCount, visionCount, sessionCount, recentScans, activeSessions, userAuditLogs] = await Promise.all([
    db.collection('scans').countDocuments({ userId }),
    db.collection('vision_scans').countDocuments({ userId }),
    db.collection('sessions').countDocuments({ userId }),
    db.collection('scans').find({ userId }).sort({ createdAt: -1 }).limit(10).toArray(),
    db.collection('sessions').find({ userId }).sort({ createdAt: -1 }).toArray(),
    db.collection('admin_audit_logs').find({ targetId: userId }).sort({ timestamp: -1 }).limit(20).toArray(),
  ]);

  return {
    user,
    scanCount,
    visionCount,
    sessionCount,
    recentScans: recentScans.map((s) => cleanDoc<ServerScanRecord>(s)!),
    activeSessions: activeSessions.map((s) => cleanDoc<ServerSessionRecord>(s)!),
    userAuditLogs: userAuditLogs.map((a) => cleanDoc<ServerAuditLogRecord>(a)!),
  };
}

/**
 * Super Admin: Update User Role/Status/Details with Last Super Admin Guard
 */
export async function dbUpdateUserByAdmin(
  _adminUserId: string,
  targetUserId: string,
  updates: { fullName?: string; username?: string; role?: 'user' | 'superadmin'; status?: 'active' | 'disabled' }
): Promise<{ success: boolean; error?: string; user?: ServerUserRecord }> {
  const db = await getMongoDb();
  const targetUser = await dbFindUserById(targetUserId);
  if (!targetUser) {
    return { success: false, error: 'Target user not found.' };
  }

  // Prevent demoting or disabling the ONLY Super Admin
  if (targetUser.role === 'superadmin') {
    const isDemoting = updates.role && updates.role !== 'superadmin';
    const isDisabled = updates.status && updates.status === 'disabled';

    if (isDemoting || isDisabled) {
      const superAdminCount = await db.collection('users').countDocuments({ role: 'superadmin', status: 'active' });
      if (superAdminCount <= 1) {
        return { success: false, error: 'Cannot demote or disable the last active Super Admin account.' };
      }
    }
  }

  const patch: any = { updatedAt: new Date().toISOString() };
  if (typeof updates.fullName === 'string' && updates.fullName.trim()) {
    patch.fullName = updates.fullName.trim();
  }

  if (typeof updates.username === 'string' && updates.username.trim()) {
    const cleanU = updates.username.trim();
    const normU = cleanU.toLowerCase();
    const existingU = await db.collection('users').findOne({ normalizedUsername: normU, id: { $ne: targetUserId } });
    if (existingU) {
      return { success: false, error: 'Username is already taken by another user.' };
    }
    patch.username = cleanU;
    patch.normalizedUsername = normU;
  }

  if (updates.role === 'user' || updates.role === 'superadmin') {
    patch.role = updates.role;
  }

  if (updates.status === 'active' || updates.status === 'disabled') {
    patch.status = updates.status;
  }

  const updatedDoc = await db.collection('users').findOneAndUpdate(
    { id: targetUserId },
    { $set: patch },
    { returnDocument: 'after' }
  );

  const finalUser = cleanDoc<ServerUserRecord>(updatedDoc);
  return { success: true, user: finalUser || targetUser };
}

/**
 * Super Admin: Delete User Account & Cascade Cleanup
 */
export async function dbDeleteUserByAdmin(
  _adminUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  const db = await getMongoDb();
  const targetUser = await dbFindUserById(targetUserId);
  if (!targetUser) {
    return { success: false, error: 'Target user account not found.' };
  }

  // Prevent deleting the last Super Admin
  if (targetUser.role === 'superadmin') {
    const superAdminCount = await db.collection('users').countDocuments({ role: 'superadmin' });
    if (superAdminCount <= 1) {
      return { success: false, error: 'Cannot delete the only Super Admin account.' };
    }
  }

  const userRes = await db.collection('users').deleteOne({ id: targetUserId });
  const sessRes = await db.collection('sessions').deleteMany({ userId: targetUserId });
  const scanRes = await db.collection('scans').deleteMany({ userId: targetUserId });
  const visRes = await db.collection('vision_scans').deleteMany({ userId: targetUserId });

  const totalDeleted = (userRes.deletedCount || 0) + (sessRes.deletedCount || 0) + (scanRes.deletedCount || 0) + (visRes.deletedCount || 0);

  return { success: true, deletedCount: totalDeleted };
}

/**
 * Super Admin: Search & Filter All Scans
 */
export async function dbGetAdminScans(query: { search?: string; status?: string; targetType?: string; userId?: string; limit?: number; offset?: number }) {
  const db = await getMongoDb();
  const filter: any = {};
  if (query.search) {
    filter.$or = [
      { target: { $regex: query.search.trim(), $options: 'i' } },
      { id: query.search.trim() },
    ];
  }
  if (query.status) filter.status = query.status;
  if (query.targetType) filter.targetType = query.targetType;
  if (query.userId) filter.userId = query.userId;

  const limit = Math.min(Math.max(query.limit || 50, 1), 200);
  const skip = Math.max(query.offset || 0, 0);

  const [total, scans] = await Promise.all([
    db.collection('scans').countDocuments(filter),
    db.collection('scans').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return { total, scans: scans.map((s) => cleanDoc<ServerScanRecord>(s)!) };
}

export async function dbDeleteScanByAdmin(scanId: string): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection('scans').deleteOne({ id: scanId });
  return Boolean(res.acknowledged && res.deletedCount > 0);
}

/**
 * Super Admin: Search & Filter All Vision Scans
 */
export async function dbGetAdminVisionScans(query: { search?: string; classification?: string; userId?: string; limit?: number; offset?: number }) {
  const db = await getMongoDb();
  const filter: any = {};
  if (query.search) {
    filter.$or = [
      { imageName: { $regex: query.search.trim(), $options: 'i' } },
      { prompt: { $regex: query.search.trim(), $options: 'i' } },
      { id: query.search.trim() },
    ];
  }
  if (query.classification) filter.threatClassification = query.classification;
  if (query.userId) filter.userId = query.userId;

  const limit = Math.min(Math.max(query.limit || 50, 1), 200);
  const skip = Math.max(query.offset || 0, 0);

  const [total, items] = await Promise.all([
    db.collection('vision_scans').countDocuments(filter),
    db.collection('vision_scans').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return { total, items: items.map((i) => cleanDoc<ServerVisionRecord>(i)!) };
}

export async function dbDeleteVisionScanByAdmin(visionId: string): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection('vision_scans').deleteOne({ id: visionId });
  return Boolean(res.acknowledged && res.deletedCount > 0);
}

/**
 * Super Admin: List Sessions with Redacted Tokens
 */
export async function dbGetAdminSessions(query: { userId?: string; limit?: number; offset?: number }) {
  const db = await getMongoDb();
  const filter: any = {};
  if (query.userId) filter.userId = query.userId;

  const limit = Math.min(Math.max(query.limit || 50, 1), 200);
  const skip = Math.max(query.offset || 0, 0);

  const [total, docs] = await Promise.all([
    db.collection('sessions').countDocuments(filter),
    db.collection('sessions').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  // Mask session tokens for admin UI security
  const sessions = docs.map((d) => {
    const s = cleanDoc<ServerSessionRecord>(d)!;
    const maskedId = s.sessionId ? `${s.sessionId.substring(0, 8)}...${s.sessionId.substring(s.sessionId.length - 4)}` : 'sess_****';
    return { ...s, maskedSessionId: maskedId, rawSessionId: s.sessionId };
  });

  return { total, sessions };
}

export async function dbRevokeSessionByAdmin(sessionId: string): Promise<boolean> {
  const db = await getMongoDb();
  const res = await db.collection('sessions').deleteOne({ sessionId });
  return Boolean(res.acknowledged && res.deletedCount > 0);
}

export async function dbRevokeUserSessionsByAdmin(userId: string): Promise<number> {
  const db = await getMongoDb();
  const res = await db.collection('sessions').deleteMany({ userId });
  return res.deletedCount || 0;
}

/**
 * Super Admin: Audit Logging
 */
export async function dbLogAdminAction(entry: {
  adminUserId: string;
  adminUsername: string;
  action: string;
  targetType: 'user' | 'scan' | 'vision' | 'session' | 'security' | 'system';
  targetId?: string;
  details?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success?: boolean;
}): Promise<ServerAuditLogRecord> {
  const db = await getMongoDb();
  const record: ServerAuditLogRecord = {
    id: `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    adminUserId: entry.adminUserId,
    adminUsername: entry.adminUsername || 'admin',
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details || '',
    metadata: entry.metadata || {},
    ip: entry.ip || '127.0.0.1',
    userAgent: entry.userAgent || 'MalVision-Admin-Client',
    timestamp: new Date().toISOString(),
    success: entry.success !== undefined ? entry.success : true,
  };

  try {
    await db.collection('admin_audit_logs').insertOne({ ...record });
  } catch (err) {
    console.warn('[MongoDB] Audit log write notice:', err);
  }

  return record;
}

export async function dbGetAdminAuditLogs(query: { limit?: number; offset?: number; targetType?: string; action?: string }) {
  const db = await getMongoDb();
  const filter: any = {};
  if (query.targetType) filter.targetType = query.targetType;
  if (query.action) filter.action = query.action;

  const limit = Math.min(Math.max(query.limit || 50, 1), 200);
  const skip = Math.max(query.offset || 0, 0);

  const [total, logs] = await Promise.all([
    db.collection('admin_audit_logs').countDocuments(filter),
    db.collection('admin_audit_logs').find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
  ]);

  return { total, logs: logs.map((l) => cleanDoc<ServerAuditLogRecord>(l)!) };
}
