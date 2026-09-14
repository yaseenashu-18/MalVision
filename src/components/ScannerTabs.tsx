import React from 'react';
import { FileText, Eye, FileSpreadsheet, Link as LinkIcon, Hash } from 'lucide-react';
import type { ScannerTabId } from '../types';

interface ScannerTabsProps {
  activeTab: ScannerTabId;
  onTabChange: (tab: ScannerTabId) => void;
}

export const ScannerTabs: React.FC<ScannerTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ScannerTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'file-scan', label: 'File Scan', icon: FileText },
    { id: 'preview-file', label: 'Preview File', icon: Eye },
    { id: 'pdf-inspector', label: 'PDF Inspector', icon: FileSpreadsheet },
    { id: 'url-scan', label: 'URL Scan', icon: LinkIcon },
    { id: 'hash-analysis', label: 'Hash Analysis', icon: Hash }
  ];

  return (
    <div className="w-full bg-neutral-100/70 dark:bg-neutral-800/50 p-1 rounded-2xl border-none flex sm:grid sm:grid-cols-5 gap-1 overflow-x-auto touch-pan-x no-scrollbar scrollbar-none outline-none focus:outline-none select-none">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-3 sm:px-3 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 sm:shrink outline-none focus:outline-none focus:ring-0 active:outline-none ${
              isActive
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold shadow-xs border-none'
                : 'text-neutral-600 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 border-none'
            }`}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
