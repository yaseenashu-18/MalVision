import React from 'react';
import { ShieldCheck, Cpu, Database, Lock, Eye, Zap } from 'lucide-react';
import mascotImg from '../assets/robot_mascot.png';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Details */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6 z-10">
          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
              Scan smartest,<br />stay protected.
            </h2>
            <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed pt-1">
              Detect threats in files, links, documents, and hashes using advanced security engines. Isolated, fast, and multi-layered protection.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            <div className="p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs">
                <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Multi-Engine Scanner</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Analyze files, PDFs, URLs, images, and SHA-256 hashes for embedded exploit payloads.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[1.5]" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Isolated Sandbox Preview</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Inspect document text and structure safely in a read-only execution sandbox.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs">
                <Database className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">MongoDB Cloud Sync</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Scans sync to your threat-detection database cluster for cross-device access.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Privacy Guarantee</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Your private document contents are parsed locally and never sold to third parties.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2">
            <div className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <Lock className="w-3.5 h-3.5 text-neutral-500 stroke-[1.5] shrink-0" />
              <span>TLS 1.3 Enterprise Encryption Active</span>
            </div>
          </div>
        </div>

        {/* Right Mascot Illustration */}
        <div className="hidden md:flex lg:col-span-6 justify-center lg:justify-end items-center relative select-none pt-4 lg:pt-0">
          <div className="relative w-64 sm:w-80 md:w-[460px] h-64 sm:h-80 md:h-[460px] flex items-center justify-center select-none">
            <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800/40 rounded-full blur-3xl opacity-80" />
            <img
              src={mascotImg}
              alt="MalVision Robot Security Mascot"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-contain relative z-10 filter drop-shadow-2xl pointer-events-none select-none"
              style={{ userSelect: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
