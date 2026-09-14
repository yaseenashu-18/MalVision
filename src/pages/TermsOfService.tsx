import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onNavigate: (page: string) => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onNavigate }) => {
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
          Terms of Service &bull; Platform
        </span>
      </div>

      {/* Main Title */}
      <div className="space-y-3 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-6 sm:pb-8">
        <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm sm:text-lg font-serif italic text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Please review the operating terms and security guidelines governing the use of MalVision threat intelligence.
        </p>
      </div>

      {/* Fluid Cursive & Elegant Text Body */}
      <div className="space-y-8 sm:space-y-10 font-serif italic text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
        
        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Acceptable Use & Security Boundaries
          </h2>
          <p>
            MalVision is designed to provide real-time malware analysis, PDF stream parsing, domain reputation scoring, and hash matching for security research and threat prevention. Users agree to utilize MalVision strictly for authorized security inspections and threat evaluation.
          </p>
          <p>
            You agree not to attempt to disrupt MalVision database cluster nodes, reverse-engineer proprietary signature matching rules for malicious evasion, or flood network interfaces with automated abuse traffic.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Threat Analysis & Detection Disclaimer
          </h2>
          <p>
            MalVision employs advanced multi-engine signature matching and heuristic sandboxing to calculate threat probability scores. While our system provides high-confidence risk metrics, cybersecurity threat landscapes continuously evolve. Reports provided by MalVision should be used as security guidance alongside standard defensive practices.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Limitation of Liability
          </h2>
          <p>
            MalVision is provided to enhance digital safety and threat visibility. MalVision shall not be held liable for indirect damages or security breaches arising from unisolated execution of malicious payloads outside our browser sandbox environment.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-sans not-italic text-base sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Service Continuity & Revisions
          </h2>
          <p>
            We continuously refine threat detection algorithms and database indexes to defend against emerging malware vectors. Terms may be updated periodically to reflect security advancements.
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
