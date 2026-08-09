import React from 'react';
import { Eye, Search, Lock, ArrowRight } from 'lucide-react';
import { AboutSection } from '../components/AboutSection';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  return (
    <div className="w-full space-y-12">
      {/* Primary About Banner with Flowing Ribbon Mesh */}
      <AboutSection />

      {/* Clean Minimal Deep Dive Section */}
      <div className="w-full max-w-7xl mx-auto px-6 pb-20 space-y-16">
        {/* Architectural Pillars Grid - Clean Minimal Single-Line Icon Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <div className="space-y-3">
            <Eye className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Pre-Open Inspection</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              By analyzing binary structures, embedded streams, and URL destination chains in an isolated environment, MalVision identifies risks prior to local execution.
            </p>
          </div>

          <div className="space-y-3">
            <Search className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Multi-Engine Intelligence</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Hashes, links, and documents are cross-checked against threat intelligence databases to match known malware signatures and domain reputation scores.
            </p>
          </div>

          <div className="space-y-3">
            <Lock className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Focused & Transparent</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              No bloated dashboards, no false 100% guarantees, and no unnecessary threat counters. Just clean, reliable security assessments when you need them.
            </p>
          </div>
        </div>

        {/* Minimal Clean CTA Bar */}
        <div className="pt-8 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Ready to inspect suspicious content?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Try scanning a file, URL, or hash using the threat scanner.</p>
          </div>
          <button
            onClick={() => onNavigate('scanner')}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <span>Open Threat Scanner</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
