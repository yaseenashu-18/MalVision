import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/themeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyAndTermsModal } from './components/PrivacyAndTermsModal';
import type { ScannerTabId } from './types';

export const AppContent: React.FC = () => {
  const [activeScrollSection, setActiveScrollSection] = useState<string>('dashboard');
  const [scannerTab, setScannerTab] = useState<ScannerTabId>('file-scan');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans'>('database');
  
  // Legal Privacy & Terms modal state
  const [legalModalOpen, setLegalModalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // Authenticated user state
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; provider?: string } | null>(null);

  // Smooth navigation handler supporting dashboard, home, history, scanner, privacy, terms
  const handleNavigate = (page: string) => {
    const cleanPage = page.replace(/^#\/?/, '').toLowerCase();

    if (cleanPage === 'dashboard' || cleanPage === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveScrollSection('dashboard');
      if (window.location.hash !== '#/home') {
        window.history.pushState(null, '', '#/home');
      }
    } else if (cleanPage === 'scanner') {
      const el = document.getElementById('threat-scanner-section');
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setActiveScrollSection('scanner');
      if (window.location.hash !== '#/scanner') {
        window.history.pushState(null, '', '#/scanner');
      }
    } else if (cleanPage === 'history') {
      const el = document.getElementById('scan-history-section');
      if (el) {
        const yOffset = -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setActiveScrollSection('history');
      if (window.location.hash !== '#/history') {
        window.history.pushState(null, '', '#/history');
      }
    } else if (cleanPage === 'about') {
      const el = document.querySelector('footer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      setActiveScrollSection('about');
    } else if (cleanPage === 'privacy') {
      setLegalTab('privacy');
      setLegalModalOpen(true);
      if (window.location.hash !== '#/privacy') {
        window.history.pushState(null, '', '#/privacy');
      }
    } else if (cleanPage === 'terms') {
      setLegalTab('terms');
      setLegalModalOpen(true);
      if (window.location.hash !== '#/terms') {
        window.history.pushState(null, '', '#/terms');
      }
    } else if (cleanPage === 'cookies') {
      setLegalTab('cookies');
      setLegalModalOpen(true);
      if (window.location.hash !== '#/cookies') {
        window.history.pushState(null, '', '#/cookies');
      }
    }
  };

  // URL Hash router listener on load and hash change
  useEffect(() => {
    const handleHashRouting = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash) {
        handleNavigate(hash);
      }
    };

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    return () => window.removeEventListener('hashchange', handleHashRouting);
  }, []);

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

  const handleScannerTabChange = (tab: ScannerTabId) => {
    setScannerTab(tab);
  };

  const handleOpenSettings = (tab: 'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans' = 'database') => {
    setSettingsTab(tab);
    setSettingsModalOpen(true);
  };

  const handleAuthSuccess = (userData: { name: string; email: string; avatar?: string; provider?: string }) => {
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

      {/* Privacy Policy & Terms of Service Modal */}
      <PrivacyAndTermsModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
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
