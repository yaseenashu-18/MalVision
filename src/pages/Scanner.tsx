import React from 'react';
import { ThreatScanner } from '../components/ThreatScanner';
import type { ScannerTabId } from '../types';

interface ScannerProps {
  activeTab: ScannerTabId;
  onTabChange: (tab: ScannerTabId) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full min-h-[70vh] flex flex-col justify-center py-8">
      <ThreatScanner activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
