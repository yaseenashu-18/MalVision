import React from 'react';
import { Eye, Search, Lock } from 'lucide-react';
import { AboutSection } from '../components/AboutSection';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="w-full space-y-12">
      <AboutSection />

      <div className="w-full max-w-7xl mx-auto px-6 pb-16 space-y-16">
        {/* Hero Intro */}
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
            Inspect suspicious content<br />
            before it reaches your system.
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            MalVision is built around a single foundational mandate: <strong className="text-neutral-900 dark:text-white font-semibold">"See the risk before you open it."</strong> We help users inspect files, links, PDFs, and cryptographic hashes safely before interacting with them.
          </p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-pastel-purple flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Pre-Open Inspection</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              By analyzing binary structures, embedded streams, and URL destination chains in an isolated environment, MalVision identifies risks prior to local execution.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-pastel-green flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Multi-Engine Intelligence</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Hashes, links, and documents are cross-checked against threat intelligence databases to match known malware signatures and domain reputation scores.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-pastel-teal flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Focused & Transparent</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              No bloated dashboards, no false 100% guarantees, and no unnecessary threat counters. Just clean, reliable security assessments when you need them.
            </p>
          </div>
        </div>

        {/* CTA Box */}
        <div className="rounded-3xl bg-neutral-900 text-white dark:bg-neutral-800 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h3 className="text-2xl font-bold">Ready to inspect suspicious content?</h3>
            <p className="text-sm text-neutral-400 mt-1">Try scanning a file, URL, or hash using the threat scanner.</p>
          </div>
          <button
            onClick={() => onNavigate('scanner')}
            className="px-6 py-3 rounded-full bg-white text-neutral-900 dark:bg-white dark:text-neutral-900 font-semibold text-sm hover:opacity-90 transition cursor-pointer flex-shrink-0"
          >
            Open Threat Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
