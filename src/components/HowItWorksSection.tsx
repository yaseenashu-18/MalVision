import React from 'react';
import { UploadCloud, Cpu, FileText, ShieldCheck } from 'lucide-react';

interface HowItWorksSectionProps {
  isVisible: boolean;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ isVisible }) => {
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
    <div 
      className={`w-full grid transition-all duration-500 ease-in-out overflow-hidden ${
        isVisible ? 'grid-rows-[1fr] opacity-100 mt-4 mb-2' : 'grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none'
      }`}
    >
      <div className="overflow-hidden min-h-0">
        <div 
          id="how-it-works-section" 
          className="w-full pt-4 pb-6 border-t border-b border-neutral-200/60 dark:border-neutral-800/60"
        >
          {/* Section Header */}
          <div className="text-left space-y-1 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Files can look harmless. That doesn't mean they are.
            </h2>
          </div>

          {/* 4 Cards Grid - Exact same card style as Features & Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-5 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#18181B] hover:border-neutral-400 dark:hover:border-neutral-700 transition duration-200 cursor-pointer shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                        {item.step}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
