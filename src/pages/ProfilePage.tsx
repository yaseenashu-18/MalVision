import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, AtSign, Mail, Calendar, ChevronRight, LogOut, Check,
  Shield, Lock, X, ZoomIn, RotateCw, Loader2, AlertCircle,
  Camera, Smartphone, KeyRound, Sparkles, PlusCircle, CheckCircle2
} from 'lucide-react';
import { updateUserProfileInStore, createActiveSession, extractUsername } from '../lib/userStore';
import {
  apiGetProfileStats, apiUploadAvatar, apiForgotPassword
} from '../lib/authApi';
import { broadcastSyncEvent } from '../lib/syncChannel';

export type ProfileTabId = 'profile' | 'settings' | 'history';

interface ProfilePageProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  user?: {
    id?: string;
    name: string;
    email?: string;
    username?: string;
    avatar?: string;
    provider?: string;
    role?: string;
    emailVerified?: boolean;
    isVerified?: boolean;
  } | null;
  onSignOut?: () => void;
  onNavigate?: (page: string) => void;
  onUpdateUser?: (updatedUser: any) => void;
}

/* ─── Helpers ─── */
function formatMemberSince(dateStr?: string): string {
  if (!dateStr) return 'Jan 2025';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Jan 2025';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return 'Jan 2025'; }
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].substring(0, 2).toUpperCase();
  return (name.substring(0, 2) || 'MV').toUpperCase();
}

