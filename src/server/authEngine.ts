import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  dbFindUserById,
  dbGetSession,
  dbGetActiveSessionsForUser,
  type ServerUserRecord,
} from './db.js';


export const SESSION_COOKIE_NAME = 'malvision_session';

// --- RATE LIMITING ---
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string, action: string, maxLimit: number = 10, windowMs: number = 60000): { allowed: boolean; retryAfterSec?: number } {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxLimit) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true };
}

// --- PASSWORD SECURITY (PBKDF2-HMAC-SHA256, CS-RNG Salt) ---

export function generateSecureSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  const iterations = 10000;
  const keylen = 32;
  const digest = 'sha256';
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('pbkdf2_sha256$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const originalHex = parts[3];

  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const computedHex = hash.toString('hex');

  // Constant-time string comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHex, 'hex'), Buffer.from(originalHex, 'hex'));
  } catch {
    return false;
  }
}

// --- COOKIE PARSING AND SETTING ---

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (name) {
        list[name] = decodeURIComponent(val);
      }
    });
  }

  return list;
}

export function setSessionCookie(res: ServerResponse, sessionId: string) {
  // Production-grade HttpOnly + Secure + SameSite=Lax cookie
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=604800', // 7 days
  ];

  if (isProd) {
    cookieOptions.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieOptions.join('; '));
}

export function clearSessionCookie(res: ServerResponse) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
  ];

  if (isProd) {
    cookieOptions.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieOptions.join('; '));
}

// --- AUTHENTICATION CONTEXT ---

export async function getAuthenticatedUserFromReq(req: IncomingMessage): Promise<ServerUserRecord | null> {
  const cookies = parseCookies(req);
  const cookieSessionId = cookies[SESSION_COOKIE_NAME];
  const headerSessionId = (req.headers['x-malvision-session-id'] as string) || '';
  const authHeader = (req.headers['authorization'] as string) || '';

  let bearerSessionId = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.startsWith('sess_')) {
      bearerSessionId = token;
    }
  }

  const explicitSessionId = cookieSessionId || headerSessionId || bearerSessionId;

  // 1. If explicit session ID is provided, it MUST exist in DB (otherwise session was revoked or expired!)
  if (explicitSessionId) {
    const session = await dbGetSession(explicitSessionId);
    if (session) {
      const user = await dbFindUserById(session.userId);
      if (user && user.status === 'active') return user;
    }
    // Session explicitly provided but not found in DB = REVOKED / EXPIRED SESSION!
    return null;
  }

  // 2. Fallback: If no session ID was provided at all, check user ID header/token ONLY if user has active sessions in DB
  let fallbackUserId = '';
  if (authHeader && authHeader.startsWith('Bearer usr_')) {
    fallbackUserId = authHeader.substring(7).trim();
  } else {
    fallbackUserId = (req.headers['x-malvision-user-id'] as string) || '';
  }

  if (fallbackUserId && fallbackUserId.startsWith('usr_')) {
    const activeSessions = await dbGetActiveSessionsForUser(fallbackUserId);
    if (activeSessions && activeSessions.length > 0) {
      const user = await dbFindUserById(fallbackUserId);
      if (user && user.status === 'active') return user;
    }
  }

  return null;
}

// --- SUPER ADMIN AUTHORIZATION GUARD ---

export async function requireSuperAdmin(req: IncomingMessage): Promise<{
  authenticated: boolean;
  authorized: boolean;
  user: ServerUserRecord | null;
  status: number;
  error?: string;
}> {
  const user = await getAuthenticatedUserFromReq(req);
  if (!user) {
    return {
      authenticated: false,
      authorized: false,
      user: null,
      status: 401,
      error: 'Unauthorized: Active server session required.',
    };
  }

  if (user.status === 'disabled') {
    return {
      authenticated: true,
      authorized: false,
      user,
      status: 403,
      error: 'Forbidden: User account has been disabled by administrator.',
    };
  }

  if (user.role !== 'superadmin') {
    return {
      authenticated: true,
      authorized: false,
      user,
      status: 403,
      error: 'Forbidden: Super Admin privileges required to access administrative resource.',
    };
  }

  return {
    authenticated: true,
    authorized: true,
    user,
    status: 200,
  };
}

export function sanitizeUserResponse(user: ServerUserRecord) {
  const isMalvisionLocal = (user.email || '').toLowerCase().includes('@malvision.local') || (user.normalizedEmail || '').toLowerCase().includes('@malvision.local');
  const cleanEmail = isMalvisionLocal ? '' : (user.email || '');
  const cleanNormalizedEmail = isMalvisionLocal ? '' : (user.normalizedEmail || '');
  const isVerified = !isMalvisionLocal && Boolean(user.emailVerified || user.provider === 'google');

  return {
    id: user.id,
    email: cleanEmail,
    normalizedEmail: cleanNormalizedEmail,
    emailVerified: isVerified,
    username: user.username,
    normalizedUsername: user.normalizedUsername,
    fullName: user.fullName,
    provider: user.provider,
    role: user.role || 'user',
    status: user.status || 'active',
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
