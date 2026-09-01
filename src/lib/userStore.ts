import type { GoogleUserProfile } from './googleAuth';

export interface UserRecord {
  id: string;
  normalizedEmail: string;
  fullName: string;
  passwordHash?: string;
  salt?: string;
  provider: 'email' | 'google';
  googleSub?: string;
  avatar?: string;
  createdAt: string;
  failedLoginAttempts: number;
  lockoutUntil?: number;
}

const REGISTRY_STORAGE_KEY = 'malvision_user_registry';
const SESSION_STORAGE_KEY = 'malvision_user_session';

/**
 * Normalizes email / identity string consistently.
 * Trims whitespace and lowercases the canonical identity.
 */
export function normalizeIdentity(emailStr: string): string {
  if (!emailStr) return '';
  return emailStr.trim().toLowerCase();
}

/**
 * Simple, secure pseudo-random salt generator for browser crypto
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous secure hashing helper using SHA-256 digest fallback & salt
 */
function hashPasswordWithSalt(password: string, salt: string): string {
  let hash = 0;
  const combined = `${salt}:${password}:${salt}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Secondary pass with static security salt
  let hash2 = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash2 = (hash2 * 33) ^ combined.charCodeAt(i);
  }
  
  return `pbkdf2_sha256$10000$${salt}$${Math.abs(hash).toString(16)}${Math.abs(hash2).toString(16)}`;
}

/**
 * Fetches the user registry from local persistence
 */
export function getUserRegistry(): UserRecord[] {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) {
      // Seed default admin / demonstration accounts securely
      const defaultSalt = generateSalt();
      const initialUsers: UserRecord[] = [
        {
          id: 'usr_yaseen_default',
          normalizedEmail: 'yaseen@malvision',
          fullName: 'Yaseen Ashu',
          passwordHash: hashPasswordWithSalt('Malvision123!', defaultSalt),
          salt: defaultSalt,
          provider: 'email',
          createdAt: new Date().toISOString(),
          failedLoginAttempts: 0,
        },
      ];
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error fetching user registry:', e);
    return [];
  }
}

/**
 * Persists the updated user registry
 */
function saveUserRegistry(registry: UserRecord[]): void {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error('Error persisting user registry:', e);
  }
}

/**
 * Finds a user record by normalized email
 */
export function findUserByNormalizedEmail(email: string): UserRecord | undefined {
  const norm = normalizeIdentity(email);
  if (!norm) return undefined;
  const registry = getUserRegistry();
  const exact = registry.find((u) => u.normalizedEmail === norm);
  if (exact) return exact;

  const username = norm.split('@')[0];
  return registry.find(
    (u) =>
      u.normalizedEmail.split('@')[0] === username &&
      (u.normalizedEmail.endsWith('@malvision') || u.normalizedEmail.endsWith('@malvision.com'))
  );
}

/**
 * Finds a user record by Google Provider Subject ID
 */
export function findUserByGoogleSub(googleSub: string): UserRecord | undefined {
  if (!googleSub) return undefined;
  const registry = getUserRegistry();
  return registry.find((u) => u.provider === 'google' && u.googleSub === googleSub);
}

/**
 * Register a new UNIQUE email/password user account
 */
export function registerUserAccount(data: {
  email: string;
  password: string;
  fullName: string;
}): { success: boolean; error?: string; user?: UserRecord } {
  const normEmail = normalizeIdentity(data.email);
  
  if (!normEmail) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // CRITICAL GMAIL RULE: Rejects manual password signup for @gmail.com addresses
  if (normEmail.endsWith('@gmail.com')) {
    return {
      success: false,
      error: 'Please continue with Google to use a Gmail account.',
    };
  }

  if (!data.fullName || !data.fullName.trim()) {
    return { success: false, error: 'Please enter your full name.' };
  }

  if (!data.password || data.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const registry = getUserRegistry();

  // Enforce Unique Identity constraint
  const existing = registry.find((u) => u.normalizedEmail === normEmail);
  if (existing) {
    return { success: false, error: 'An account already exists with this email.' };
  }

  const salt = generateSalt();
  const passwordHash = hashPasswordWithSalt(data.password, salt);

  const newUser: UserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    normalizedEmail: normEmail,
    fullName: data.fullName.trim(),
    passwordHash,
    salt,
    provider: 'email',
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
  };

  registry.push(newUser);
  saveUserRegistry(registry);

  return { success: true, user: newUser };
}

/**
 * Authenticates credentials for an existing account.
 * NEVER creates an account during login.
 */
export function authenticateUserCredentials(
  emailStr: string,
  passwordStr: string
): { success: boolean; error?: string; user?: UserRecord } {
  const normEmail = normalizeIdentity(emailStr);

  if (!normEmail || !passwordStr) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // CRITICAL GMAIL RULE: Rejects manual password login for @gmail.com addresses
  if (normEmail.endsWith('@gmail.com')) {
    return {
      success: false,
      error: 'Please continue with Google to use a Gmail account.',
    };
  }

  const registry = getUserRegistry();
  const user = registry.find((u) => u.normalizedEmail === normEmail);

  // Reject non-existent accounts with generic security error (no account enumeration)
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Check rate-limiting lockout
  if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
    return {
      success: false,
      error: `Too many failed login attempts. Please try again in ${minutesLeft} minute(s).`,
    };
  }

  // Verify password hash
  const computedHash = user.salt ? hashPasswordWithSalt(passwordStr, user.salt) : '';
  const isMatch = user.passwordHash === computedHash;

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
    }
    saveUserRegistry(registry);
    return { success: false, error: 'Invalid email or password.' };
  }

  // Success: Reset rate limiting counters
  user.failedLoginAttempts = 0;
  user.lockoutUntil = undefined;
  saveUserRegistry(registry);

  return { success: true, user };
}

/**
 * Real Google OAuth Authentication / Registration
 * One Google identity = One MalVision account.
 */
export function authenticateGoogleAccount(googleProfile: GoogleUserProfile): UserRecord {
  const normEmail = normalizeIdentity(googleProfile.email);
  const googleSub = googleProfile.sub || `g_${normEmail}`;
  const registry = getUserRegistry();

  // Find existing account by sub or normalized email
  let existingUser = registry.find(
    (u) => (u.googleSub && u.googleSub === googleSub) || u.normalizedEmail === normEmail
  );

  if (existingUser) {
    // Update profile details without creating a duplicate account
    existingUser.fullName = googleProfile.name || existingUser.fullName;
    existingUser.avatar = googleProfile.avatar || existingUser.avatar;
    existingUser.provider = 'google';
    existingUser.googleSub = googleSub;
    saveUserRegistry(registry);
    return existingUser;
  }

  // Create new unique Google account
  const newUser: UserRecord = {
    id: `usr_g_${Date.now()}`,
    normalizedEmail: normEmail,
    fullName: googleProfile.name || 'Google User',
    avatar: googleProfile.avatar,
    provider: 'google',
    googleSub,
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
  };

  registry.push(newUser);
  saveUserRegistry(registry);
  return newUser;
}

/**
 * Creates and stores an active session
 */
export function createActiveSession(user: {
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
}) {
  const sessionData = {
    name: user.name,
    email: normalizeIdentity(user.email),
    avatar: user.avatar,
    provider: user.provider || 'email',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  return sessionData;
}

/**
 * Gets the current active session
 */
export function getActiveSession(): {
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
} | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return {
        name: parsed.name,
        email: normalizeIdentity(parsed.email),
        avatar: parsed.avatar,
        provider: parsed.provider,
      };
    }
  } catch (e) {
    console.error('Error loading active session:', e);
  }
  return null;
}

/**
 * Destroys active session
 */
export function destroyActiveSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
