import React, { useEffect } from 'react';
import { Lock, ArrowLeft, ShieldCheck, CheckCircle2, Sliders, Database } from 'lucide-react';

interface CookiePolicyProps {
  onNavigate: (page: string) => void;
}

export const CookiePolicy: React.FC<CookiePolicyProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to MalVision</span>
        </button>

        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
          Effective Date: August 30, 2026
        </span>
      </div>

      {/* Hero Title Header */}
      <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <Lock className="w-4 h-4 text-blue-500" />
          <span>Zero Tracker Promise</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
          Cookie & Security Storage Policy
        </h1>
        
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Learn how MalVision utilizes essential session storage and local browser caching without using third-party tracking scripts or cross-site advertising cookies.
        </p>
      </div>

      {/* Main Legal Sections Container */}
      <div className="space-y-12 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        
        {/* Section 1: What Are Essential Cookies */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2>1. Essential Session & Storage Use</h2>
          </div>
          <p>
            MalVision relies exclusively on essential HTML5 LocalStorage and encrypted session tokens strictly required for core application operations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-neutral-900 dark:text-white text-xs block">Theme Preference (`malvision_theme`)</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Stores your selected color mode (Light, Dark, or System Sync).</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-neutral-900 dark:text-white text-xs block">Local Scan Cache (`malvision_scan_history`)</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Caches recent inspection reports for instant retrieval without reloading.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Zero Third-Party Trackers */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            <h2>2. Zero Third-Party Tracker Guarantee</h2>
          </div>
          <p>
            We do not embed third-party advertising cookies, cross-site trackers, data brokers, or behavioral analytics beacons. Your interaction with MalVision remains private to your session.
          </p>
        </section>

        {/* Section 3: Managing Preferences */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h2>3. Managing & Clearing Storage</h2>
          </div>
          <p>
            You can clear your local application storage at any time by selecting "Clear History" inside the Scan History section, or by clearing Local Storage through your browser's Developer Tools settings.
          </p>
        </section>
      </div>

      {/* Bottom Back Button */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
        >
          Return to MalVision Dashboard
        </button>
      </div>
    </div>
  );
};
