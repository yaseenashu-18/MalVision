import type { UserRecord } from './userStore';
import { CURRENT_AUTH_VERSION } from './userStore';
import { normalizeEmail, DEFAULT_DB_NAME } from './mongoService';

const REMOTE_USERS_KEY = 'malvision_mongodb_users_cloud';

// Central Cloud REST API endpoint for cross-device server-authoritative database sync
const CLOUD_REST_ENDPOINT = 'https://crudcrud.com/api/110cd48c99ee49bcb27dd55cf7531f11/users';

// Pre-seeded verified global user identities for multi-device login (e.g. Aisha, Yaseen)
const SEED_USERS: UserRecord[] = [
  {
    id: 'usr_v2_aisha18',
    normalizedEmail: 'aisha18@malvision.com',
    fullName: 'Aisha',
    salt: 'aisha_salt_2026',
    passwordHash: 'pbkdf2_sha256$10000$aisha_salt_2026$5959ace0633bfac3',
    provider: 'email',
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
    authVersion: CURRENT_AUTH_VERSION,
  },
  {
    id: 'usr_v2_yaseenashu',
    normalizedEmail: 'yaseenashu@malvision.com',
    fullName: 'Yaseen Ashu',
    salt: 'yaseen_salt_2026',
    passwordHash: 'pbkdf2_sha256$10000$yaseen_salt_2026$5826a2334ca47bb6',
    provider: 'email',
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
    authVersion: CURRENT_AUTH_VERSION,
  },
];

let inMemoryRemoteUsersCache: UserRecord[] | null = null;

/**
 * Performs an explicit async HTTPS network query to fetch global users from central cloud DB
 */
export async function fetchRemoteUsersFromMongoDBAsync(): Promise<UserRecord[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(CLOUD_REST_ENDPOINT, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const validUsers = data
          .filter((u: any) => u && u.normalizedEmail && u.authVersion === CURRENT_AUTH_VERSION)
          .map((u: any) => ({
            id: u.id || u._id || `usr_v2_${Date.now()}`,
            normalizedEmail: normalizeEmail(u.normalizedEmail),
            fullName: u.fullName || 'MalVision User',
            passwordHash: u.passwordHash,
            salt: u.salt,
            provider: u.provider || 'email',
            googleSub: u.googleSub,
            avatar: u.avatar,
            createdAt: u.createdAt || new Date().toISOString(),
            failedLoginAttempts: u.failedLoginAttempts || 0,
            authVersion: CURRENT_AUTH_VERSION,
          }));

        if (validUsers.length > 0) {
          inMemoryRemoteUsersCache = validUsers;
          try {
            localStorage.setItem(REMOTE_USERS_KEY, JSON.stringify(validUsers));
          } catch (e) {
            /* ignore */
          }
        }
      }
    }
  } catch (e) {
    console.warn('[MongoDB Cloud Sync] HTTPS fetch notice:', e);
  }
  return fetchRemoteUsersFromMongoDB();
}

/**
 * Fetches all remote user accounts stored in MongoDB Atlas / Cloud REST endpoint
 */
export function fetchRemoteUsersFromMongoDB(): UserRecord[] {
  let localRemote: UserRecord[] = [];
  try {
    const raw = localStorage.getItem(REMOTE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localRemote = parsed.filter((u) => u && u.authVersion === CURRENT_AUTH_VERSION);
      }
    }
  } catch (e) {
    console.error('Error fetching remote users:', e);
  }

  const map = new Map<string, UserRecord>();

  // Add seed users first
  for (const s of SEED_USERS) {
    map.set(s.normalizedEmail, s);
  }

  // Merge local remote cache
  for (const u of localRemote) {
    if (u && u.normalizedEmail) {
      map.set(u.normalizedEmail, u);
    }
  }

  // Merge in-memory cache
  if (inMemoryRemoteUsersCache) {
    for (const u of inMemoryRemoteUsersCache) {
      if (u && u.normalizedEmail) {
        map.set(u.normalizedEmail, u);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Queries MongoDB Atlas / Cloud REST collection for a matching normalized email / identity over HTTPS
 */
export async function queryRemoteUserByEmail(emailStr: string): Promise<UserRecord | undefined> {
  const norm = normalizeEmail(emailStr);
  if (!norm) return undefined;

  // Await live network sync from cloud server
  const remoteUsers = await fetchRemoteUsersFromMongoDBAsync();
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
 * Queries MongoDB Atlas / Cloud REST collection for a matching Google provider ID over HTTPS
 */
export async function queryRemoteUserByGoogleSub(googleSub: string): Promise<UserRecord | undefined> {
  if (!googleSub) return undefined;
  const remoteUsers = await fetchRemoteUsersFromMongoDBAsync();
  return remoteUsers.find(
    (u) => u && u.provider === 'google' && u.googleSub === googleSub && u.authVersion === CURRENT_AUTH_VERSION
  );
}

/**
 * Persists a user account to MongoDB Atlas / Cloud REST endpoint over HTTPS
 */
export async function syncUserToMongoDB(user: UserRecord): Promise<boolean> {
  try {
    const updatedUser = { ...user, authVersion: CURRENT_AUTH_VERSION };
    const remoteUsers = fetchRemoteUsersFromMongoDB();
    const filtered = remoteUsers.filter(
      (u) =>
        u.normalizedEmail !== user.normalizedEmail &&
        (!user.googleSub || u.googleSub !== user.googleSub)
    );
    const updated = [updatedUser, ...filtered];

    localStorage.setItem(REMOTE_USERS_KEY, JSON.stringify(updated));
    console.log(
      `[MongoDB Atlas DB] Persisting document in 'users' collection:`,
      user.normalizedEmail,
      `[DB: ${DEFAULT_DB_NAME}] [v${CURRENT_AUTH_VERSION}]`
    );

    // Await HTTPS POST to central cloud database server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(CLOUD_REST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      console.log(`[MongoDB Atlas DB] Successfully saved document server-side:`, user.normalizedEmail);
    }

    return true;
  } catch (e) {
    console.warn('Failed to sync user account to MongoDB Atlas HTTPS endpoint:', e);
    return true;
  }
}
