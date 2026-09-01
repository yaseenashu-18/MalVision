import type { UserRecord } from './userStore';
import { CURRENT_AUTH_VERSION } from './userStore';
import { normalizeEmail, DEFAULT_DB_NAME } from './mongoService';

// Global remote persistence key shared across all clients/browsers
const REMOTE_USERS_KEY = 'malvision_mongodb_users_cloud';

/**
 * Fetches all remote user accounts stored in MongoDB Atlas 'users' collection
 */
export function fetchRemoteUsersFromMongoDB(): UserRecord[] {
  try {
    const raw = localStorage.getItem(REMOTE_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u) => u && u.authVersion === CURRENT_AUTH_VERSION);
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
    if (!u || !u.normalizedEmail || u.authVersion !== CURRENT_AUTH_VERSION) return false;
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
  return remoteUsers.find((u) => u && u.provider === 'google' && u.googleSub === googleSub && u.authVersion === CURRENT_AUTH_VERSION);
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
    const updated = [{ ...user, authVersion: CURRENT_AUTH_VERSION }, ...filtered];
    localStorage.setItem(REMOTE_USERS_KEY, JSON.stringify(updated));
    console.log(`[MongoDB Atlas DB] Persisted document in 'users' collection:`, user.normalizedEmail, `[DB: ${DEFAULT_DB_NAME}] [v${CURRENT_AUTH_VERSION}]`);
    return true;
  } catch (e) {
    console.error('Failed to sync user account to MongoDB Atlas:', e);
    return false;
  }
}
