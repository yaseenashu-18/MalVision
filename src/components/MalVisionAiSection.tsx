import React from 'react';
import { Sparkles } from 'lucide-react';
import type { ScanResultData } from '../types';

interface MalVisionAiSectionProps {
  scanResult: ScanResultData;
  fileName?: string;
}

export const MalVisionAiSection: React.FC<MalVisionAiSectionProps> = ({ scanResult, fileName }) => {
  const name = fileName || scanResult.target || 'Uploaded File';
  const isSafe = scanResult.status === 'Safe';

  const shortSummary = isSafe
    ? `MalVision AI analyzed all security vectors for "${name}". Binary structure, magic bytes, and stream objects show zero malicious indicators. The file is verified clean.`
    : `MalVision AI detected high-risk threat indicators in "${name}". Automated script triggers or suspicious payload streams require immediate quarantine.`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-[#141417] space-y-2 text-left shadow-xs">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
          MalVision AI Summary
        </h4>
      </div>
      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium pl-0.5">
        {shortSummary}
      </p>
    </div>
  );
};
