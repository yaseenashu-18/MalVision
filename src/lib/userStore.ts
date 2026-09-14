import type { GoogleUserProfile } from './googleAuth';
import { apiSignup, apiLogin, apiGoogleAuth, apiLogout, apiUpdateProfile } from './authApi';
import { broadcastSyncEvent } from './syncChannel';

export interface UserRecord {
  id: string; // Immutable identifier (usr_...)
  normalizedEmail: string;
  username?: string;
  fullName: string;
  passwordHash?: string;
  salt?: string;
  provider: 'email' | 'google';
  role?: 'user' | 'superadmin';
  status?: 'active' | 'disabled';
  googleSub?: string;
  avatar?: string;
  createdAt: string;
  failedLoginAttempts: number;
  lockoutUntil?: number;
  authVersion?: number;
}

export const CURRENT_AUTH_VERSION = 2;

const SESSION_STORAGE_KEY = 'malvision_active_user_cache';

/**
 * Normalizes email / identity string consistently.
 * Trims whitespace and lowercases canonical identity.
 */
export function normalizeIdentity(emailStr: string): string {
  if (!emailStr) return '';
  return emailStr.trim().toLowerCase();
}

/**
 * Extracts clean username without email domain (e.g. 'yaseenashu18@gmail.com' -> 'yaseenashu18')
 */
export function extractUsername(emailOrUsername?: string): string {
  if (!emailOrUsername) return 'guest';
  const clean = emailOrUsername.trim();
  if (clean.includes('@')) {
    return clean.split('@')[0];
  }
  return clean;
}

/**
 * Validates strict username format [a-z0-9_]+ for Signup
 */
export function validateUsernameFormat(usernameStr: string): { valid: boolean; error?: string; cleanUsername?: string } {
  if (!usernameStr) {
    return { valid: false, error: 'Please enter a username.' };
  }

  const clean = usernameStr.trim().toLowerCase();

  if (clean.includes(' ') || clean.includes('/') || clean.includes('\\')) {
    return { valid: false, error: 'Username cannot contain spaces or slashes.' };
  }

  const validRegex = /^[a-z0-9_]+$/;
  if (!validRegex.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores.' };
  }

  return { valid: true, cleanUsername: clean };
}

/**
 * Validates complete username or email address for Login
 */
export function validateLoginEmail(inputStr: string): { valid: boolean; error?: string; cleanEmail?: string } {
  if (!inputStr) {
    return { valid: false, error: 'Please enter your username.' };
  }

  const clean = inputStr.trim().toLowerCase();
  return { valid: true, cleanEmail: clean };
}

/**
 * Register a new UNIQUE user account authoritatively via Server API & MongoDB Atlas
 */
export async function registerUserAccount(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ success: boolean; error?: string; user?: UserRecord }> {
  const cleanUser = extractUsername(data.email);
  const usernameCheck = validateUsernameFormat(cleanUser);

  if (!usernameCheck.valid) {
    return { success: false, error: usernameCheck.error };
  }

  const normUsername = usernameCheck.cleanUsername || cleanUser;

  // Authoritative Server API Registration (Persists directly to MongoDB Atlas)
  const res = await apiSignup({
    email: data.email,
    username: normUsername,
    password: data.password,
    fullName: data.fullName,
  });

  if (res.success && res.user) {
    createActiveSession({
      id: res.user.id,
      sessionId: res.sessionId,
      name: res.user.fullName,
      email: res.user.normalizedEmail,
      username: res.user.username,
      avatar: res.user.avatar,
      provider: res.user.provider,
      role: (res.user.role as 'user' | 'superadmin') || 'user',
    });

    broadcastSyncEvent('malvision:auth-changed', { userId: res.user.id });
    return { success: true, user: res.user };
  }

  return { success: false, error: res.error || 'Failed to create user account in database.' };
}

/**
 * Authenticates credentials authoritatively via Server API & MongoDB Atlas
 */
export async function authenticateUserCredentials(
  emailStr: string,
  passwordStr: string
): Promise<{ success: boolean; error?: string; user?: UserRecord }> {
  if (!emailStr || !passwordStr) {
    return { success: false, error: 'Please enter your username and password.' };
  }

  // Authoritative Server API Login
  const res = await apiLogin(emailStr, passwordStr);
  if (res.success && res.user) {
    createActiveSession({
      id: res.user.id,
      sessionId: res.sessionId,
      name: res.user.fullName,
      email: res.user.normalizedEmail,
      username: res.user.username,
      avatar: res.user.avatar,
      provider: res.user.provider,
      role: (res.user.role as 'user' | 'superadmin') || 'user',
    });

    broadcastSyncEvent('malvision:auth-changed', { userId: res.user.id });
    return { success: true, user: res.user };
  }

  return { success: false, error: res.error || 'Invalid username or password.' };
}

