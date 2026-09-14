import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import malvisionLogoSvg from '../assets/MalVision_logo_pixel_match.svg';
import { ThemeToggle } from './ThemeToggle';
import { HeroDotGrid } from './HeroDotGrid';
import { authenticateWithGoogle } from '../lib/googleAuth';
import {
  registerUserAccount,
  authenticateUserCredentials,
  authenticateGoogleAccount,
  getActiveSession,
  validateUsernameFormat,
  validateLoginEmail,
} from '../lib/userStore';

import { apiForgotPassword, apiResetPassword } from '../lib/authApi';

interface AuthPageProps {
  initialMode?: 'login' | 'signup' | 'forgot-password' | 'reset-password';
  onNavigate: (page: string) => void;
  onAuthSuccess?: (user: { name: string; email: string; avatar?: string; provider?: string; role?: string }) => void;
}

function formatAuthError(err: any): string {

  if (!err) return 'Authentication failed. Please try again.';
  if (typeof err === 'string') {
    if (err === '[object Object]' || err.toLowerCase().includes('page could not be found') || err.toLowerCase().includes('not_found')) {
      return 'Authentication failed. Invalid request or credentials.';
    }
    return err;
  }
  if (typeof err?.message === 'string') {
    if (err.message.toLowerCase().includes('page could not be found') || err.message.toLowerCase().includes('not_found')) {
      return 'Authentication failed. Invalid request or credentials.';
    }
    return err.message;
  }
  if (typeof err?.error === 'string') {
    if (err.error.toLowerCase().includes('page could not be found') || err.error.toLowerCase().includes('not_found')) {
      return 'Authentication failed. Invalid request or credentials.';
    }
    return err.error;
  }
  if (typeof err?.error_description === 'string') return err.error_description;
  if (typeof err?.details === 'string') return err.details;
  try {
    const str = JSON.stringify(err);
    if (str && str !== '{}' && !str.toLowerCase().includes('page could not be found')) return str;
  } catch (e) {
    /* ignore */
  }
  return 'Authentication failed. Please try again.';
}

