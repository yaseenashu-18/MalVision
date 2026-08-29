import React, { useState } from 'react';
import { Hero } from '../components/Hero';
import { HowItWorksSection } from '../components/HowItWorksSection';
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
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleToggleHowItWorks = () => {
    setShowHowItWorks((prev) => !prev);
  };

  return (
    <main className="w-full space-y-12">
      {/* Hero Section */}
      <Hero
        onScanSelect={(tab) => {
          onScanTabSelect(tab);
          const el = document.getElementById('threat-scanner-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSeeHowItWorks={handleToggleHowItWorks}
      />

      {/* How It Works Section (Smoothly expands inline without sudden page jumps) */}
      <HowItWorksSection isVisible={showHowItWorks} />

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
