import React, { useState } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { authenticateWithGoogle, type GoogleUserProfile } from '../lib/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: (user: GoogleUserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<GoogleUserProfile | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const user = await authenticateWithGoogle();
      setAuthenticatedUser(user);
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess?.(user);
        onClose();
        setAuthenticatedUser(null);
      }, 700);
    } catch (err) {
      console.error('Google OAuth authentication failed:', err);
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#1A1A1D] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative transform animate-in zoom-in-95 duration-200 p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          {/* Mascot SVG icon */}
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" className="stroke-current text-neutral-900 dark:text-white" strokeWidth="6">
              <rect x="20" y="30" width="60" height="48" rx="16" fill="currentColor" fillOpacity="0.08" />
              <circle cx="38" cy="50" r="5" fill="currentColor" />
              <circle cx="62" cy="50" r="5" fill="currentColor" />
              <path d="M42 63 C 46 67, 54 67, 58 63" strokeLinecap="round" />
              <path d="M50 30 L50 16" strokeLinecap="round" />
              <circle cx="50" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Get Started with MalVision
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
            Sign in with Google OAuth to save scan history, sync MongoDB reports, and protect your device.
          </p>
        </div>

        {/* Action Body */}
        {loading ? (
          <div className="py-6 text-center space-y-3 animate-in fade-in duration-200">
            {authenticatedUser ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Welcome, {authenticatedUser.name}!
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Google OAuth login verified: {authenticatedUser.email}
                </p>
              </>
            ) : (
              <>
                <Loader2 className="w-10 h-10 text-neutral-900 dark:text-white animate-spin mx-auto" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Connecting to Google OAuth...
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Verifying identity with Google accounts...
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Single "Continue with Google" Option */}
            <button
              onClick={handleGoogleAuth}
              className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-3 shadow-md active:scale-[0.98]"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4.5 h-4.5 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-neutral-400">
              By continuing, you agree to MalVision's{' '}
              <a href="#terms" className="underline hover:text-neutral-600 dark:hover:text-neutral-300">Terms</a> and{' '}
              <a href="#privacy" className="underline hover:text-neutral-600 dark:hover:text-neutral-300">Privacy Policy</a>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
