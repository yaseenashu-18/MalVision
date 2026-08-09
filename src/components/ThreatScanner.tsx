import React from 'react';
import { ScannerTabs } from './ScannerTabs';
import { ScannerViewport } from './ScannerViewport';
import type { ScannerTabId } from '../types';

interface ThreatScannerProps {
  activeTab: ScannerTabId;
  onTabChange: (tab: ScannerTabId) => void;
}

export const ThreatScanner: React.FC<ThreatScannerProps> = ({ activeTab, onTabChange }) => {
  return (
    <section id="threat-scanner-section" className="w-full max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
      {/* Title & Subtitle matching Image 2 */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Threat Scanner
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          Choose a method and scan for threats instantly.
        </p>
      </div>

      {/* FIXED SCANNER SHELL CONTAINER */}
      <div className="w-full max-w-4xl h-[520px] rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm flex flex-col justify-between overflow-hidden relative">
        <ScannerTabs activeTab={activeTab} onTabChange={onTabChange} />
        <ScannerViewport activeTab={activeTab} />
      </div>
    </section>
  );
};
