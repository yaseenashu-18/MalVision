import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { authenticateWithGoogle, renderGoogleSignInButton, type GoogleUserProfile } from '../lib/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: (user: GoogleUserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<GoogleUserProfile | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      // Small timeout to allow container to mount in DOM
      const timer = setTimeout(() => {
        if (googleBtnRef.current) {
          renderGoogleSignInButton(
            googleBtnRef.current,
            (user) => {
              setAuthenticatedUser(user);
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                onAuthSuccess?.(user);
                onClose();
                setAuthenticatedUser(null);
              }, 600);
            },
            (err) => {
              console.warn('GSI button notice:', err);
            }
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await authenticateWithGoogle();
      setAuthenticatedUser(user);
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess?.(user);
        onClose();
        setAuthenticatedUser(null);
      }, 600);
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      setLoading(false);
      setAuthError(err?.message || 'Google sign-in was not completed.');
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

        {/* Clean Modal Header */}
        <div className="text-center pt-2">
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Sign In
          </h2>
        </div>

        {/* Error Notification Banner */}
        {authError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-[11px] leading-tight">{authError}</span>
          </div>
        )}

        {/* Action Body */}
        {loading ? (
          <div className="py-6 text-center space-y-3 animate-in fade-in duration-200">
            {authenticatedUser ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Welcome, {authenticatedUser.name}!
                </h3>
              </>
            ) : (
              <>
                <Loader2 className="w-9 h-9 text-neutral-900 dark:text-white animate-spin mx-auto" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Signing in with Google...
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-1 flex flex-col items-center">
            {/* Google Rendered GSI Button Container */}
            <div ref={googleBtnRef} className="w-full flex items-center justify-center min-h-[44px]" />

            {/* Clean Backup Google Button */}
            <button
              onClick={handleDirectGoogleSignIn}
              className="w-full py-3 px-4 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2.5 shadow-sm active:scale-[0.98]"
            >
              <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
