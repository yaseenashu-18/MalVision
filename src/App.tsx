import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/themeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import type { ScannerTabId } from './types';

export const AppContent: React.FC = () => {
  const [activeScrollSection, setActiveScrollSection] = useState<string>('dashboard');
  const [scannerTab, setScannerTab] = useState<ScannerTabId>('file-scan');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'privacy' | 'history' | 'plans'>('appearance');

  // Authenticated user state
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Track active section dynamically as user scrolls through the page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      const scannerEl = document.getElementById('threat-scanner-section');
      const historyEl = document.getElementById('scan-history-section');

      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;

      if (isBottom) {
        setActiveScrollSection('about');
      } else if (historyEl && scrollPosition >= historyEl.offsetTop) {
        setActiveScrollSection('history');
      } else if (scannerEl && scrollPosition >= scannerEl.offsetTop) {
        setActiveScrollSection('scanner');
      } else {
        setActiveScrollSection('dashboard');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to sections instead of direct route jumps
  const handleNavigate = (page: string) => {
    if (page === 'dashboard' || page === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'scanner') {
      const el = document.getElementById('threat-scanner-section');
      if (el) {
        const yOffset = -80; // Offset for sticky glassmorphism header
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (page === 'history') {
      const el = document.getElementById('scan-history-section');
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (page === 'about') {
      const el = document.querySelector('footer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleScannerTabChange = (tab: ScannerTabId) => {
    setScannerTab(tab);
  };

  const handleOpenSettings = (tab: 'profile' | 'appearance' | 'privacy' | 'history' | 'plans' = 'appearance') => {
    setSettingsTab(tab);
    setSettingsModalOpen(true);
  };

  const handleAuthSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
  };

  const handleSignOut = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-warm-neutral text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <div>
        <Header 
          activeTab={activeScrollSection} 
          onNavigate={handleNavigate} 
          onGetStarted={() => setAuthModalOpen(true)}
          onOpenSettings={handleOpenSettings}
          user={user}
          onSignOut={handleSignOut}
        />
        
        <Dashboard
          activeScannerTab={scannerTab}
          onScanTabSelect={handleScannerTabChange}
          onNavigate={handleNavigate}
          onOpenAuth={() => setAuthModalOpen(true)}
          user={user}
        />
      </div>

      {/* Universal Footer Component present across all views */}
      <Footer onNavigate={handleNavigate} />

      {/* Login / Create Account Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signup"
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialTab={settingsTab}
        user={user}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
