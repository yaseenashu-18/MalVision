import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { sendVerificationOtpEmail, sendPasswordResetEmail } from './emailService.js';
import {
  getAuthenticatedUserFromReq,
  requireSuperAdmin,
  checkRateLimit,
  generateSecureSalt,
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  sanitizeUserResponse,
  parseCookies,
  SESSION_COOKIE_NAME,
} from './authEngine.js';
import {
  dbFindUserByIdentity,
  dbFindUserByEmail,
  dbCreateUser,
  dbUpdateUser,
  dbDeleteUserAccount,
  dbCreateSession,
  dbDeleteSession,
  dbGetActiveSessionsForUser,
  dbGetScansByUserId,
  dbSaveScan,
  dbDeleteScan,
  dbClearUserScans,
  dbGetVisionByUserId,
  dbSaveVision,
  dbFindUserByGoogleSub,
  dbCheckUsernameAvailable,
  dbSetUserUsername,
  dbGetAllUsers,
  dbGetAdminStats,
  dbGetAdminUsers,
  dbGetAdminUserDetail,
  dbUpdateUserByAdmin,
  dbDeleteUserByAdmin,
  dbGetAdminScans,
  dbDeleteScanByAdmin,
  dbGetAdminVisionScans,
  dbDeleteVisionScanByAdmin,
  dbGetAdminSessions,
  dbRevokeSessionByAdmin,
  dbRevokeUserSessionsByAdmin,
  dbLogAdminAction,
  dbGetAdminAuditLogs,
  dbSavePasswordReset,
  dbFindPasswordReset,
  dbDeletePasswordReset,
  dbSaveEmailOtp,
  dbGetEmailOtp,
  dbDeleteEmailOtp,
  type ServerUserRecord,
} from './db.js';

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'support', 'security', 'malvision',
  'api', 'login', 'signup', 'profile', 'settings', 'help', 'root',
  'system', 'guest', 'null', 'undefined', 'dashboard', 'user', 'users'
]);

interface OtpSessionRecord {
  userId: string;
  email: string;
  otpHash: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
const emailOtpStore = new Map<string, OtpSessionRecord>();

interface ResetPasswordRecord {
  email: string;
  userId: string;
  resetHash: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
const resetPasswordStore = new Map<string, ResetPasswordRecord>();

const sseSessionClients = new Map<string, ServerResponse>();

export function notifySessionRevokedOnSpot(sessionId: string) {
  if (!sessionId) return;
  const clientRes = sseSessionClients.get(sessionId);
  if (clientRes) {
    try {
      clientRes.write('event: revoked\ndata: {"revoked":true}\n\n');
      clientRes.end();
    } catch {
      /* ignore */
    }
    sseSessionClients.delete(sessionId);
  }
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Helper to read JSON request body safely with size limits
 */
async function readJsonBody(req: IncomingMessage, maxBytes = 1048576): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesReceived = 0;

    req.on('data', (chunk: Buffer) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        reject(new Error('Payload too large'));
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON input'));
      }
    });

    req.on('error', (err: Error) => reject(err));
  });
}


function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string) {
  sendJson(res, status, { success: false, error: message });
}

