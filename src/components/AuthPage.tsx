import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import malvisionLogoSvg from '../assets/MalVision_logo_pixel_match.svg';
import { ThemeToggle } from './ThemeToggle';
import { HeroDotGrid } from './HeroDotGrid';
import { authenticateWithGoogle, renderGoogleSignInButton, type GoogleUserProfile } from '../lib/googleAuth';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onNavigate: (page: string) => void;
  onAuthSuccess?: (user: GoogleUserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onNavigate,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
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

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Update mode if prop changes
  useEffect(() => {
    setMode(initialMode);
    setAuthError(null);
    setSuccessNotice(null);
  }, [initialMode]);

  // Google GSI Button Initialization
  useEffect(() => {
    setAuthError(null);
    const timer = setTimeout(() => {
      if (googleBtnRef.current) {
        renderGoogleSignInButton(
          googleBtnRef.current,
          (user) => {
            setGoogleLoading(true);
            setSuccessNotice(`Welcome back, ${user.name}!`);
            setTimeout(() => {
              setGoogleLoading(false);
              onAuthSuccess?.(user);
              onNavigate('dashboard');
            }, 600);
          },
          (err) => {
            console.warn('GSI button notice:', err);
          }
        );
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [mode]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      const user = await authenticateWithGoogle();
      setSuccessNotice(`Welcome back, ${user.name}!`);
      setTimeout(() => {
        setGoogleLoading(false);
        onAuthSuccess?.(user);
        onNavigate('dashboard');
      }, 600);
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      setGoogleLoading(false);
      const msg = err?.message || 'Google authentication was cancelled.';
      const isOriginMismatch =
        msg.toLowerCase().includes('origin') ||
        msg.toLowerCase().includes('mismatch') ||
        msg.toLowerCase().includes('400');
      setAuthError({ message: msg, isOriginMismatch });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !email.includes('@')) {
      setAuthError({ message: 'Please enter a valid email address.' });
      return;
    }

    if (!password) {
      setAuthError({ message: 'Please enter your password.' });
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setAuthError({ message: 'Please enter your full name.' });
        return;
      }
      if (password.length < 6) {
        setAuthError({ message: 'Password must be at least 6 characters long.' });
        return;
      }
      if (password !== confirmPassword) {
        setAuthError({ message: 'Passwords do not match.' });
        return;
      }
    }

    setLoading(true);

    // Simulate clean authentication response
    setTimeout(() => {
      setLoading(false);
      const derivedName = fullName.trim() || email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = derivedName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const user: GoogleUserProfile = {
        name: formattedName,
        email: email.trim().toLowerCase(),
        provider: 'email',
      };

      onAuthSuccess?.(user);
      onNavigate('dashboard');
    }, 600);
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setAuthError(null);
    setSuccessNotice(null);
    if (window.location.hash !== `#/${newMode}`) {
      window.history.pushState(null, '', `#/${newMode}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-[#0a0a0c] text-neutral-900 dark:text-white relative overflow-x-hidden flex flex-col justify-between select-none">
      {/* Background Subtle Dot Grid */}
      <HeroDotGrid />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        {/* Brand Lockup */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-2.5 focus:outline-none opacity-95 hover:opacity-100 transition cursor-pointer group"
          aria-label="MalVision Home"
        >
          <img
            src={malvisionLogoSvg}
            alt="MalVision Logo"
            className="h-6 sm:h-7 w-auto object-contain dark:invert transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white leading-none">
            MalVision
          </span>
        </button>

        {/* Right Tools: Theme Toggle + Back Navigation */}
        <div className="flex items-center space-x-3">
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

      {/* Main Centered Content Container */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[480px] bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/50 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Title */}
          <div className="space-y-1 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {mode === 'login'
                ? 'Sign in to continue to your account'
                : 'Get started with MalVision threat intelligence'}
            </p>
          </div>

          {/* Alert / Success Banners */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Notice</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {authError.isOriginMismatch ? (
                  <>
                    Please register <code>https://malvision.vercel.app</code> under <strong>Authorised JavaScript origins</strong> in Google Cloud Console.
                  </>
                ) : (
                  authError.message
                )}
              </p>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up mode only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password Row (Login mode only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
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
                  onClick={() => setAuthError({ message: 'Password reset link sent to your email.' })}
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
              className="w-full py-3 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create account'}</span>
              )}
            </button>
          </form>

          {/* Divider: or */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative px-3 bg-white dark:bg-[#141416] text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              or
            </div>
          </div>

          {/* Google Authentication */}
          <div className="space-y-3">
            <div ref={googleBtnRef} className="w-full flex items-center justify-center min-h-[40px]" />

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 font-semibold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer flex items-center justify-center space-x-2.5 active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>
          </div>

          {/* Terms & Privacy Disclaimer */}
          <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400 leading-relaxed pt-1">
            By {mode === 'login' ? 'signing in' : 'creating an account'} you agree to our{' '}
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="font-semibold text-neutral-800 dark:text-neutral-200 hover:underline cursor-pointer"
            >
              terms
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="font-semibold text-neutral-800 dark:text-neutral-200 hover:underline cursor-pointer"
            >
              privacy policy
            </button>
          </p>

          {/* Switch Mode Footer Text */}
          <div className="border-t border-neutral-200/80 dark:border-neutral-800/80 pt-4 text-center text-xs text-neutral-600 dark:text-neutral-400">
            {mode === 'login' ? (
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
            ) : (
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
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 py-4 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
        MalVision Threat Intelligence
      </footer>
    </div>
  );
};
