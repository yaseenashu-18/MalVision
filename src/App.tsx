import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/themeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CookiePolicy } from './pages/CookiePolicy';
import { AuthPage } from './components/AuthPage';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { getActiveSession, createActiveSession, destroyActiveSession } from './lib/userStore';
import type { ScannerTabId } from './types';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeScrollSection, setActiveScrollSection] = useState<string>('dashboard');
  const [scannerTab, setScannerTab] = useState<ScannerTabId>('file-scan');
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans'>('database');

  // Persistent authenticated user session state (restored automatically from localStorage on page reload)
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; provider?: string } | null>(() => {
    return getActiveSession();
  });

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setCurrentPage(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.hash !== `#/${mode}`) {
      window.history.pushState(null, '', `#/${mode}`);
    }
  };

  // Smooth navigation handler supporting standalone pages (/privacy, /terms, /cookies, /login, /signup) & scroll targets
  const handleNavigate = (page: string) => {
    const cleanPage = page.replace(/^#\/?/, '').toLowerCase();

    if (cleanPage === 'login' || cleanPage === 'signup') {
      handleOpenAuth(cleanPage as 'login' | 'signup');
      return;
    }

    if (cleanPage === 'history') {
      setHistoryModalOpen(true);
      return;
    }

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
    } else if (cleanPage === 'features') {
      setTimeout(() => {
        const el = document.getElementById('features-section');
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
      setActiveScrollSection('features');
      if (window.location.hash !== '#/features') {
        window.history.pushState(null, '', '#/features');
      }
    } else if (cleanPage === 'about') {
      setTimeout(() => {
        const el = document.getElementById('about-section');
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
      setActiveScrollSection('about');
      if (window.location.hash !== '#/about') {
        window.history.pushState(null, '', '#/about');
      }
    }
  };

  // Sync hash routing on initial load and popstate
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'login' || hash === 'signup' || hash === 'privacy' || hash === 'terms' || hash === 'cookies') {
        setCurrentPage(hash);
      } else if (hash === 'scanner' || hash === 'features' || hash === 'about') {
        setCurrentPage('dashboard');
        setActiveScrollSection(hash);
        setTimeout(() => {
          const el = document.getElementById(`${hash}-section`);
          if (el) {
            const yOffset = -80;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 100);
      } else {
        setCurrentPage('dashboard');
        setActiveScrollSection('dashboard');
      }
    };

    handleHashChange();
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, []);

  const handleScannerTabChange = (tab: ScannerTabId) => {
    setScannerTab(tab);
    setCurrentPage('dashboard');
    setActiveScrollSection('scanner');
  };

  const handleOpenSettings = (tab: 'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans' = 'database') => {
    setSettingsTab(tab);
    setSettingsModalOpen(true);
  };

  const handleAuthSuccess = (userData: { name: string; email: string; avatar?: string; provider?: string }) => {
    setUser(userData);
    createActiveSession(userData);
  };

  const handleSignOut = () => {
    setUser(null);
    destroyActiveSession();
    setCurrentPage('dashboard');
    setActiveScrollSection('dashboard');
    if (window.location.hash !== '#/home') {
      window.history.pushState(null, '', '#/home');
    }
  };

  // If on login or signup view, render dedicated AuthPage without main Header/Footer
  if (currentPage === 'login' || currentPage === 'signup') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0c]">
        <AuthPage
          initialMode={currentPage as 'login' | 'signup'}
          onNavigate={handleNavigate}
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
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-warm-neutral text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <div>
        <Header 
          activeTab={currentPage === 'dashboard' ? activeScrollSection : currentPage} 
          onNavigate={handleNavigate} 
          onOpenHistory={() => setHistoryModalOpen(true)}
          onGetStarted={() => handleOpenAuth('signup')}
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
            onOpenAuth={() => handleOpenAuth('login')}
            user={user}
          />
        )}
      </div>

      {/* Universal Footer Component present across main views */}
      <Footer onNavigate={handleNavigate} />

      {/* Dedicated History Modal */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        user={user}
        onOpenAuth={() => handleOpenAuth('login')}
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