/**
 * Main MalVision API Dispatcher
 */
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = (req.method || 'GET').toUpperCase();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';

  // Only handle /api/ routes
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  // --- CSRF PROTECTION FOR STATE-CHANGING REQUESTS ---
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = req.headers['origin'] || req.headers['referer'];
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        const reqHost = req.headers['host'];
        // Ensure same origin or trusted host
        if (reqHost && originHost !== reqHost && !originHost.includes('localhost') && !originHost.includes('vercel.app')) {
          sendError(res, 403, 'Forbidden: Origin validation failed (CSRF check)');
          return true;
        }
      } catch {
        /* Ignore malformed origin */
      }
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. SIGNUP: POST /api/auth/signup
    // -------------------------------------------------------------
    if (pathname === '/api/auth/signup' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'signup', 5, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many signup attempts. Retry in ${rl.retryAfterSec}s.`);
        return true;
      }

      const body = await readJsonBody(req);
      const { email, username, password, fullName } = body;

      const rawInput = (email || username || '').trim();
      if (!rawInput) {
        sendError(res, 400, 'Please enter a valid username or email address.');
        return true;
      }

      let normEmail = '';
      let cleanUsername = '';

      if (rawInput.includes('@')) {
        normEmail = rawInput.toLowerCase();
        cleanUsername = (username || rawInput.split('@')[0]).trim().toLowerCase();
      } else {
        cleanUsername = (username || rawInput).trim().toLowerCase();
        normEmail = '';
      }

      if (!/^[a-z0-9_]+$/.test(cleanUsername) || cleanUsername.length < 3) {
        sendError(res, 400, 'Username must be at least 3 characters long and contain only letters, numbers, and underscores.');
        return true;
      }

      if (RESERVED_USERNAMES.has(cleanUsername)) {
        sendError(res, 400, 'This username is reserved. Please choose another.');
        return true;
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        sendError(res, 400, 'Password must be at least 8 characters long.');
        return true;
      }

      if (password.length > 128) {
        sendError(res, 400, 'Password exceeds maximum length limit.');
        return true;
      }

      const salt = generateSecureSalt();
      const passwordHash = hashPassword(password, salt);

      const createResult = await dbCreateUser({
        email: normEmail,
        normalizedEmail: normEmail,
        username: cleanUsername,
        normalizedUsername: cleanUsername,
        fullName: (fullName || cleanUsername).trim(),
        passwordHash,
        salt,
        provider: 'email',
        status: 'active',
        failedLoginAttempts: 0,
      });

      if (!createResult.success || !createResult.user) {
        sendError(res, 400, createResult.error || 'Failed to create user account.');
        return true;
      }

      // Create session & issue HttpOnly session cookie
      const session = await dbCreateSession(createResult.user.id, undefined, clientIp, (req.headers['user-agent'] as string) || '');
      setSessionCookie(res, session.sessionId);

      sendJson(res, 201, {
        success: true,
        sessionId: session.sessionId,
        user: sanitizeUserResponse(createResult.user),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 2. LOGIN: POST /api/auth/login
    // -------------------------------------------------------------
    if (pathname === '/api/auth/login' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'login', 10, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many login attempts. Please try again in ${rl.retryAfterSec} seconds.`);
        return true;
      }

      const body = await readJsonBody(req);
      const { identifier, password } = body;

      if (!identifier || typeof identifier !== 'string' || !password || typeof password !== 'string') {
        sendError(res, 400, 'Invalid username or password.');
        return true;
      }

      const user = await dbFindUserByIdentity(identifier);

      // Generic authentication response to prevent user enumeration
      if (!user || !user.passwordHash || user.status !== 'active') {
        sendError(res, 401, 'Invalid username or password.');
        return true;
      }

      // Check lockout
      if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
        const mins = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
        sendError(res, 429, `Account temporarily locked due to failed attempts. Retry in ${mins} min(s).`);
        return true;
      }

      const isValid = verifyPassword(password, user.passwordHash);

      if (!isValid) {
        const failed = user.failedLoginAttempts + 1;
        const lockoutUntil = failed >= 5 ? Date.now() + 15 * 60 * 1000 : undefined;
        await dbUpdateUser(user.id, { failedLoginAttempts: failed, lockoutUntil });
        sendError(res, 401, 'Invalid username or password.');
        return true;
      }

      // Successful Auth: Reset lockout counter & rotate session
      await dbUpdateUser(user.id, { failedLoginAttempts: 0, lockoutUntil: undefined, lastLoginAt: new Date().toISOString() });

      const session = await dbCreateSession(user.id, undefined, clientIp, (req.headers['user-agent'] as string) || '');
      setSessionCookie(res, session.sessionId);

      sendJson(res, 200, {
        success: true,
        sessionId: session.sessionId,
        user: sanitizeUserResponse(user),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 3. GOOGLE AUTH / SYNC: POST /api/auth/google
    // -------------------------------------------------------------
    if (pathname === '/api/auth/google' && method === 'POST') {
      const body = await readJsonBody(req);
      const { googleSub, email, name, avatar } = body;

      if (!googleSub || !email) {
        sendError(res, 400, 'Invalid Google OAuth payload.');
        return true;
      }

      let user = await dbFindUserByGoogleSub(googleSub);
      if (!user) {
        const normEmail = email.trim().toLowerCase();
        user = await dbFindUserByEmail(normEmail);

        if (user) {
          // Link Google sub to existing account
          user = (await dbUpdateUser(user.id, { googleSub, provider: 'google', avatarUrl: avatar || user.avatarUrl }))!;
        } else {
          // Create new user account for Google OAuth with no initial username (user sets on Profile page)
          const createRes = await dbCreateUser({
            email,
            normalizedEmail: normEmail,
            username: '',
            normalizedUsername: '',
            fullName: name || 'Google User',
            provider: 'google',
            googleSub,
            avatarUrl: avatar,
            status: 'active',
            failedLoginAttempts: 0,
          });

          if (!createRes.success || !createRes.user) {
            sendError(res, 400, createRes.error || 'Failed to authenticate Google user.');
            return true;
          }
          user = createRes.user;
        }
      }

      const session = await dbCreateSession(user.id, undefined, clientIp, (req.headers['user-agent'] as string) || '');
      setSessionCookie(res, session.sessionId);

      sendJson(res, 200, {
        success: true,
        sessionId: session.sessionId,
        user: sanitizeUserResponse(user),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 4. SESSION QUERY: GET /api/auth/session
    // -------------------------------------------------------------
    if (pathname === '/api/auth/session' && method === 'GET') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendJson(res, 200, { authenticated: false });
        return true;
      }

      sendJson(res, 200, {
        authenticated: true,
        user: sanitizeUserResponse(user),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5. LOGOUT: POST /api/auth/logout
    // -------------------------------------------------------------
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const cookies = parseCookies(req);
      const sessionId = cookies[SESSION_COOKIE_NAME];
      if (sessionId) {
        notifySessionRevokedOnSpot(sessionId);
        await dbDeleteSession(sessionId);
      }
      clearSessionCookie(res);
      sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
      return true;
    }

    // -------------------------------------------------------------
    // 5C. SEND EMAIL OTP: POST /api/auth/send-email-otp
    // -------------------------------------------------------------
    if (pathname === '/api/auth/send-email-otp' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'send-email-otp', 5, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many verification code requests. Please wait ${rl.retryAfterSec}s.`);
        return true;
      }

      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized: Sign in required to verify email.');
        return true;
      }

      const body = await readJsonBody(req);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

      if (!email || !email.includes('@') || !email.includes('.') || email.includes('@malvision.local')) {
        sendError(res, 400, 'Please enter a valid email address.');
        return true;
      }

      // Check email uniqueness across database
      const existingUser = await dbFindUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        sendError(res, 409, 'This email is already associated with another MalVision account.');
        return true;
      }

      // Check cooldown if existing OTP session is active
      const existingSession = emailOtpStore.get(user.id);
      if (existingSession && Date.now() - existingSession.lastSentAt < 30000) {
        const remaining = Math.ceil((30000 - (Date.now() - existingSession.lastSentAt)) / 1000);
        sendError(res, 429, `Please wait ${remaining}s before requesting a new code.`);
        return true;
      }

      // Generate 6-digit numeric OTP using CS-RNG
      const otpCode = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

      emailOtpStore.set(user.id, {
        userId: user.id,
        email,
        otpHash,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
        attempts: 0,
        lastSentAt: Date.now(),
      });

      // Persist in MongoDB Atlas for serverless compatibility
      await dbSaveEmailOtp({ userId: user.id, email, otpHash, ttlMs: 10 * 60 * 1000 });

      console.log(`[MalVision Auth API] Verification OTP generated for ${email} (User: ${user.id}): ${otpCode}`);

      // Dispatch real verification OTP email asynchronously
      await sendVerificationOtpEmail(email, otpCode, user.fullName || email, 10);

      sendJson(res, 200, {
        success: true,
        message: 'Verification code sent.',
        maskedEmail: maskEmail(email),
        cooldownSec: 30,
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5G. FORGOT PASSWORD: POST /api/auth/forgot-password
    // -------------------------------------------------------------
    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'forgot-password', 5, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many reset requests. Please wait ${rl.retryAfterSec}s.`);
        return true;
      }

      const body = await readJsonBody(req);
      const rawInput = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

      if (!rawInput) {
        sendError(res, 400, 'Please enter a valid email address or username.');
        return true;
      }

      let targetUser = await dbFindUserByEmail(rawInput);
      if (!targetUser) {
        targetUser = await dbFindUserByIdentity(rawInput);
      }

      if (!targetUser) {
        sendError(res, 404, 'No account found with this email or username.');
        return true;
      }

      const targetEmail = (targetUser.normalizedEmail || targetUser.email || '').trim().toLowerCase();

      if (!targetEmail || !targetEmail.includes('@') || targetEmail.endsWith('@malvision.local')) {
        sendError(res, 400, 'Your account does not have a valid email address. Add an email from your Profile to enable password recovery.');
        return true;
      }

      // Check cooldown (30s)
      let existingReset: ResetPasswordRecord | undefined = resetPasswordStore.get(targetEmail);
      if (!existingReset) {
        const dbReset = await dbFindPasswordReset(targetEmail);
        if (dbReset) {
          existingReset = {
            email: dbReset.email,
            userId: dbReset.userId,
            resetHash: dbReset.resetHash,
            createdAt: new Date(dbReset.createdAt).getTime(),
            expiresAt: dbReset.expiresAt instanceof Date ? dbReset.expiresAt.getTime() : new Date(dbReset.expiresAt).getTime(),
            attempts: dbReset.attempts,
            lastSentAt: dbReset.lastSentAt,
          };
        }
      }

      if (existingReset && Date.now() - existingReset.lastSentAt < 30000) {
        const remaining = Math.ceil((30000 - (Date.now() - existingReset.lastSentAt)) / 1000);
        sendError(res, 429, `Please wait ${remaining}s before requesting a new code.`);
        return true;
      }

      const resetCode = crypto.randomInt(100000, 1000000).toString();
      const resetHash = crypto.createHash('sha256').update(resetCode).digest('hex');

      const resetRecord: ResetPasswordRecord = {
        email: targetEmail,
        userId: targetUser.id,
        resetHash,
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes validity
        attempts: 0,
        lastSentAt: Date.now(),
      };

      resetPasswordStore.set(targetEmail, resetRecord);
      resetPasswordStore.set(resetCode, resetRecord);
      resetPasswordStore.set(resetHash, resetRecord);

      // Save to MongoDB Atlas (Persistent across Vercel Serverless instances)
      await dbSavePasswordReset({
        email: targetEmail,
        userId: targetUser.id,
        resetCode,
        resetHash,
        ttlMs: 15 * 60 * 1000,
      });

      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173';
      const resetLink = `${proto}://${host}/#/reset-password?code=${resetCode}&email=${encodeURIComponent(targetEmail)}`;

      console.log(`[MalVision Auth API] Password reset code generated for ${targetEmail}: ${resetCode} (Link: ${resetLink})`);

      // Dispatch password reset email
      await sendPasswordResetEmail(targetEmail, resetCode, resetLink, targetUser.fullName || targetEmail, 15);

      sendJson(res, 200, {
        success: true,
        message: 'Password reset link sent to your email.',
        maskedEmail: maskEmail(targetEmail),
        cooldownSec: 30,
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5H. RESET PASSWORD: POST /api/auth/reset-password
    // -------------------------------------------------------------
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'reset-password', 20, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many reset attempts. Please wait ${rl.retryAfterSec}s.`);
        return true;
      }

      const body = await readJsonBody(req);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const code = typeof body.code === 'string' ? body.code.trim() : '';
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

      if (!code || (code.length !== 6 && code.length !== 64) || (!/^\d+$/.test(code) && !/^[a-f0-9]+$/i.test(code))) {
        sendError(res, 400, 'Invalid or missing password reset token. Please click the link sent to your email.');
        return true;
      }

      if (!newPassword || newPassword.length < 8) {
        sendError(res, 400, 'New password must be at least 8 characters long.');
        return true;
      }

      if (newPassword.length > 128) {
        sendError(res, 400, 'Password exceeds maximum length limit.');
        return true;
      }

      // Find reset session by code, email, or resetHash in memory
      let record: ResetPasswordRecord | undefined = resetPasswordStore.get(code);

      if (!record && email) {
        record = resetPasswordStore.get(email);
      }

      if (!record && code) {
        const inputHash = crypto.createHash('sha256').update(code).digest('hex');
        record = resetPasswordStore.get(inputHash);

        if (!record) {
          for (const [key, val] of resetPasswordStore.entries()) {
            if (val.resetHash === inputHash || val.resetHash === code || key === email || key === code) {
              record = val;
              break;
            }
          }
        }
      }

      // Fallback: Query MongoDB Atlas if memory cache missed (Vercel Serverless multi-instance support)
      if (!record) {
        const dbRecord = await dbFindPasswordReset(code || email);
        if (dbRecord) {
          record = {
            email: dbRecord.email,
            userId: dbRecord.userId,
            resetHash: dbRecord.resetHash,
            createdAt: new Date(dbRecord.createdAt).getTime(),
            expiresAt: dbRecord.expiresAt instanceof Date ? dbRecord.expiresAt.getTime() : new Date(dbRecord.expiresAt).getTime(),
            attempts: dbRecord.attempts,
            lastSentAt: dbRecord.lastSentAt,
          };
          // Cache back in memory
          resetPasswordStore.set(record.email, record);
          resetPasswordStore.set(code, record);
          resetPasswordStore.set(record.resetHash, record);
        }
      }

      if (!record) {
        sendError(res, 400, 'Password reset link is invalid or has expired. Please request a new link.');
        return true;
      }

      // Enforce exact 15-minute window for password changes
      if (Date.now() > record.expiresAt) {
        resetPasswordStore.delete(record.email);
        resetPasswordStore.delete(code);
        resetPasswordStore.delete(record.resetHash);
        await dbDeletePasswordReset(code || record.email);
        sendError(res, 400, 'This password reset link has expired.');
        return true;
      }

      record.attempts += 1;

      const newSalt = generateSecureSalt();
      const newHash = hashPassword(newPassword, newSalt);

      await dbUpdateUser(record.userId, { passwordHash: newHash, salt: newSalt });

      // Note: We keep the reset record active in MongoDB Atlas until expiresAt (15 min) so user can change password anytime in 15min.

      sendJson(res, 200, {
        success: true,
        message: 'Your password has been changed successfully.',
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5I. CHANGE PASSWORD ALIAS: POST /api/auth/change-password
    // -------------------------------------------------------------
    if (pathname === '/api/auth/change-password' && method === 'POST') {
      req.url = '/api/me/change-password';
      return handleApiRequest(req, res);
    }


    // -------------------------------------------------------------
    // 5D. VERIFY EMAIL OTP: POST /api/auth/verify-email-otp
    // -------------------------------------------------------------
    if (pathname === '/api/auth/verify-email-otp' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'verify-email-otp', 10, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many verification attempts. Please wait ${rl.retryAfterSec}s.`);
        return true;
      }

      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized: Sign in required to verify email.');
        return true;
      }

      const body = await readJsonBody(req);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const otp = typeof body.otp === 'string' ? body.otp.trim() : '';

      if (!email || !otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        sendError(res, 400, 'Please enter the 6-digit verification code.');
        return true;
      }

      let sessionRecord = emailOtpStore.get(user.id);
      if (!sessionRecord) {
        const dbOtp = await dbGetEmailOtp(user.id);
        if (dbOtp) {
          sessionRecord = {
            userId: dbOtp.userId,
            email: dbOtp.email,
            otpHash: dbOtp.otpHash,
            createdAt: new Date(dbOtp.createdAt).getTime(),
            expiresAt: dbOtp.expiresAt instanceof Date ? dbOtp.expiresAt.getTime() : new Date(dbOtp.expiresAt).getTime(),
            attempts: dbOtp.attempts,
            lastSentAt: dbOtp.lastSentAt,
          };
          emailOtpStore.set(user.id, sessionRecord);
        }
      }

      if (!sessionRecord || sessionRecord.email !== email) {
        sendError(res, 400, 'Verification session expired. Please request a new code.');
        return true;
      }

      if (Date.now() > sessionRecord.expiresAt) {
        emailOtpStore.delete(user.id);
        await dbDeleteEmailOtp(user.id);
        sendError(res, 400, 'This verification code has expired.');
        return true;
      }

      if (sessionRecord.attempts >= 5) {
        emailOtpStore.delete(user.id);
        await dbDeleteEmailOtp(user.id);
        sendError(res, 429, 'Too many attempts. Please request a new verification code.');
        return true;
      }

      sessionRecord.attempts += 1;

      const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
      const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(sessionRecord.otpHash));

      if (!isMatch) {
        sendError(res, 400, 'Incorrect verification code.');
        return true;
      }

      // Check email uniqueness again before updating
      const existingUser = await dbFindUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        sendError(res, 409, 'This email is already associated with another MalVision account.');
        return true;
      }

      // Save verified email to MongoDB Atlas
      const updatedUser = await dbUpdateUser(user.id, {
        email,
        normalizedEmail: email,
        emailVerified: true,
      });

      emailOtpStore.delete(user.id);

      if (!updatedUser) {
        sendError(res, 500, 'Failed to save verified email.');
        return true;
      }

      sendJson(res, 200, {
        success: true,
        message: 'Your email has been successfully verified.',
        user: sanitizeUserResponse(updatedUser),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5E. GET ACTIVE SESSIONS: GET /api/auth/active-sessions
    // -------------------------------------------------------------
    if (pathname === '/api/auth/active-sessions' && method === 'GET') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized session query.');
        return true;
      }

      const cookies = parseCookies(req);
      const currentSessionId = cookies[SESSION_COOKIE_NAME] || '';

      const userSessions = await dbGetActiveSessionsForUser(user.id);
      
      const parseDevice = (ua?: string): string => {
        if (!ua) return 'Desktop PC (Web)';
        const u = ua.toLowerCase();
        
        let os = 'Desktop PC';
        if (u.includes('iphone')) os = 'iPhone';
        else if (u.includes('ipad')) os = 'iPad';
        else if (u.includes('android')) os = u.includes('mobile') ? 'Android Mobile' : 'Android Tablet';
        else if (u.includes('macintosh') || u.includes('mac os')) os = 'MacBook';
        else if (u.includes('windows')) os = 'Windows PC';
        else if (u.includes('linux')) os = 'Linux PC';

        let browser = '';
        if (u.includes('edg/') || u.includes('edge')) browser = ' (Edge)';
        else if (u.includes('chrome') && !u.includes('chromium')) browser = ' (Chrome)';
        else if (u.includes('safari') && !u.includes('chrome')) browser = ' (Safari)';
        else if (u.includes('firefox')) browser = ' (Firefox)';
        else if (u.includes('opera') || u.includes('opr/')) browser = ' (Opera)';

        return `${os}${browser}`;
      };

      const items = userSessions.map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        userName: user.fullName,
        userEmail: user.normalizedEmail && !user.normalizedEmail.includes('@malvision.local') ? user.normalizedEmail : '',
        userAvatar: user.avatarUrl,
        device: parseDevice(s.userAgent),
        ipAddress: s.ipAddress || clientIp || '127.0.0.1',
        createdAt: s.createdAt,
        isCurrent: s.sessionId === currentSessionId,
      }));

      sendJson(res, 200, {
        success: true,
        sessions: items,
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5F. REVOKE ACTIVE SESSION: POST /api/auth/revoke-session OR DELETE /api/auth/active-sessions/:id
    // -------------------------------------------------------------
    if ((pathname === '/api/auth/revoke-session' && method === 'POST') || (pathname.startsWith('/api/auth/active-sessions/') && method === 'DELETE')) {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized session revocation.');
        return true;
      }

      let targetSessionId = '';
      if (method === 'POST') {
        const body = await readJsonBody(req);
        targetSessionId = body?.sessionId || '';
      } else {
        targetSessionId = pathname.replace('/api/auth/active-sessions/', '').trim();
      }

      if (!targetSessionId) {
        sendError(res, 400, 'Session ID is required.');
        return true;
      }

      const cookies = parseCookies(req);
      const currentSessionId = cookies[SESSION_COOKIE_NAME] || '';

      await dbDeleteSession(targetSessionId);
      notifySessionRevokedOnSpot(targetSessionId);

      if (targetSessionId === currentSessionId) {
        clearSessionCookie(res);
      }

      sendJson(res, 200, {
        success: true,
        message: 'Session signed out successfully.',
        revokedSessionId: targetSessionId,
      });
      return true;
    }

    // -------------------------------------------------------------
    // 5B. REAL-TIME USERNAME AVAILABILITY: GET /api/users/username-availability
    // -------------------------------------------------------------
    if (pathname === '/api/users/username-availability' && method === 'GET') {
      const rl = checkRateLimit(clientIp, 'username-avail', 60, 60000);
      if (!rl.allowed) {
        sendJson(res, 429, { available: false, reason: 'rate_limited', message: 'Too many availability checks. Please wait.' });
        return true;
      }

      const requestedUsername = urlObj.searchParams.get('username') || '';
      const cleanInput = requestedUsername.trim();
      const normInput = cleanInput.toLowerCase();

      // Client / server pre-validation
      if (!cleanInput) {
        sendJson(res, 200, { available: false, reason: 'invalid', message: 'Username cannot be empty.' });
        return true;
      }

      if (cleanInput.length < 3 || cleanInput.length > 30) {
        sendJson(res, 200, { available: false, reason: 'invalid', message: 'Username must be 3–30 characters.' });
        return true;
      }

      if (!/^[a-z0-9_]+$/.test(normInput)) {
        sendJson(res, 200, { available: false, reason: 'invalid', message: 'Only letters, numbers, and underscores are allowed.' });
        return true;
      }

      if (RESERVED_USERNAMES.has(normInput)) {
        sendJson(res, 200, { available: false, reason: 'reserved', message: 'Username unavailable. Try another.' });
        return true;
      }

      // Check current user context if logged in (to allow keeping existing username)
      const currentUser = await getAuthenticatedUserFromReq(req);
      const check = await dbCheckUsernameAvailable(cleanInput, currentUser?.id);

      if (!check.available) {
        sendJson(res, 200, { available: false, reason: 'taken', message: 'Username taken. Try another.' });
        return true;
      }

      sendJson(res, 200, { available: true, message: 'Username available ✓' });
      return true;
    }

    // -------------------------------------------------------------
    // 6. PROFILE API: GET /api/me & PATCH /api/me
    // -------------------------------------------------------------
    if (pathname === '/api/me') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized: Active session required.');
        return true;
      }

      if (method === 'GET') {
        sendJson(res, 200, { success: true, user: sanitizeUserResponse(user) });
        return true;
      }

      if (method === 'PATCH') {
        const body = await readJsonBody(req);

        let currentUserRecord = user;

        // If username is being created/updated
        if (typeof body.username === 'string' && body.username.trim()) {
          const normReqUsername = body.username.trim().toLowerCase();
          if (RESERVED_USERNAMES.has(normReqUsername)) {
            sendJson(res, 409, {
              success: false,
              code: 'USERNAME_TAKEN',
              message: 'Username taken. Try another.',
            });
            return true;
          }

          const setRes = await dbSetUserUsername(user.id, body.username);
          if (!setRes.success) {
            if (setRes.code === 'USERNAME_TAKEN') {
              sendJson(res, 409, {
                success: false,
                code: 'USERNAME_TAKEN',
                message: 'Username taken. Try another.',
              });
              return true;
            }
            sendError(res, 400, setRes.error || 'Failed to save username.');
            return true;
          }
          currentUserRecord = setRes.user!;
        }

        const updates: Partial<ServerUserRecord> = {};

        // Explicit allowlist of user-modifiable profile fields
        if (typeof body.fullName === 'string' && body.fullName.trim()) {
          updates.fullName = body.fullName.trim();
        }
        if (typeof body.avatarUrl === 'string') {
          updates.avatarUrl = body.avatarUrl;
        }

        if (Object.keys(updates).length > 0) {
          const updated = await dbUpdateUser(user.id, updates);
          if (updated) {
            currentUserRecord = updated;
          }
        }

        sendJson(res, 200, {
          success: true,
          user: sanitizeUserResponse(currentUserRecord),
        });
        return true;
      }

      if (method === 'DELETE') {
        const result = await dbDeleteUserAccount(user.id);
        clearSessionCookie(res);
        sendJson(res, 200, { success: true, message: 'Account deleted successfully.', deletedCount: result.deletedCount });
        return true;
      }
    }

    // -------------------------------------------------------------
    // 6A. PROFILE STATS: GET /api/me/stats
    // -------------------------------------------------------------
    if (pathname === '/api/me/stats' && method === 'GET') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized: Active session required.');
        return true;
      }

      const db = await (await import('./db.js')).getMongoDb();

      const [totalScans, threatsBlocked, activeSessions] = await Promise.all([
        db.collection('scans').countDocuments({ userId: user.id }),
        db.collection('scans').countDocuments({ userId: user.id, status: { $in: ['Suspicious', 'Malicious'] } }),
        db.collection('sessions').countDocuments({ userId: user.id, expiresAt: { $gt: new Date() } }),
      ]);

      sendJson(res, 200, {
        success: true,
        stats: {
          filesScanned: totalScans,
          threatsBlocked,
          linkedDevices: activeSessions,
          memberSince: user.createdAt,
        },
      });
      return true;
    }

    // -------------------------------------------------------------
    // 6B. CHANGE PASSWORD: POST /api/me/change-password
    // -------------------------------------------------------------
    if (pathname === '/api/me/change-password' && method === 'POST') {
      const rl = checkRateLimit(clientIp, 'change-password', 5, 60000);
      if (!rl.allowed) {
        sendError(res, 429, `Too many password change attempts. Retry in ${rl.retryAfterSec}s.`);
        return true;
      }

      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized: Active session required.');
        return true;
      }

      // Google-only users without a password cannot use this endpoint
      if (user.provider === 'google' && !user.passwordHash) {
        sendError(res, 400, 'Your account uses Google sign-in. Password management is not available.');
        return true;
      }

      const body = await readJsonBody(req);
      const { currentPassword, newPassword } = body;

      if (!currentPassword || typeof currentPassword !== 'string') {
        sendError(res, 400, 'Current password is required.');
        return true;
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        sendError(res, 400, 'New password must be at least 8 characters long.');
        return true;
      }

      if (newPassword.length > 128) {
        sendError(res, 400, 'Password exceeds maximum length limit.');
        return true;
      }

      // Verify current password
      const isCurrentValid = verifyPassword(currentPassword, user.passwordHash!);
      if (!isCurrentValid) {
        sendError(res, 401, 'Current password is incorrect.');
        return true;
      }

      // Hash new password with fresh salt
      const newSalt = generateSecureSalt();
      const newHash = hashPassword(newPassword, newSalt);

      await dbUpdateUser(user.id, { passwordHash: newHash, salt: newSalt });

      sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
      return true;
    }

    // -------------------------------------------------------------
    // 6C. AVATAR UPLOAD: POST /api/me/avatar
    // -------------------------------------------------------------
    if (pathname === '/api/me/avatar' && method === 'POST') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized: Active session required.');
        return true;
      }

      const body = await readJsonBody(req, 3 * 1024 * 1024); // 3MB max for base64 payload
      const { avatarData } = body;

      if (!avatarData || typeof avatarData !== 'string') {
        sendError(res, 400, 'Avatar image data is required.');
        return true;
      }

      // Validate data URL format and MIME type
      const dataUrlMatch = avatarData.match(/^data:(image\/(jpeg|png|webp));base64,/);
      if (!dataUrlMatch) {
        sendError(res, 400, 'Invalid image format. Only JPEG, PNG, and WebP are supported.');
        return true;
      }

      // Validate base64 payload size (~2MB decoded limit)
      const base64Part = avatarData.split(',')[1];
      if (!base64Part || base64Part.length > 2 * 1024 * 1024 * 1.37) { // base64 is ~37% larger
        sendError(res, 400, 'Image file is too large. Maximum size is 2MB.');
        return true;
      }

      const updated = await dbUpdateUser(user.id, { avatarUrl: avatarData });
      if (!updated) {
        sendError(res, 500, 'Failed to save avatar.');
        return true;
      }

      sendJson(res, 200, {
        success: true,
        user: sanitizeUserResponse(updated),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 6D. USER LIST API: GET /api/users
    // -------------------------------------------------------------
    if (pathname === '/api/users' && method === 'GET') {
      const users = await dbGetAllUsers();
      sendJson(res, 200, {
        success: true,
        count: users.length,
        users: users.map(sanitizeUserResponse),
      });
      return true;
    }

    // -------------------------------------------------------------
    // 7. SCAN HISTORY API: GET /api/scans & POST /api/scans
    // -------------------------------------------------------------
    if (pathname === '/api/scans') {
      const user = await getAuthenticatedUserFromReq(req);

      if (method === 'GET') {
        if (!user) {
          // Unauthenticated guest user gets empty history from server
          sendJson(res, 200, { success: true, scans: [] });
          return true;
        }

        // Server derives ownership strictly from authenticated session userId
        const scans = await dbGetScansByUserId(user.id);
        sendJson(res, 200, { success: true, scans });
        return true;
      }

      if (method === 'POST') {
        if (!user) {
          sendError(res, 401, 'Unauthorized: Sign in required to sync scan history.');
          return true;
        }

        const body = await readJsonBody(req);
        if (!body.target || !body.status) {
          sendError(res, 400, 'Invalid scan result payload.');
          return true;
        }

        // Attach server-authoritative userId to prevent spoofing
        const savedScan = await dbSaveScan(user.id, {
          id: body.id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          target: body.target,
          targetType: body.targetType || 'file',
          status: body.status || 'Unknown',
          score: typeof body.score === 'number' ? body.score : 0,
          summary: body.summary || '',
          explanation: body.explanation || '',
          findings: Array.isArray(body.findings) ? body.findings : [],
          recommendedAction: body.recommendedAction || '',
          metadata: body.metadata || {},
        });

        sendJson(res, 201, { success: true, scan: savedScan });
        return true;
      }

      if (method === 'DELETE') {
        if (!user) {
          sendError(res, 401, 'Unauthorized.');
          return true;
        }

        await dbClearUserScans(user.id);
        sendJson(res, 200, { success: true, message: 'Scan history cleared.' });
        return true;
      }
    }

    // -------------------------------------------------------------
    // 8. SCAN ITEM DELETE: DELETE /api/scans/:id
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/scans/') && method === 'DELETE') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized.');
        return true;
      }

      const scanId = pathname.replace('/api/scans/', '');
      const deleted = await dbDeleteScan(scanId, user.id);

      if (!deleted) {
        sendError(res, 404, 'Scan record not found or access denied (IDOR protection).');
        return true;
      }

      sendJson(res, 200, { success: true, message: 'Scan deleted.' });
      return true;
    }

    // -------------------------------------------------------------
    // 9. VISION RESULTS API: GET /api/vision & POST /api/vision
    // -------------------------------------------------------------
    if (pathname === '/api/vision') {
      const user = await getAuthenticatedUserFromReq(req);
      if (!user) {
        sendError(res, 401, 'Unauthorized.');
        return true;
      }

      if (method === 'GET') {
        const items = await dbGetVisionByUserId(user.id);
        sendJson(res, 200, { success: true, items });
        return true;
      }

      if (method === 'POST') {
        const body = await readJsonBody(req);
        const saved = await dbSaveVision(user.id, {
          id: body.id || `vis_${Date.now()}`,
          imageName: body.imageName || 'image.png',
          prompt: body.prompt || '',
          resultSummary: body.resultSummary || '',
          riskScore: body.riskScore || 0,
          threatClassification: body.threatClassification || 'Unknown',
        });
        sendJson(res, 201, { success: true, item: saved });
        return true;
      }
    }

    // -------------------------------------------------------------
    // 10. SUPER ADMIN API ENDPOINTS: /api/admin/*
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/admin/')) {
      const adminAuth = await requireSuperAdmin(req);
      if (!adminAuth.authorized || !adminAuth.user) {
        sendError(res, adminAuth.status, adminAuth.error || 'Forbidden: Super Admin access required.');
        return true;
      }

      const adminUser = adminAuth.user;

      // 10A. Dashboard Stats: GET /api/admin/stats
      if (pathname === '/api/admin/stats' && method === 'GET') {
        const stats = await dbGetAdminStats();
        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'STATS_VIEWED',
          targetType: 'system',
          ip: clientIp,
        });
        sendJson(res, 200, { success: true, stats });
        return true;
      }

      // 10B. Admin Users List: GET /api/admin/users
      if (pathname === '/api/admin/users' && method === 'GET') {
        const search = urlObj.searchParams.get('search') || undefined;
        const role = urlObj.searchParams.get('role') || undefined;
        const status = urlObj.searchParams.get('status') || undefined;
        const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
        const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);

        const data = await dbGetAdminUsers({ search, role, status, limit, offset });
        sendJson(res, 200, { success: true, total: data.total, users: data.users.map(sanitizeUserResponse) });
        return true;
      }

      // 10C. Admin User Detail: GET /api/admin/users/:id
      if (pathname.startsWith('/api/admin/users/') && !pathname.endsWith('/sessions') && method === 'GET') {
        const targetId = pathname.replace('/api/admin/users/', '');
        const detail = await dbGetAdminUserDetail(targetId);
        if (!detail) {
          sendError(res, 404, 'User not found.');
          return true;
        }

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'USER_VIEWED',
          targetType: 'user',
          targetId,
          details: `Inspected detailed record for user @${detail.user.username || detail.user.email}`,
          ip: clientIp,
        });

        sendJson(res, 200, {
          success: true,
          user: sanitizeUserResponse(detail.user),
          scanCount: detail.scanCount,
          visionCount: detail.visionCount,
          sessionCount: detail.sessionCount,
          recentScans: detail.recentScans,
          activeSessions: detail.activeSessions.map((s) => ({
            ...s,
            sessionId: `${s.sessionId.substring(0, 8)}...`,
          })),
          userAuditLogs: detail.userAuditLogs,
        });
        return true;
      }

      // 10D. Admin User Update: PATCH /api/admin/users/:id
      if (pathname.startsWith('/api/admin/users/') && !pathname.endsWith('/sessions') && method === 'PATCH') {
        const targetId = pathname.replace('/api/admin/users/', '');
        const body = await readJsonBody(req);

        const result = await dbUpdateUserByAdmin(adminUser.id, targetId, {
          fullName: body.fullName,
          username: body.username,
          role: body.role,
          status: body.status,
        });

        if (!result.success || !result.user) {
          sendError(res, 400, result.error || 'Failed to update target user account.');
          return true;
        }

        let actionName = 'USER_UPDATED';
        if (body.role) actionName = 'ROLE_CHANGED';
        if (body.status === 'disabled') actionName = 'USER_DISABLED';
        if (body.status === 'active') actionName = 'USER_ENABLED';

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: actionName,
          targetType: 'user',
          targetId,
          details: `Updated user @${result.user.username || result.user.email} (Role: ${result.user.role}, Status: ${result.user.status})`,
          metadata: { updates: body },
          ip: clientIp,
        });

        sendJson(res, 200, { success: true, user: sanitizeUserResponse(result.user) });
        return true;
      }

      // 10E. Admin User Delete: DELETE /api/admin/users/:id
      if (pathname.startsWith('/api/admin/users/') && !pathname.endsWith('/sessions') && method === 'DELETE') {
        const targetId = pathname.replace('/api/admin/users/', '');
        const result = await dbDeleteUserByAdmin(adminUser.id, targetId);

        if (!result.success) {
          sendError(res, 400, result.error || 'Failed to delete target user account.');
          return true;
        }

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'USER_DELETED',
          targetType: 'user',
          targetId,
          details: `Deleted user account and related documents (Deleted docs: ${result.deletedCount})`,
          ip: clientIp,
        });

        sendJson(res, 200, { success: true, message: 'User account deleted successfully.', deletedCount: result.deletedCount });
        return true;
      }

      // 10F. Admin Scans List & Delete: GET /api/admin/scans & DELETE /api/admin/scans/:id
      if (pathname === '/api/admin/scans' && method === 'GET') {
        const search = urlObj.searchParams.get('search') || undefined;
        const status = urlObj.searchParams.get('status') || undefined;
        const targetType = urlObj.searchParams.get('targetType') || undefined;
        const userId = urlObj.searchParams.get('userId') || undefined;
        const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
        const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);

        const data = await dbGetAdminScans({ search, status, targetType, userId, limit, offset });
        sendJson(res, 200, { success: true, total: data.total, scans: data.scans });
        return true;
      }

      if (pathname.startsWith('/api/admin/scans/') && method === 'DELETE') {
        const scanId = pathname.replace('/api/admin/scans/', '');
        const deleted = await dbDeleteScanByAdmin(scanId);

        if (!deleted) {
          sendError(res, 404, 'Scan record not found.');
          return true;
        }

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'SCAN_DELETED',
          targetType: 'scan',
          targetId: scanId,
          details: `Deleted scan record '${scanId}'`,
          ip: clientIp,
        });

        sendJson(res, 200, { success: true, message: 'Scan deleted.' });
        return true;
      }

      // 10G. Admin Vision Scans List & Delete: GET /api/admin/vision-scans & DELETE /api/admin/vision-scans/:id
      if (pathname === '/api/admin/vision-scans' && method === 'GET') {
        const search = urlObj.searchParams.get('search') || undefined;
        const classification = urlObj.searchParams.get('classification') || undefined;
        const userId = urlObj.searchParams.get('userId') || undefined;
        const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
        const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);

        const data = await dbGetAdminVisionScans({ search, classification, userId, limit, offset });
        sendJson(res, 200, { success: true, total: data.total, items: data.items });
        return true;
      }

      if (pathname.startsWith('/api/admin/vision-scans/') && method === 'DELETE') {
        const visionId = pathname.replace('/api/admin/vision-scans/', '');
        const deleted = await dbDeleteVisionScanByAdmin(visionId);

        if (!deleted) {
          sendError(res, 404, 'Vision scan record not found.');
          return true;
        }

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'VISION_SCAN_DELETED',
          targetType: 'vision',
          targetId: visionId,
          details: `Deleted neural vision scan '${visionId}'`,
          ip: clientIp,
        });

        sendJson(res, 200, { success: true, message: 'Vision scan record deleted.' });
        return true;
      }

      // 10H. Admin Sessions: GET /api/admin/sessions & DELETE /api/admin/sessions/:id & DELETE /api/admin/users/:id/sessions
      if (pathname === '/api/admin/sessions' && method === 'GET') {
        const userId = urlObj.searchParams.get('userId') || undefined;
        const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
        const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);

        const data = await dbGetAdminSessions({ userId, limit, offset });
        sendJson(res, 200, { success: true, total: data.total, sessions: data.sessions });
        return true;
      }

      if (pathname.startsWith('/api/admin/sessions/') && method === 'DELETE') {
        const sessId = pathname.replace('/api/admin/sessions/', '');
        const revoked = await dbRevokeSessionByAdmin(sessId);

        if (!revoked) {
          sendError(res, 404, 'Session record not found.');
          return true;
        }

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'SESSION_REVOKED',
          targetType: 'session',
          targetId: sessId,
          details: `Revoked active session token '${sessId.substring(0, 8)}...'`,
          ip: clientIp,
        });

        sendJson(res, 200, { success: true, message: 'Session revoked successfully.' });
        return true;
      }

      if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/sessions') && method === 'DELETE') {
        const parts = pathname.split('/');
        const targetUserId = parts[4];
        const revokedCount = await dbRevokeUserSessionsByAdmin(targetUserId);

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'USER_SESSIONS_REVOKED',
          targetType: 'user',
          targetId: targetUserId,
          details: `Revoked all active sessions for user '${targetUserId}' (Revoked count: ${revokedCount})`,
          ip: clientIp,
        });

        sendJson(res, 200, { success: true, message: 'User sessions revoked.', revokedCount });
        return true;
      }

      // 10I. Admin Audit Logs: GET /api/admin/audit-logs
      if (pathname === '/api/admin/audit-logs' && method === 'GET') {
        const targetType = urlObj.searchParams.get('targetType') || undefined;
        const action = urlObj.searchParams.get('action') || undefined;
        const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
        const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);

        const data = await dbGetAdminAuditLogs({ targetType, action, limit, offset });
        sendJson(res, 200, { success: true, total: data.total, logs: data.logs });
        return true;
      }

      // 10J. PBKDF2-SHA256 Hash Verifier Security Tool: POST /api/admin/security/verify-password-hash
      if (pathname === '/api/admin/security/verify-password-hash' && method === 'POST') {
        const rl = checkRateLimit(clientIp, 'verify-hash', 20, 60000);
        if (!rl.allowed) {
          sendError(res, 429, `Too many verification requests. Retry in ${rl.retryAfterSec}s.`);
          return true;
        }

        const body = await readJsonBody(req);
        const { password, hash } = body;

        if (typeof password !== 'string' || typeof hash !== 'string' || !hash.trim()) {
          sendError(res, 400, 'Invalid request payload. Please supply password and hash strings.');
          return true;
        }

        const cleanHash = hash.trim();
        if (!cleanHash.startsWith('pbkdf2_sha256$')) {
          sendJson(res, 200, {
            success: false,
            valid: false,
            error: 'Unsupported or malformed hash format. Expected format: pbkdf2_sha256$10000$salt$hash',
          });
          return true;
        }

        const isValid = verifyPassword(password, cleanHash);

        await dbLogAdminAction({
          adminUserId: adminUser.id,
          adminUsername: adminUser.username,
          action: 'SECURITY_HASH_VERIFIED',
          targetType: 'security',
          details: `Ran PBKDF2-SHA256 Hash Match Tool (Result: ${isValid ? 'MATCH' : 'NO MATCH'})`,
          metadata: { isMatch: isValid },
          ip: clientIp,
        });

        // Return ONLY boolean match status. Never store, log, or expose password or derived key.
        sendJson(res, 200, {
          success: true,
          valid: isValid,
        });
        return true;
      }
    }

    // Unrecognized /api endpoint
    sendError(res, 404, 'API endpoint not found');
    return true;
  } catch (err: any) {
    console.error('[MalVision Server API Error]:', err);
    sendError(res, 500, 'Internal Server Security Error');
    return true;
  }
}
