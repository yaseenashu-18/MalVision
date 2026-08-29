import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { authenticateWithGoogle, renderGoogleSignInButton, type GoogleUserProfile } from '../lib/googleAuth';
import robotMascot from '../assets/robot_mascot.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: (user: GoogleUserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; isOriginMismatch?: boolean } | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<GoogleUserProfile | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
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

  const handleGoogleSignIn = async () => {
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
      const msg = err?.message || 'Google sign-in was not completed.';
      const isOriginMismatch = msg.toLowerCase().includes('origin') || msg.toLowerCase().includes('mismatch') || msg.toLowerCase().includes('400');
      setAuthError({ message: msg, isOriginMismatch });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-2xl animate-in fade-in duration-300 select-none"
      onClick={onClose}
    >
      {/* Close X Button - Floating Top Right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer z-50 backdrop-blur-md"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Pure Text & Button Overlay Container - NO BOX / NO CARDS */}
      <div 
        className="w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-200 py-4 px-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 p-3 flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10">
            <img src={robotMascot} alt="MalVision Logo" className="w-10 h-10 object-contain drop-shadow" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              MalVision
            </h1>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Advanced Threat Intelligence
            </p>
          </div>
        </div>

        {/* Welcome Text Header */}
        <div className="space-y-1 pt-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Sign in to continue to MalVision
          </p>
        </div>

        {/* Error Notification Banner */}
        {authError && (
          <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs space-y-1 text-left backdrop-blur-md animate-in fade-in">
            <div className="flex items-center space-x-2 font-bold text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError.isOriginMismatch ? 'Google Origin Setup Required' : 'Authentication Notice'}</span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {authError.isOriginMismatch ? (
                <>
                  Register <code>https://malvision.vercel.app</code> and <code>http://localhost:5173</code> under <strong>Authorised JavaScript origins</strong> in Google Cloud Console.
                </>
              ) : (
                authError.message
              )}
            </p>
          </div>
        )}

        {/* Action Body */}
        {loading ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in duration-200">
            {authenticatedUser ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  Welcome, {authenticatedUser.name}!
                </h3>
              </>
            ) : (
              <>
                <Loader2 className="w-10 h-10 text-white animate-spin mx-auto" />
                <p className="text-xs text-neutral-400">
                  Connecting to Google OAuth...
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2 flex flex-col items-center max-w-xs mx-auto">
            {/* Google Rendered GSI Button Container */}
            <div ref={googleBtnRef} className="w-full flex items-center justify-center min-h-[44px]" />

            {/* Single High-Contrast "Sign in with Google" Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-5 rounded-full bg-white text-neutral-900 font-bold text-xs hover:bg-neutral-100 transition cursor-pointer flex items-center justify-center space-x-3 shadow-xl active:scale-[0.98]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
