import React from 'react';
import { X, UploadCloud, Cpu, FileText, ShieldCheck, ArrowRight } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan?: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose, onStartScan }) => {
  if (!isOpen) return null;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative transform animate-in zoom-in-95 duration-200 p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Security Workflow
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
              Files can look harmless.<br />That doesn't mean they are.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 pt-1">
              Understand how MalVision isolates and analyzes threats step-by-step.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step}
                className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5 text-neutral-900 dark:text-white stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-400 dark:text-neutral-500">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
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

        {/* Footer CTA */}
        <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Powered by local browser sandboxing & MongoDB threat database.
          </span>

          <button
            onClick={() => {
              onClose();
              onStartScan?.();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-md active:scale-95"
          >
            <span>Start Scanning Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
