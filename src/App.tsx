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
import { getActiveSession, createActiveSession, destroyActiveSession, performSignOut } from './lib/userStore';
import { AlertCircle, UserPlus, X } from 'lucide-react';
import type { ScannerTabId } from './types';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeScrollSection, setActiveScrollSection] = useState<string>('dashboard');
  const [scannerTab, setScannerTab] = useState<ScannerTabId>('file-scan');
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans'>('database');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Persistent authenticated user session state
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string; provider?: string } | null>(() => {
    const session = getActiveSession();
    if (session && session.wasResetInvalidated) {
      // Old v1 session invalidated during version 2 reset
      return null;
    }
    return session && session.email ? session : null;
  });

  // Check for old invalid session on initial mount
  useEffect(() => {
    const rawSession = localStorage.getItem('malvision_user_session');
    const notified = localStorage.getItem('malvision_reset_notified');

    if (rawSession && !notified) {
      try {
        const parsed = JSON.parse(rawSession);
        if (!parsed || parsed.authVersion !== 2) {
          destroyActiveSession();
          setUser(null);
          setShowResetModal(true);
          localStorage.setItem('malvision_reset_notified', 'true');
        }
      } catch (e) {
        destroyActiveSession();
        setUser(null);
      }
    }

    // Global logout event listener
    const handleGlobalLogout = () => {
      setUser(null);
      setCurrentPage('dashboard');
      setActiveScrollSection('dashboard');
      if (window.location.hash !== '#/home') {
        window.history.pushState(null, '', '#/home');
      }
    };

    window.addEventListener('malvision_logout', handleGlobalLogout);
    return () => window.removeEventListener('malvision_logout', handleGlobalLogout);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setCurrentPage(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.hash !== `#/${mode}`) {
      window.history.pushState(null, '', `#/${mode}`);
    }
  };

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
    performSignOut();
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

      {/* Account Reset Notification Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-amber-600 dark:text-amber-400 font-extrabold text-base">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Account reset</span>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Your previous MalVision account was removed during a recent database reset. Please create a new account to continue.
            </p>

            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  handleOpenAuth('signup');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create new account</span>
              </button>

              <button
                onClick={() => {
                  setShowResetModal(false);
                  handleOpenAuth('login');
                }}
                className="py-2.5 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
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
