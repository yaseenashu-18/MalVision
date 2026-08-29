import React from 'react';
import { UploadCloud, Cpu, FileText, ShieldCheck } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload',
      icon: UploadCloud,
      description: 'Drop or select any suspicious file, document, PDF, image, URL link, or SHA-256 hash.'
    },
    {
      step: '02',
      title: 'Analyse',
      icon: Cpu,
      description: 'Multi-engine security sandbox inspects binary structures, PDF streams, and threat database signatures.'
    },
    {
      step: '03',
      title: 'Understand',
      icon: FileText,
      description: 'Receive immediate risk probability scores, detailed heuristic findings, and recommended actions.'
    },
    {
      step: '04',
      title: 'Stay Protected',
      icon: ShieldCheck,
      description: 'Isolate malicious payloads and unsafe URLs before opening them on your computer or device.'
    }
  ];

  return (
    <section id="how-it-works-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-b border-neutral-200/60 dark:border-neutral-800/60 my-6">
      {/* Section Header */}
      <div className="text-center space-y-2 mb-10 sm:mb-12">
        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          How It Works
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Files can look harmless. That doesn't mean they are.
        </h2>
        <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Understand how MalVision isolates and analyzes threats step-by-step.
        </p>
      </div>

      {/* 4 Cards Grid - Serial Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#18181B] space-y-4 relative overflow-hidden shadow-xs hover:border-neutral-400 dark:hover:border-neutral-700 transition duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-neutral-900 dark:text-white stroke-[1.5]" />
                </div>
                <span className="text-xs font-mono font-extrabold text-neutral-400 dark:text-neutral-500">
                  {item.step}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
