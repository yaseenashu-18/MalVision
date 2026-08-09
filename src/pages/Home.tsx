import React from 'react';
import { Hero } from '../components/Hero';
import { ThreatScanner } from '../components/ThreatScanner';
import { AccountCTA } from '../components/AccountCTA';
import type { ScannerTabId } from '../types';

interface HomeProps {
  activeScannerTab: ScannerTabId;
  onScannerTabChange: (tab: ScannerTabId) => void;
  onNavigate: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ activeScannerTab, onScannerTabChange, onNavigate }) => {
  const handleSeeHowItWorks = () => {
    const el = document.getElementById('threat-scanner-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroSelect = (tab: ScannerTabId) => {
    onScannerTabChange(tab);
    handleSeeHowItWorks();
  };

  return (
    <main className="w-full">
      <Hero
        onScanSelect={handleHeroSelect}
        onSeeHowItWorks={handleSeeHowItWorks}
      />
      <ThreatScanner
        activeTab={activeScannerTab}
        onTabChange={onScannerTabChange}
      />
      <AccountCTA
        onAccountClick={() => onNavigate('dashboard')}
      />
    </main>
  );
};
