import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { subscribeToToasts, dismissToast, type ToastItem } from '../lib/toastStore';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-5 right-4 sm:right-6 z-[9999] flex flex-col space-y-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none select-none"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-3.5 shadow-xl shadow-black/5 dark:shadow-black/40 flex items-start space-x-3 transition-all duration-300 ease-out transform ${
              toast.exiting
                ? 'opacity-0 translate-x-8 scale-95'
                : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-8 fade-in-0 duration-300'
            }`}
          >
            {/* Minimal Subtle Icon Badge */}
            <div
              className={`p-1.5 rounded-xl shrink-0 ${
                isError
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : isInfo
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : isInfo ? (
                <Info className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            {/* Clean Typography */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            {/* Minimal Close Button */}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0 -mr-1 -mt-0.5"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