function getQueryParamsFromUrl(): { email?: string; code?: string } {
  try {
    let searchStr = window.location.search;
    if (!searchStr && window.location.hash.includes('?')) {
      searchStr = '?' + window.location.hash.split('?')[1];
    }
    if (searchStr) {
      const params = new URLSearchParams(searchStr);
      return {
        email: params.get('email') || undefined,
        code: params.get('code') || undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return {};
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onNavigate,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>(initialMode);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; isOriginMismatch?: boolean } | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Update mode if prop changes and parse URL reset link params
  useEffect(() => {
    setMode(initialMode);
    setAuthError(null);
    setSuccessNotice(null);
    setForgotSent(false);

    const { email, code } = getQueryParamsFromUrl();
    if (email) {
      setForgotEmail(email);
    }
    if (code) {
      setResetCode(code);
    }
    if (initialMode === 'reset-password' && code && email) {
      setSuccessNotice(`Password reset link loaded for ${email}`);
    }

    setResetSuccess(false);
  }, [initialMode]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      const googleProfile = await authenticateWithGoogle();
      const userRecord = await authenticateGoogleAccount(googleProfile);

      const existingSession = getActiveSession();

      setSuccessNotice(`Authenticated as ${userRecord.fullName}!`);
      setTimeout(() => {
        setGoogleLoading(false);
        const sessionData = {
          name: userRecord.fullName,
          email: userRecord.normalizedEmail,
          username: userRecord.username,
          avatar: userRecord.avatar,
          provider: 'google' as const,
          role: userRecord.role || existingSession?.role || 'user',
        };
        onAuthSuccess?.(sessionData);
        onNavigate(sessionData.role === 'superadmin' ? 'superadmin' : 'dashboard');
      }, 400);
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      setGoogleLoading(false);
      const msg = formatAuthError(err);
      const isOriginMismatch =
        msg.toLowerCase().includes('origin') ||
        msg.toLowerCase().includes('mismatch') ||
        msg.toLowerCase().includes('400') ||
        msg.toLowerCase().includes('idpiframe_initialization_failed');
      setAuthError({ message: msg, isOriginMismatch });
    }
  };

  const handleUsernameChange = (val: string) => {
    if (mode === 'signup') {
      setEmailInput(val.toLowerCase());
    } else {
      setEmailInput(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessNotice(null);

    // 1. FORGOT PASSWORD MODE
    if (mode === 'forgot-password') {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      if (!cleanEmail || cleanEmail.endsWith('@malvision.local')) {
        setAuthError({ message: 'Please enter a valid email address or username.' });
        return;
      }

      setLoading(true);
      const res = await apiForgotPassword(cleanEmail);
      setLoading(false);

      if (!res.success) {
        setAuthError({ message: res.error || 'Failed to send password reset link.' });
        return;
      }

      setForgotSent(true);
      setSuccessNotice(null);
      return;
    }

    // 2. RESET PASSWORD MODE
    if (mode === 'reset-password') {
      const cleanCode = resetCode.trim();
      const targetEmail = (forgotEmail || emailInput).trim().toLowerCase();

      if (!cleanCode) {
        setAuthError({ message: 'Invalid or missing reset token. Please click the link sent to your email.' });
        return;
      }

      if (!password || password.length < 8) {
        setAuthError({ message: 'New password must be at least 8 characters long.' });
        return;
      }

      if (password !== confirmPassword) {
        setAuthError({ message: 'Passwords do not match.' });
        return;
      }

      setLoading(true);
      const res = await apiResetPassword(targetEmail, cleanCode, password);
      setLoading(false);

      if (!res.success) {
        setAuthError({ message: res.error || 'Failed to reset password.' });
        return;
      }

      setResetSuccess(true);
      setSuccessNotice('Your password has been changed successfully.');
      return;
    }

    let formattedEmail = '';

    if (mode === 'signup') {
      const usernameCheck = validateUsernameFormat(emailInput);
      if (!usernameCheck.valid) {
        setAuthError({ message: formatAuthError(usernameCheck.error || 'Enter a valid username.') });
        return;
      }
      formattedEmail = usernameCheck.cleanUsername!;
    } else {
      const emailCheck = validateLoginEmail(emailInput);
      if (!emailCheck.valid) {
        setAuthError({ message: formatAuthError(emailCheck.error || 'Enter your username.') });
        return;
      }
      formattedEmail = emailCheck.cleanEmail!;
    }

    if (formattedEmail.endsWith('@gmail.com')) {
      setAuthError({ message: 'Please continue with Google to use a Gmail account.' });
      return;
    }

    if (!password) {
      setAuthError({ message: 'Please enter your password.' });
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setLoading(false);
        setAuthError({ message: 'Please enter your full name.' });
        return;
      }
      if (password.length < 8) {
        setLoading(false);
        setAuthError({ message: 'Password must be at least 8 characters long.' });
        return;
      }
      if (password !== confirmPassword) {
        setLoading(false);
        setAuthError({ message: 'Passwords do not match.' });
        return;
      }

      const result = await registerUserAccount({
        email: formattedEmail,
        password,
        fullName: fullName.trim(),
      });

      if (!result.success) {
        setLoading(false);
        setAuthError({ message: formatAuthError(result.error || 'Failed to create account.') });
        return;
      }

      setSuccessNotice('Account created successfully!');
      setTimeout(() => {
        setLoading(false);
        const existingSession = getActiveSession();
        const sessionData = {
          name: result.user!.fullName,
          email: result.user!.normalizedEmail,
          username: result.user!.username,
          avatar: result.user!.avatar,
          provider: result.user!.provider || 'email',
          role: result.user!.role || existingSession?.role || 'user',
        };
        onAuthSuccess?.(sessionData);
        const target = sessionData.role === 'superadmin' ? 'superadmin' : 'dashboard';
        onNavigate(target);
      }, 400);
    } else {
      const result = await authenticateUserCredentials(formattedEmail, password);

      if (!result.success) {
        setLoading(false);
        setAuthError({ message: formatAuthError(result.error || 'Invalid username or password.') });
        return;
      }

      setSuccessNotice(`Welcome back, ${result.user!.fullName}!`);
      setTimeout(() => {
        setLoading(false);
        const existingSession = getActiveSession();
        const sessionData = {
          name: result.user!.fullName,
          email: result.user!.normalizedEmail,
          username: result.user!.username,
          avatar: result.user!.avatar,
          provider: result.user!.provider || 'email',
          role: result.user!.role || existingSession?.role || 'user',
        };
        onAuthSuccess?.(sessionData);
        onNavigate(sessionData.role === 'superadmin' ? 'superadmin' : 'dashboard');
      }, 300);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot-password' | 'reset-password') => {
    setMode(newMode);
    setAuthError(null);
    setSuccessNotice(null);
    setResetSuccess(false);
    setForgotSent(false);
    if (window.location.hash !== `#/${newMode}`) {
      window.history.pushState(null, '', `#/${newMode}`);
    }
  };


  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-[#0a0a0c] text-neutral-900 dark:text-white relative flex flex-col justify-between select-none py-2 sm:py-4">
      {/* Background Subtle Dot Grid */}
      <HeroDotGrid />

      {/* Top Compact Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between shrink-0">
        {/* Brand Lockup (Website Logo Logic) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '#/home';
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }}
          className="flex items-center focus:outline-none transition-opacity duration-200 hover:opacity-80 cursor-pointer group py-1 shrink-0 select-none"
          aria-label="MalVision Home"
        >
          <img
            src={malvisionLogoSvg}
            alt="MalVision"
            draggable={false}
            className="h-6 sm:h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] pointer-events-none select-none"
          />
        </button>

        {/* Right Tools: Theme Toggle + Back Navigation */}
        <div className="flex items-center space-x-2.5">
          <ThemeToggle />

          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Centered Single-Viewport Content Container */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-2 sm:py-4 overflow-y-auto">
        <div className="w-full max-w-[440px] bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/50 p-4 sm:p-6 space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Compact Header Title */}
          <div className="space-y-0.5 text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot-password' && (forgotSent ? 'Check your email' : 'Forgot your password?')}
              {mode === 'reset-password' && 'Reset your password'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {mode === 'login' && 'Sign in to continue to your account'}
              {mode === 'signup' && 'Get started with MalVision threat intelligence'}
              {mode === 'forgot-password' && !forgotSent && 'Enter your registered email address to receive a password reset link.'}
              {mode === 'forgot-password' && forgotSent && `Password reset link sent to ${forgotEmail}`}
              {mode === 'reset-password' && (forgotEmail ? `Set a new password for ${forgotEmail}` : 'Set a new password for your account')}
            </p>
          </div>

          {/* Alert / Success Banners */}
          {authError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs space-y-0.5 animate-in fade-in">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Notice</span>
              </div>
              <p className="text-[11px] opacity-90 leading-tight">
                {authError.isOriginMismatch ? (
                  <>
                    Please register <code>https://malvision.vercel.app</code> under <strong>Authorised JavaScript origins</strong> in Google Cloud Console.
                  </>
                ) : (
                  typeof authError.message === 'string' && authError.message !== '[object Object]'
                    ? authError.message
                    : formatAuthError(authError.message)
                )}
              </p>
            </div>
          )}

          {successNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* FORGOT PASSWORD SENT DISPLAY */}
          {mode === 'forgot-password' && forgotSent ? (
            <div className="py-4 space-y-4 text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">✓ Password reset link sent</h3>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setForgotSent(false)}
                  className="w-full py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                >
                  Send to a different email
                </button>
              </div>
            </div>
          ) : mode === 'reset-password' && !resetCode ? (
            /* RESET PASSWORD MISSING TOKEN DISPLAY */
            <div className="py-4 space-y-4 text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Invalid or missing reset link</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  This reset link is missing its security token. Please click the exact link from your email or request a new reset link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => switchMode('forgot-password')}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
              >
                Request New Reset Link
              </button>
            </div>
          ) : mode === 'reset-password' && resetSuccess ? (
            /* RESET PASSWORD SUCCESS DISPLAY */
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">✓ Password updated</h3>
                <p className="text-xs text-neutral-400">Your password has been changed successfully.</p>
              </div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
              >
                Sign In
              </button>
            </div>
          ) : (
            /* Compact Authentication Form */
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* FORGOT PASSWORD FORM */}
              {mode === 'forgot-password' && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Verified Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                    />
                  </div>
                </div>
              )}



              {mode === 'signup' && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Full name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                    />
                  </div>
                </div>
              )}

              {/* Username Input (Login / Signup) */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Username
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={emailInput}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="Enter username"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    {mode === 'reset-password' ? 'New Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'signup' || mode === 'reset-password' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' || mode === 'reset-password' ? 'Create a new password' : 'Enter your password'}
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (Sign Up & Reset Password mode) */}
              {(mode === 'signup' || mode === 'reset-password') && (
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Confirm password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password Row (Login mode only) */}
              {mode === 'login' && (
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <label className="flex items-center space-x-1.5 text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary Submit CTA Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {mode === 'login' && 'Signing in...'}
                      {mode === 'signup' && 'Creating account...'}
                      {mode === 'forgot-password' && 'Sending link...'}
                      {mode === 'reset-password' && 'Resetting password...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create account'}
                    {mode === 'forgot-password' && 'Send Reset Link'}
                    {mode === 'reset-password' && 'Reset Password'}
                  </span>
                )}
              </button>
            </form>
          )}

          {/* Divider & Google Auth (Only for Login & Signup) */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                </div>
                <div className="relative px-2.5 bg-white dark:bg-[#141416] text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  or
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center space-x-2.5 shadow-xs active:scale-[0.99] disabled:opacity-50"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Switch Mode Footer Text */}
          <div className="border-t border-neutral-200/80 dark:border-neutral-800/80 pt-2.5 text-center text-[11px] text-neutral-600 dark:text-neutral-400">
            {mode === 'login' && (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer ml-1"
                >
                  Create account
                </button>
              </span>
            )}
            {mode === 'signup' && (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
            {(mode === 'forgot-password' || mode === 'reset-password') && (
              <span>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

        </div>
      </main>

      {/* Minimal Bottom Footer */}
      <footer className="relative z-20 py-2 text-center text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
        MalVision Threat Intelligence
      </footer>
    </div>
  );
};
