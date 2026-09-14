import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { getCookieConsent, acceptAllCookies, type CookiePreferences } from '../lib/cookieConsentStore';

interface CookieConsentBannerProps {
  onNavigate?: (page: string) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onNavigate }) => {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const current = getCookieConsent();
    setConsent(current);

    const handleConsentUpdate = (e: Event) => {
      const custom = e as CustomEvent<CookiePreferences>;
      if (custom.detail) {
        setConsent(custom.detail);
      }
    };

    window.addEventListener('malvision_cookie_consent_updated', handleConsentUpdate);
    return () => window.removeEventListener('malvision_cookie_consent_updated', handleConsentUpdate);
  }, []);

  if (!consent || consent.hasResponded) {
    return null;
  }

  const handleAccept = () => {
    const updated = acceptAllCookies();
    setConsent(updated);
  };

  const handleCookiePolicyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('cookies');
    } else {
      window.location.hash = '#/cookies';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9990] bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800/90 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
        {/* Left: Outline Icon + Content Text */}
        <div className="flex items-start sm:items-center space-x-3.5">
          {/* Crisp Minimal Monochrome Outline Icon */}
          <div className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900/80 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs">
            <Cookie className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
          </div>

          <div className="space-y-0.5 text-left">
            <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">
              We value your privacy
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
              We use cookies to enhance your browsing experience, analyze site performance, and ensure threat intelligence security. By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
              <button
                type="button"
                onClick={handleCookiePolicyClick}
                className="underline font-semibold text-neutral-900 dark:text-white hover:opacity-80 transition cursor-pointer"
              >
                Cookie Policy
              </button>
            </p>
          </div>
        </div>

        {/* Right: SINGLE Minimal High-Contrast ACCEPT ALL Button */}
        <div className="flex items-center justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-200/60 dark:border-neutral-800/60">
          <button
            type="button"
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-extrabold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-200 cursor-pointer shadow-md active:scale-95 whitespace-nowrap"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
