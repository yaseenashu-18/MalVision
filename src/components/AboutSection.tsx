import React from 'react';
import { Shield, Zap, Target, Lock } from 'lucide-react';
import { FlowingMesh } from './FlowingMesh';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="w-full relative overflow-hidden py-20">
      {/* Full-Bleed Edge-to-Edge Flowing Lines Mesh Background */}
      <div className="hidden md:block">
        <FlowingMesh />
      </div>

      {/* Content Container constrained to max-w-7xl */}
      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Spacer allowing wave ribbon to flow freely */}
          <div className="hidden lg:block lg:col-span-5" />

          {/* Right Column: Headline, Paragraph, and 4 Feature Items */}
          <div className="lg:col-span-7 space-y-10">
            {/* Main Title & Subtitle */}
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
                Built for privacy.<br />
                Scan smartest, stay protected.
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                MalVision is a fast, privacy-first threat scanner that helps you detect malicious files, links, documents, PDFs, images, and hashes in seconds. Zero data selling. Total security you can trust.
              </p>
            </div>

            {/* 4 Feature Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
              {/* 1. Privacy First */}
              <div className="space-y-2.5">
                <Shield className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Privacy First</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Your data stays protected on your device.
                </p>
              </div>

              {/* 2. Lightning Fast */}
              <div className="space-y-2.5">
                <Zap className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Lightning Fast</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Scan in seconds, get instant risk feedback.
                </p>
              </div>

              {/* 3. Powerful Detection */}
              <div className="space-y-2.5">
                <Target className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Powerful Detection</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  Advanced engines detect emerging threats.
                </p>
              </div>

              {/* 4. You're in Control */}
              <div className="space-y-2.5">
                <Lock className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">You're in Control</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  No tracking. Encrypted database cloud sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