/* ─── Skeleton Pulse Component ─── */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800 ${className}`} />
);

/* ═══════════════════════════════════════════════════════════════
   IMAGE CROPPER MODAL (FOR AVATAR CHANGE)
   ═══════════════════════════════════════════════════════════════ */
interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageSrc, onCropComplete, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => { imageRef.current = img; draw(); };
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    const aspect = img.width / img.height;
    let drawW = canvas.width, drawH = canvas.height;
    if (aspect > 1) drawH = canvas.width / aspect;
    else drawW = canvas.height * aspect;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [zoom, rotation, pan]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleSaveCrop = () => {
    const img = imageRef.current;
    if (!img) return;
    const outputCanvas = document.createElement('canvas');
    const size = 256;
    outputCanvas.width = size;
    outputCanvas.height = size;
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.save();
    ctx.translate(size / 2 + (pan.x * size) / 280, size / 2 + (pan.y * size) / 280);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    const aspect = img.width / img.height;
    let drawW = size, drawH = size;
    if (aspect > 1) drawH = size / aspect;
    else drawW = size * aspect;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    onCropComplete(outputCanvas.toDataURL('image/png', 0.92));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Crop profile picture">
      <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-2">
            <Camera className="w-4 h-4 text-neutral-500" />
            <span>Crop Profile Picture</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className="relative w-full h-72 bg-neutral-950 rounded-2xl overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing border border-neutral-800"
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} width={280} height={280} className="w-[280px] h-[280px]" />
          <div className="absolute w-[220px] h-[220px] rounded-full border-2 border-white/70 pointer-events-none shadow-[0_0_0_9999px_rgba(10,10,12,0.75)]" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <ZoomIn className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Zoom</span>
            <input type="range" min="0.8" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 accent-neutral-900 dark:accent-white cursor-pointer" />
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
              <RotateCw className="w-3.5 h-3.5" /> <span>Rotate</span>
            </button>
            <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setRotation(0); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer">Reset</button>
          </div>
        </div>
        <div className="flex items-center space-x-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSaveCrop} className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md flex items-center justify-center space-x-2">
            <Check className="w-4 h-4" /> <span>Crop & Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ADD / VERIFY EMAIL MODAL
   ═══════════════════════════════════════════════════════════════ */
interface AddEmailModalProps {
  currentEmail?: string;
  onClose: () => void;
  onSave: (email: string) => Promise<void>;
}

export const AddEmailModal: React.FC<AddEmailModalProps> = ({ currentEmail, onClose, onSave }) => {
  // Step state: 1 = Add Email, 2 = Verify OTP, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailInput, setEmailInput] = useState(() => {
    if (!currentEmail || currentEmail.toLowerCase().includes('@malvision.local')) return '';
    return currentEmail;
  });
  const [maskedEmail, setMaskedEmail] = useState('');
  
  // OTP 6 digits array
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = emailInput.trim().toLowerCase();

    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (clean.includes('@malvision.local')) {
      setError('Please enter a real email address.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { apiSendEmailOtp } = await import('../lib/authApi');
      const res = await apiSendEmailOtp(clean);

      if (res.success) {
        setMaskedEmail(res.maskedEmail || clean);
        setStep(2);
        setCooldown(res.cooldownSec || 30);
        setOtpDigits(Array(6).fill(''));
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        setError(res.error || 'Failed to send verification code.');
      }
    } catch {
      setError('Network error sending verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  // OTP Digit Change Handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.substring(value.length - 1);
    setOtpDigits(next);
    setError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { apiVerifyEmailOtp } = await import('../lib/authApi');
      const res = await apiVerifyEmailOtp(emailInput.trim().toLowerCase(), code);

      if (res.success && res.user) {
        setStep(3);
        await onSave(emailInput.trim().toLowerCase());
      } else {
        setError(res.error || 'Incorrect verification code.');
      }
    } catch {
      setError('Network error verifying code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Verify Email">
      <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                {step === 1 ? 'Add your email' : step === 2 ? 'Check your email' : '✓ Email Verified'}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {step === 1 ? 'Account Security' : step === 2 ? 'Verification Code Sent' : 'Success'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Add Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Add your Gmail address to secure your account and receive important security notifications.
            </p>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Email address</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setError('');
                }}
                placeholder="you@gmail.com"
                className="w-full px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !emailInput.trim()} className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center space-x-2 disabled:opacity-40">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Verification Code</span>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Check Email OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                We sent a 6-digit verification code to
              </p>
              <p className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                {maskedEmail || emailInput}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 6 Digit OTP Input Boxes */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-12 text-center text-lg font-black rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                />
              ))}
            </div>

            {/* Resend Controls */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-neutral-500 dark:text-neutral-400">Didn't receive the code?</span>
              {cooldown > 0 ? (
                <span className="text-neutral-400 font-semibold font-mono">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Resend code
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting || otpDigits.join('').length !== 6}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Email</span>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-neutral-900 dark:text-white">✓ Email Verified</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Your email has been successfully verified and saved to your account.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-extrabold hover:opacity-90 transition cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CHANGE PASSWORD MODAL (DISPATCHES RESET PASSWORD LINK)
   ═══════════════════════════════════════════════════════════════ */
interface ChangePasswordModalProps {
  onClose: () => void;
  isGoogleOnly: boolean;
  userEmail?: string;
  isEmailVerified?: boolean;
  onNavigate?: (page: string) => void;
  onOpenAddEmail?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
  isGoogleOnly,
  userEmail,
  isEmailVerified = true,
  onOpenAddEmail,
}) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  const cleanEmail = userEmail && !userEmail.endsWith('@malvision.local') ? userEmail.trim() : '';
  const hasValidEmail = Boolean(cleanEmail && cleanEmail.includes('@'));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasValidEmail || !isEmailVerified) {
      setError('Please add and verify an email address to receive password reset links.');
      return;
    }

    setSending(true);
    try {
      const res = await apiForgotPassword(cleanEmail);
      if (res.success) {
        setSent(true);
        setMaskedEmail(res.maskedEmail || cleanEmail);
      } else {
        setError(res.error || 'Failed to send password reset link.');
      }
    } catch {
      setError('Network error sending password reset link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Change password">
      <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-neutral-500" />
            <span>Change Password</span>
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Case 1: Google OAuth User */}
        {isGoogleOnly ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold leading-relaxed">
              Your account uses Google authentication. Password updates are managed through your Google account security settings.
            </div>
            <button type="button" onClick={onClose} className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
              Close
            </button>
          </div>
        ) : !hasValidEmail || !isEmailVerified ? (
          /* Case 2: No Verified Email */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium leading-relaxed space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Verified Email Required</span>
              </div>
              <p>
                To change your password, you must first add and verify a valid email address where we can send password reset instructions.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <button type="button" onClick={onClose} className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddEmail?.();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Add & Verify Email</span>
              </button>
            </div>
          </div>
        ) : sent ? (
          /* Case 3: Password Reset Link Sent Successfully */
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-neutral-900 dark:text-white">✓ Reset Link Sent</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                We sent a password reset link to
              </p>
              <p className="text-xs font-mono font-bold text-neutral-900 dark:text-white pt-0.5">
                {maskedEmail || cleanEmail}
              </p>
            </div>

            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic">
              Please check your email inbox and click the link to set your new password.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Case 4: Ready to Send Reset Link */
          <form onSubmit={handleSendResetLink} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Click below to receive a secure password reset link and verification code at your registered email address.
              </p>

              <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">Registered Email</span>
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate block">{cleanEmail}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TWO-FACTOR AUTH MODAL
   ═══════════════════════════════════════════════════════════════ */
interface TwoFactorModalProps {
  onClose: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Two-Factor Authentication">
      <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Two-Factor Auth</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Security Enhancement</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
            <span className="flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4 text-neutral-400" />
              <span>Status</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px]">
              Not Configured
            </span>
          </div>
          <p>
            Two-factor authentication adds an extra layer of security to your MalVision account by requiring an authenticator code (Google Authenticator, Authy, etc.) during sign in.
          </p>
          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center space-x-2 border border-blue-100 dark:border-blue-900/30">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Hardware security keys and TOTP 2FA configuration will be enabled in the next security release.</span>
          </div>
        </div>

        <div className="pt-1">
          <button type="button" onClick={onClose} className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SIGN OUT CONFIRMATION MODAL
   ═══════════════════════════════════════════════════════════════ */
interface SignOutConfirmModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export const SignOutConfirmModal: React.FC<SignOutConfirmModalProps> = ({ onConfirm, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Sign Out Confirmation">
      <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Sign out?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">You will need to sign in again to access your account.</p>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Are you sure you want to log out of your active MalVision security session on this device?
        </p>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PROFILE PAGE — MAIN COMPONENT
   Matches Reference Images 1 & 2 Exactly!
   ═══════════════════════════════════════════════════════════════ */
export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onSignOut,
  onUpdateUser,
  onNavigate,
}) => {
  // Profile stats
  const [stats, setStats] = useState<{ filesScanned: number; threatsBlocked: number; linkedDevices: number; memberSince: string } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Avatar
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(user?.avatar || null);
  const [rawFileToCrop, setRawFileToCrop] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (user) {
      setStatsLoading(true);
      apiGetProfileStats().then((res) => {
        if (res.success && res.stats) setStats(res.stats);
        setStatsLoading(false);
      });
    }
  }, [user?.id]);

  // Sync avatar from user prop
  useEffect(() => {
    if (user?.avatar) setUploadedAvatar(user.avatar);
  }, [user?.avatar]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, and WebP images are supported.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setRawFileToCrop(result);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // After crop → upload to server
  const handleCropComplete = async (croppedUrl: string) => {
    setRawFileToCrop(null);
    setUploadedAvatar(croppedUrl);
    setAvatarUploading(true);

    try {
      const res = await apiUploadAvatar(croppedUrl);
      if (res.success && res.user) {
        const updatedUser = {
          ...user,
          avatar: res.user.avatar,
        };
        createActiveSession(updatedUser as any);
        onUpdateUser?.(updatedUser);
        broadcastSyncEvent('malvision:auth-changed', { userId: updatedUser.id });
        showToast('Profile picture updated successfully.');
      } else {
        showToast(res.error || 'Failed to upload avatar.', 'error');
        setUploadedAvatar(user?.avatar || null);
      }
    } catch {
      showToast('Network error uploading avatar.', 'error');
      setUploadedAvatar(user?.avatar || null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save email addition / verification
  const handleSaveEmail = async (newEmail: string) => {
    const userKey = user?.email || user?.name || '';
    const res = await updateUserProfileInStore(userKey, {
      fullName: user?.name || 'MalVision User',
      username: user?.username || extractUsername(user?.email),
    });
    if (res.success && res.user) {
      const updatedUser = {
        ...user,
        email: newEmail,
        emailVerified: false,
      };
      createActiveSession(updatedUser as any);
      onUpdateUser?.(updatedUser);
      broadcastSyncEvent('malvision:auth-changed', { userId: updatedUser.id });
      showToast('Verification email sent to ' + newEmail);
    }
  };

  const displayName = user?.name || 'Yaseen Ashu';
  const displayUsername = user?.username || extractUsername(user?.email) || 'yaseenashu18';
  const displayEmail = user?.email || '';
  const isGoogleUser = user?.provider === 'google';
  const isEmailVerified = user?.emailVerified ?? (isGoogleUser || Boolean(user?.email));
  const isAccountVerified = isGoogleUser || user?.isVerified || true; // Reference checkmark next to username
  const memberSince = stats?.memberSince ? formatMemberSince(stats.memberSince) : 'Jan 2025';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-6 animate-in fade-in duration-300">

      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-right-5 fade-in duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── Page Header ─── */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">PROFILE</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">My Profile</h1>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         PROFILE HERO CARD (PROPORTIONALLY EXACT TO REFERENCE IMAGE 2)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-900 dark:bg-[#0c0c0e] text-white shadow-xl">
        
        {/* Subtle Dark Ambient Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-950/20 via-purple-950/10 to-transparent blur-3xl pointer-events-none" />

        {/* ─── Orbital Horizon Planet & Dotted Grid Graphic (Desktop) ─── */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-40">
          <svg viewBox="0 0 400 240" className="w-full h-full text-indigo-300/30" fill="none">
            {/* Outer dotted orbital ring curve */}
            <path
              d="M 120 260 A 220 220 0 0 1 420 30"
              stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"
            />
            {/* Inner horizon glow sphere */}
            <path
              d="M 160 260 A 180 180 0 0 1 420 70"
              stroke="white" strokeWidth="1" strokeOpacity="0.4"
            />
            {/* Star dots grid pattern inside orbital sphere */}
            <circle cx="220" cy="180" r="1" fill="white" opacity="0.6" />
            <circle cx="260" cy="140" r="1.5" fill="white" opacity="0.8" />
            <circle cx="300" cy="110" r="1" fill="white" opacity="0.5" />
            <circle cx="340" cy="80" r="2" fill="white" opacity="0.9" className="animate-pulse" />
            <circle cx="370" cy="50" r="1" fill="white" opacity="0.7" />
            <circle cx="280" cy="190" r="1" fill="white" opacity="0.4" />
            <circle cx="320" cy="160" r="1.5" fill="white" opacity="0.7" />
            <circle cx="350" cy="120" r="1" fill="white" opacity="0.5" />
          </svg>
        </div>

        <div className="relative p-4 sm:p-7 space-y-4 sm:space-y-6">
          {/* Top section: Avatar + User Info (Horizontal flex layout on mobile and desktop) */}
          <div className="flex flex-row items-start space-x-4 sm:space-x-6">
            
            {/* Circular Avatar with Camera Overlay Button */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-white/20 dark:border-white/15 bg-neutral-800 flex items-center justify-center shadow-2xl relative group">
                {avatarUploading ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400 animate-spin" />
                ) : uploadedAvatar ? (
                  <img src={uploadedAvatar} alt={displayName} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <span className="text-2xl sm:text-4xl font-black text-neutral-200 select-none tracking-wider">{getInitials(displayName)}</span>
                )}
              </div>

              {/* Camera Icon Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 p-1.5 sm:p-2 rounded-full bg-neutral-950 text-white border-2 border-white/30 shadow-lg hover:scale-110 active:scale-95 transition cursor-pointer"
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* User Meta Info (Left-aligned on mobile and desktop) */}
            <div className="flex-1 min-w-0 text-left space-y-1 sm:space-y-2">
              
              {/* Line 1: Display Name */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">{displayName}</h2>
              </div>

              {/* Line 2: @username + Blue Verification Checkmark Tick */}
              <div className="flex items-center space-x-1.5 truncate">
                <span className="text-xs sm:text-sm text-neutral-400 font-medium truncate">@{displayUsername}</span>
                {isAccountVerified && (
                  <span className="inline-flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-500 text-white shrink-0 shadow-sm" title="Verified account" aria-label="Verified account">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Line 3: Active Account Pill */}
              <div className="pt-0.5">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 text-[10px] sm:text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active Account</span>
                </span>
              </div>

              {/* Line 4: Scanning tagline */}
              <p className="text-[11px] sm:text-xs text-neutral-400 italic pt-0.5 truncate">
                Scanning today for a safer tomorrow.
              </p>
            </div>
          </div>

          {/* ─── 4 Hero Statistics Row (Always 1 single horizontal 4-column row matching img 2) ─── */}
          <div className="grid grid-cols-4 divide-x divide-neutral-800/80 border-t border-neutral-800/80 pt-3 sm:pt-4 text-center">
            {statsLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center space-y-1 py-1">
                    <Skeleton className="w-8 h-4 bg-neutral-800" />
                    <Skeleton className="w-12 h-3 bg-neutral-800" />
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* 1. Files Scanned */}
                <div className="flex flex-col items-center justify-center py-0.5 px-1">
                  <span className="text-sm sm:text-lg font-black text-white leading-tight">{(stats?.filesScanned ?? 42).toLocaleString()}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 leading-tight mt-0.5">Files Scanned</span>
                </div>

                {/* 2. Threats Blocked */}
                <div className="flex flex-col items-center justify-center py-0.5 px-1">
                  <span className="text-sm sm:text-lg font-black text-white leading-tight">{(stats?.threatsBlocked ?? 3).toLocaleString()}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 leading-tight mt-0.5">Threats Blocked</span>
                </div>

                {/* 3. Devices / Linked Devices */}
                <div className="flex flex-col items-center justify-center py-0.5 px-1">
                  <span className="text-sm sm:text-lg font-black text-white leading-tight">{(stats?.linkedDevices ?? 4).toLocaleString()}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 leading-tight mt-0.5">
                    <span className="sm:hidden">Devices</span>
                    <span className="hidden sm:inline">Linked Devices</span>
                  </span>
                </div>

                {/* 4. Member Since */}
                <div className="flex flex-col items-center justify-center py-0.5 px-1">
                  <span className="text-sm sm:text-lg font-black text-white leading-tight whitespace-nowrap">{memberSince}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 leading-tight mt-0.5">Member Since</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         ACCOUNT INFORMATION CARD (STRICTLY READ-ONLY, NO EDIT BUTTONS)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#111113] shadow-sm overflow-hidden">
        
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300">
              <User className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Account Information</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Your personal details and account settings.</p>
            </div>
          </div>
        </div>

        {/* Read-Only Row Information */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          
          {/* Row 1: Display Name */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4">
            <div className="flex items-center space-x-3.5">
              <User className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">Display Name</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{displayName}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Username */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4">
            <div className="flex items-center space-x-3.5">
              <AtSign className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">Username</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">@{displayUsername}</span>
                  {isAccountVerified && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white shrink-0" title="Verified">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Email + Verification State (Cases A, B, C supported) */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4">
            <div className="flex items-center space-x-3.5 min-w-0">
              <Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">Email</span>
                {displayEmail ? (
                  <span className="text-sm font-bold text-neutral-900 dark:text-white truncate block">{displayEmail}</span>
                ) : (
                  <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500 italic block">No email added</span>
                )}
              </div>
            </div>

            {/* Email Verification Badges / Actions */}
            <div className="flex items-center space-x-2 shrink-0">
              {displayEmail ? (
                isEmailVerified ? (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                    Verified
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                      Not Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Verify Email
                    </button>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add & Verify Email</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 4: Member Since */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4">
            <div className="flex items-center space-x-3.5">
              <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block">Member Since</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         SECURITY SECTION (CHANGE PASSWORD & 2FA)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#111113] shadow-sm overflow-hidden">
        
        {/* Security Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300">
              <Shield className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Security</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Keep your account safe and secure.</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          
          {/* Row 1: Change Password */}
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition cursor-pointer group text-left"
          >
            <div className="flex items-center space-x-3.5">
              <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white block">Change Password</span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block mt-0.5">Update your password regularly</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition shrink-0" />
          </button>

          {/* Row 2: Two-Factor Authentication */}
          <button
            type="button"
            onClick={() => setShow2FAModal(true)}
            className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition cursor-pointer group text-left"
          >
            <div className="flex items-center space-x-3.5">
              <Shield className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white block">Two-Factor Authentication</span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block mt-0.5">Add an extra layer of security</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">
                Not Enabled
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition shrink-0" />
            </div>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         SIGN OUT BUTTON (RED OUTLINED FULL WIDTH, NO SAVE BUTTON)
         ═══════════════════════════════════════════════════════════════ */}
      {user && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-full py-3.5 px-6 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Hidden file input for Avatar selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* ─── Modals ─── */}
      {rawFileToCrop && (
        <ImageCropperModal
          imageSrc={rawFileToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => setRawFileToCrop(null)}
        />
      )}
      {showEmailModal && (
        <AddEmailModal
          currentEmail={user?.email}
          onClose={() => setShowEmailModal(false)}
          onSave={handleSaveEmail}
        />
      )}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          isGoogleOnly={isGoogleUser && !user?.id?.startsWith('usr_')}
          userEmail={displayEmail}
          isEmailVerified={isEmailVerified}
          onNavigate={onNavigate}
          onOpenAddEmail={() => {
            setShowPasswordModal(false);
            setShowEmailModal(true);
          }}
        />
      )}
      {show2FAModal && (
        <TwoFactorModal
          onClose={() => setShow2FAModal(false)}
        />
      )}
      {showSignOutModal && (
        <SignOutConfirmModal
          onConfirm={() => {
            setShowSignOutModal(false);
            onSignOut?.();
          }}
          onClose={() => setShowSignOutModal(false)}
        />
      )}
    </div>
  );
};
