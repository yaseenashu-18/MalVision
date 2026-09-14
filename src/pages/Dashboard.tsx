import React from 'react';
import { Hero } from '../components/Hero';
import { ThreatScanner } from '../components/ThreatScanner';
import { FeaturesSection } from '../components/FeaturesSection';
import { AboutSection } from '../components/AboutSection';
import type { ScannerTabId } from '../types';

interface DashboardProps {
  activeScannerTab?: ScannerTabId;
  onScanTabSelect: (tab: ScannerTabId) => void;
  onNavigate: (page: string) => void;
  onOpenAuth?: () => void;
  onSeeHowItWorks?: () => void;
  user?: { name: string; email: string } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeScannerTab = 'file-scan', onScanTabSelect, user }) => {
  return (
    <main className="w-full space-y-8 sm:space-y-12">
      {/* Hero Section with HowItWorksSection visible on Dashboard page */}
      <Hero
        onScanSelect={(tab) => {
          onScanTabSelect(tab);
          const el = document.getElementById('threat-scanner-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        isHowItWorksVisible={true}
      />

      {/* Threat Scanner Container */}
      <ThreatScanner
        activeTab={activeScannerTab}
        onTabChange={onScanTabSelect}
        user={user}
      />

      {/* Features & Capability Cards Section */}
      <FeaturesSection onScanSelect={onScanTabSelect} />

      {/* About Section */}
      <AboutSection />
    </main>
  );
};
