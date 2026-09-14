import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface CookiePolicyProps {
  onNavigate: (page: string) => void;
}

export const CookiePolicy: React.FC<CookiePolicyProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-200">
      {/* Top Navigation Bar - Short & perfectly aligned on mobile */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to MalVision</span>
        </button>

        <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
          Cookie Policy &bull; Storage
        </span>
      </div>

      {/* Main Title */}
      <div className="space-y-3 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-6 sm:pb-8">
        <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-white">
          Cookie Policy
        </h1>
        <p className="text-sm sm:text-lg font-serif italic text-neutral-600 dark:text-neutral-400 leading-relaxed">
          MalVision maintains a strict zero-tracking standard with essential local session storage only.
        </p>
      </div>

      {/* Fluid Cursive & Elegant Text Body */}
      <div className="space-y-8 sm:space-y-10 font-serif italic text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
        
        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Essential Session Storage
          </h2>
          <p>
            MalVision relies exclusively on essential HTML5 LocalStorage keys required to maintain your security workflow during your session. These include <span className="font-mono not-italic text-xs text-neutral-900 dark:text-white">malvision_theme</span> for preserving your visual appearance preference (Light, Dark, or System mode) and <span className="font-mono not-italic text-xs text-neutral-900 dark:text-white">malvision_scan_history</span> for instant report retrieval without re-querying network endpoints.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Zero Third-Party Trackers
          </h2>
          <p>
            We do not employ cross-site tracking cookies, behavioral ad scripts, or third-party analytics beacons. Your inspection activity on MalVision remains entirely private to your device.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Managing Storage & Purging Cache
          </h2>
          <p>
            You can clear all stored session cache and report history at any time using the Clear History function inside MalVision or directly through your web browser's storage settings.
          </p>
        </div>

      </div>

      {/* Footer Return Link */}
      <div className="pt-6 sm:pt-10 border-t border-neutral-200/60 dark:border-neutral-800/60 flex justify-center">
        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-sans not-italic font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
        >
          Back to MalVision
        </button>
      </div>
    </div>
  );
};
