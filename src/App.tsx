import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/themeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CookiePolicy } from './pages/CookiePolicy';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import type { ScannerTabId } from './types';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeScrollSection, setActiveScrollSection] = useState<string>('dashboard');
  const [scannerTab, setScannerTab] = useState<ScannerTabId>('file-scan');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans'>('database');

  // Authenticated user state
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; provider?: string } | null>(null);

  // Smooth navigation handler supporting standalone pages (/privacy, /terms, /cookies) & scroll targets
  const handleNavigate = (page: string) => {
    const cleanPage = page.replace(/^#\/?/, '').toLowerCase();

    if (cleanPage === 'privacy' || cleanPage === 'terms' || cleanPage === 'cookies') {
      setCurrentPage(cleanPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash !== `#/${cleanPage}`) {
        window.history.pushState(null, '', `#/${cleanPage}`);
      }
      return;
    }

    // Return to main Dashboard page for sections
    setCurrentPage('dashboard');

    if (cleanPage === 'dashboard' || cleanPage === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveScrollSection('dashboard');
      if (window.location.hash !== '#/home') {
        window.history.pushState(null, '', '#/home');
      }
    } else if (cleanPage === 'scanner') {
      setTimeout(() => {
        const el = document.getElementById('threat-scanner-section');
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
      setActiveScrollSection('scanner');
      if (window.location.hash !== '#/scanner') {
        window.history.pushState(null, '', '#/scanner');
      }
    } else if (cleanPage === 'history') {
      setTimeout(() => {
        const el = document.getElementById('scan-history-section');
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
      setActiveScrollSection('history');
      if (window.location.hash !== '#/history') {
        window.history.pushState(null, '', '#/history');
      }
    } else if (cleanPage === 'about') {
      setTimeout(() => {
        const el = document.querySelector('footer');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      setActiveScrollSection('about');
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

  // Track active section dynamically when on main dashboard
  useEffect(() => {
    if (currentPage !== 'dashboard') return;

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
  }, [currentPage]);

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
          activeTab={currentPage === 'dashboard' ? activeScrollSection : currentPage} 
          onNavigate={handleNavigate} 
          onGetStarted={() => setAuthModalOpen(true)}
          onOpenSettings={handleOpenSettings}
          user={user}
          onSignOut={handleSignOut}
        />
        
        {/* Render Active View / Page */}
        {currentPage === 'privacy' ? (
          <PrivacyPolicy onNavigate={handleNavigate} />
        ) : currentPage === 'terms' ? (
          <TermsOfService onNavigate={handleNavigate} />
        ) : currentPage === 'cookies' ? (
          <CookiePolicy onNavigate={handleNavigate} />
        ) : (
          <Dashboard
            activeScannerTab={scannerTab}
            onScanTabSelect={handleScannerTabChange}
            onNavigate={handleNavigate}
            onOpenAuth={() => setAuthModalOpen(true)}
            user={user}
          />
        )}
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
