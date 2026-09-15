import React from 'react';
import { Sparkles } from 'lucide-react';
import type { ScanResultData } from '../types';

interface MalVisionAiSectionProps {
  scanResult: ScanResultData;
  fileName?: string;
}

export const MalVisionAiSection: React.FC<MalVisionAiSectionProps> = ({ scanResult, fileName }) => {
  const name = fileName || scanResult.target || 'Uploaded Document';
  const isSafe = scanResult.status === 'Safe';

  const shortSummary = isSafe
    ? `We thoroughly reviewed "${name}". All text, images, and document structures are completely clean with no hidden scripts or threats detected. It is safe to open and share.`
    : `We detected security risks in "${name}". This document contains suspicious script triggers or structural flags. We recommend avoiding or quarantining this file.`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-2 text-left shadow-xs">
      <div className="flex items-center space-x-2">
        <div
          className={`p-1.5 rounded-lg ${
            isSafe
              ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
          MalVision AI Summary
        </h4>
      </div>
      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal pl-0.5">
        {shortSummary}
      </p>
    </div>
  );
};