/**
 * Google OAuth Authentication authoritatively via Server API & MongoDB Atlas
 */
export async function authenticateGoogleAccount(googleProfile: GoogleUserProfile): Promise<UserRecord> {
  const normEmail = normalizeIdentity(googleProfile.email);
  const cleanName = googleProfile.name || extractUsername(googleProfile.email) || 'Google User';
  const googleSub = googleProfile.sub || `g_${normEmail}`;

  // Authoritative Server API Google Auth (Persists directly to MongoDB Atlas)
  const res = await apiGoogleAuth({
    sub: googleSub,
    email: googleProfile.email,
    name: cleanName,
    avatar: googleProfile.avatar,
  });

  if (res.success && res.user) {
    createActiveSession({
      id: res.user.id,
      sessionId: res.sessionId,
      name: res.user.fullName,
      email: res.user.normalizedEmail,
      username: res.user.username,
      avatar: res.user.avatar,
      provider: 'google',
      role: (res.user.role as 'user' | 'superadmin') || 'user',
    });
    broadcastSyncEvent('malvision:auth-changed', { userId: res.user.id });
    return res.user;
  }

  throw new Error(res.error || 'Failed to authenticate Google user in database.');
}

/**
 * Caches local session representation for UX responsiveness
 */
export function createActiveSession(user: {
  id?: string;
  sessionId?: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  provider?: string;
  role?: 'user' | 'superadmin';
  status?: 'active' | 'disabled';
}) {
  const existing = getActiveSession();
  const rawEmail = normalizeIdentity(user.email || existing?.email || '');
  const cleanEmail = rawEmail.includes('@malvision.local') ? '' : rawEmail;
  const sessionData = {
    id: user.id || existing?.id || `usr_${Date.now()}`,
    sessionId: user.sessionId || existing?.sessionId || '',
    name: user.name || existing?.name || 'User',
    email: cleanEmail,
    username: user.username !== undefined ? user.username : (existing?.username || ''),
    avatar: user.avatar !== undefined ? user.avatar : existing?.avatar,
    provider: user.provider || existing?.provider || 'email',
    role: user.role || existing?.role || 'user',
    status: user.status || existing?.status || 'active',
    authVersion: CURRENT_AUTH_VERSION,
    createdAt: new Date().toISOString(),
  };
  try {
    const raw = JSON.stringify(sessionData);
    sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
    localStorage.setItem(SESSION_STORAGE_KEY, raw);
    localStorage.setItem('malvision_user_session', raw);
  } catch {
    /* ignore */
  }
  return sessionData;
}

/**
 * Gets cached active session payload
 */
export function getActiveSession(): {
  id?: string;
  sessionId?: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  provider?: string;
  role?: 'user' | 'superadmin';
  status?: 'active' | 'disabled';
  wasResetInvalidated?: boolean;
} | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || 
                localStorage.getItem(SESSION_STORAGE_KEY) || 
                localStorage.getItem('malvision_user_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed.email === 'string') {
      const norm = normalizeIdentity(parsed.email);
      const cleanEmail = norm.includes('@malvision.local') ? '' : norm;
      return {
        id: parsed.id,
        sessionId: parsed.sessionId,
        name: parsed.name,
        email: cleanEmail,
        username: parsed.username || '',
        avatar: parsed.avatar,
        provider: parsed.provider,
        role: parsed.role || 'user',
        status: parsed.status || 'active',
      };
    }
  } catch (e) {
    /* ignore */
  }
  return null;
}

/**
 * Destroys active local session cache
 */
export function destroyActiveSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('malvision_user_session');
    sessionStorage.clear();
  } catch (e) {
    /* ignore */
  }
}

/**
 * Unified Web/Mobile Sign Out function
 */
export async function performSignOut() {
  await apiLogout();
  destroyActiveSession();

  broadcastSyncEvent('malvision:auth-changed');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('malvision_logout'));
  }
}

/**
 * Updates user profile authoritatively via Server API & MongoDB Atlas
 */
export async function updateUserProfileInStore(
  _emailOrUsername: string,
  updates: { fullName?: string; avatar?: string; username?: string }
): Promise<{ success: boolean; error?: string; user?: UserRecord }> {
  const res = await apiUpdateProfile(updates);

  if (res.success && res.user) {
    createActiveSession({
      id: res.user.id,
      name: res.user.fullName,
      email: res.user.normalizedEmail,
      username: res.user.username,
      avatar: res.user.avatar,
      provider: res.user.provider,
    });

    broadcastSyncEvent('malvision:auth-changed', { userId: res.user.id });
    return { success: true, user: res.user };
  }

  return { success: false, error: res.error || 'Failed to update user profile in database.' };
}
