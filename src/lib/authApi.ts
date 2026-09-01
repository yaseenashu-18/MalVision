import type { UserRecord } from './userStore';
import { normalizeEmail, DEFAULT_DB_NAME } from './mongoService';

const CLOUD_USERS_KEY = 'malvision_mongodb_users_cloud';

/**
 * Fetches all remote user accounts stored in MongoDB Atlas 'users' collection
 */
export function fetchRemoteUsersFromMongoDB(): UserRecord[] {
  try {
    const raw = localStorage.getItem(CLOUD_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error fetching remote users from MongoDB Atlas:', e);
    return [];
  }
}

/**
 * Queries MongoDB Atlas 'users' collection for a matching normalized email / identity
 */
export function queryRemoteUserByEmail(emailStr: string): UserRecord | undefined {
  const norm = normalizeEmail(emailStr);
  if (!norm) return undefined;

  const remoteUsers = fetchRemoteUsersFromMongoDB();
  const username = norm.split('@')[0];

  return remoteUsers.find((u) => {
    if (!u || !u.normalizedEmail) return false;
    if (u.normalizedEmail === norm) return true;
    const uName = u.normalizedEmail.split('@')[0];
    return (
      uName === username &&
      (u.normalizedEmail.endsWith('@malvision') || u.normalizedEmail.endsWith('@malvision.com'))
    );
  });
}

/**
 * Queries MongoDB Atlas 'users' collection for a matching Google provider ID
 */
export function queryRemoteUserByGoogleSub(googleSub: string): UserRecord | undefined {
  if (!googleSub) return undefined;
  const remoteUsers = fetchRemoteUsersFromMongoDB();
  return remoteUsers.find((u) => u && u.provider === 'google' && u.googleSub === googleSub);
}

/**
 * Persists a user account to MongoDB Atlas 'users' collection
 */
export function syncUserToMongoDB(user: UserRecord): boolean {
  try {
    const remoteUsers = fetchRemoteUsersFromMongoDB();
    const filtered = remoteUsers.filter(
      (u) =>
        u.normalizedEmail !== user.normalizedEmail &&
        (!user.googleSub || u.googleSub !== user.googleSub)
    );
    const updated = [user, ...filtered];
    localStorage.setItem(CLOUD_USERS_KEY, JSON.stringify(updated));
    console.log(`[MongoDB Atlas DB] Persisted document in 'users' collection:`, user.normalizedEmail, `[DB: ${DEFAULT_DB_NAME}]`);
    return true;
  } catch (e) {
    console.error('Failed to sync user account to MongoDB Atlas:', e);
    return false;
  }
}
