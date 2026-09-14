import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/themeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { CookiePolicy } from './pages/CookiePolicy';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { AuthPage } from './components/AuthPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ToastContainer } from './components/ToastNotification';
import { apiCheckSession } from './lib/authApi';
import { getActiveSession, createActiveSession, destroyActiveSession, performSignOut } from './lib/userStore';
import { fetchServerScanHistory, clearActiveUserScansCache } from './lib/historyStore';
import { fetchServerVisionHistory, clearActiveVisionCache } from './lib/visionStore';
import { subscribeToSyncEvents } from './lib/syncChannel';
import { AlertCircle, UserPlus, X } from 'lucide-react';
import type { ScannerTabId } from './types';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeScrollSection, setActiveScrollSection] = useState<string>('dashboard');
  const [scannerTab, setScannerTab] = useState<ScannerTabId>('file-scan');
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Persistent authenticated user session state
  const [user, setUser] = useState<{ id?: string; name: string; email: string; username?: string; avatar?: string; provider?: string; role?: string } | null>(() => {
    const session = getActiveSession();
    return session && session.email ? (session as any) : null;
  });

  // Server Session Check on Mount (Validates HttpOnly cookie server-side)
  useEffect(() => {
    async function checkServerSession() {
      const res = await apiCheckSession();
      if (res.authenticated && res.user) {
        const userData = {
          id: res.user.id,
          name: res.user.fullName,
          email: res.user.normalizedEmail,
          username: res.user.username,
          avatar: res.user.avatar,
          provider: res.user.provider,
          role: res.user.role,
        };
        setUser(userData);
        createActiveSession(userData);
        fetchServerScanHistory();
        fetchServerVisionHistory();
      } else {
        const local = getActiveSession();
        if (local && local.email) {
          setUser({
            id: local.id,
            name: local.name,
            email: local.email,
            username: local.username,
            avatar: local.avatar,
            provider: local.provider,
            role: (local as any).role,
          });
        } else {
          setUser(null);
          destroyActiveSession();
          clearActiveUserScansCache();
          clearActiveVisionCache();
        }
      }
    }

    checkServerSession();
  }, []);

  // Multi-Tab & Real-Time Synchronization Listener
  useEffect(() => {
    const unsubscribe = subscribeToSyncEvents((payload) => {
      if (payload.type === 'malvision:auth-changed') {
        apiCheckSession().then((res) => {
          if (res.authenticated && res.user) {
            const userData = {
              id: res.user.id,
              name: res.user.fullName,
              email: res.user.normalizedEmail,
              username: res.user.username,
              avatar: res.user.avatar,
              provider: res.user.provider,
              role: res.user.role,
            };
            setUser(userData);
            createActiveSession(userData);
            fetchServerScanHistory();
            fetchServerVisionHistory();
          } else {
            const local = getActiveSession();
            if (local && local.email) {
              setUser({
                id: local.id,
                name: local.name,
                email: local.email,
                username: local.username,
                avatar: local.avatar,
                provider: local.provider,
              });
            } else {
              setUser(null);
              destroyActiveSession();
              clearActiveUserScansCache();
              clearActiveVisionCache();
            }
          }
        });
      } else if (
        payload.type === 'malvision:scan-created' ||
        payload.type === 'malvision:scan-updated' ||
        payload.type === 'malvision:scan-deleted' ||
        payload.type === 'malvision:history-invalidated'
      ) {
        fetchServerScanHistory();
        fetchServerVisionHistory();
      }
    });

    return () => unsubscribe();
  }, []);

  // Global logout event listener
  useEffect(() => {
    const handleGlobalLogout = () => {
      setUser(null);
      clearActiveUserScansCache();
      clearActiveVisionCache();
      setCurrentPage('dashboard');
      setActiveScrollSection('dashboard');
      if (window.location.hash !== '#/home') {
        window.history.pushState(null, '', '#/home');
      }
    };

    window.addEventListener('malvision_logout', handleGlobalLogout);
    return () => window.removeEventListener('malvision_logout', handleGlobalLogout);
  }, []);

  // Instant Session Revocation Poller & Focus Listener ("sign out on spot")
  useEffect(() => {
    if (!user) return;

    const verifySessionOnSpot = async () => {
      const res = await apiCheckSession();
      if (!res.authenticated) {
        setUser(null);
        destroyActiveSession();
        clearActiveUserScansCache();
        clearActiveVisionCache();
        setCurrentPage('dashboard');
        setActiveScrollSection('dashboard');
        if (window.location.hash !== '#/home') {
          window.history.pushState(null, '', '#/home');
        }
      }
    };

    const intervalId = setInterval(verifySessionOnSpot, 4000);
    window.addEventListener('focus', verifySessionOnSpot);
    document.addEventListener('visibilitychange', verifySessionOnSpot);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', verifySessionOnSpot);
      document.removeEventListener('visibilitychange', verifySessionOnSpot);
    };
  }, [user]);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setCurrentPage(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.hash !== `#/${mode}`) {
      window.history.pushState(null, '', `#/${mode}`);
    }
  };

  const handleNavigate = (page: string) => {
    const cleanPage = page.replace(/^#\/?/, '').toLowerCase();

    if (cleanPage === 'login' || cleanPage === 'signup' || cleanPage === 'forgot-password' || cleanPage === 'reset-password' || cleanPage === 'reset') {
      const mode = cleanPage === 'reset' ? 'reset-password' : cleanPage;
      setCurrentPage(mode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash !== `#/${cleanPage}`) {
        window.history.pushState(null, '', `#/${cleanPage}`);
      }
      return;
    }


    if (cleanPage === 'profile' || cleanPage === 'settings' || cleanPage === 'history' || cleanPage === 'account') {
      setCurrentPage(cleanPage === 'account' ? 'profile' : cleanPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash !== `#/${cleanPage}`) {
        window.history.pushState(null, '', `#/${cleanPage}`);
      }
      return;
    }

    if (cleanPage === 'superadmin' || cleanPage === 'admin') {
      setCurrentPage('superadmin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.location.hash !== '#/superadmin') {
        window.history.pushState(null, '', '#/superadmin');
      }
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
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      const hashPath = rawHash.split('?')[0].toLowerCase();
      if (['login', 'signup', 'forgot-password', 'reset-password', 'reset', 'privacy', 'terms', 'cookies', 'profile', 'settings', 'history', 'account', 'superadmin', 'admin'].includes(hashPath)) {
        setCurrentPage(hashPath === 'account' ? 'profile' : (hashPath === 'admin' ? 'superadmin' : (hashPath === 'reset' ? 'reset-password' : hashPath)));
      } else if (hashPath === 'scanner' || hashPath === 'features' || hashPath === 'about') {
        setCurrentPage('dashboard');
        setActiveScrollSection(hashPath);
        setTimeout(() => {
          const el = document.getElementById(`${hashPath}-section`);
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
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleScannerTabChange = (tab: ScannerTabId) => {
    setScannerTab(tab);
    setCurrentPage('dashboard');
    setActiveScrollSection('scanner');
  };

  const handleOpenSettings = (tab: 'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans' = 'database') => {
    handleNavigate(tab === 'database' ? 'settings' : tab);
  };

  // Auto-redirect logged-in users away from login/signup views
  useEffect(() => {
    if (user && (currentPage === 'login' || currentPage === 'signup')) {
      const target = user.role === 'superadmin' ? 'superadmin' : 'dashboard';
      setCurrentPage(target);
      setActiveScrollSection('dashboard');
      if (window.location.hash === '#/login' || window.location.hash === '#/signup') {
        window.history.pushState(null, '', `#/${target === 'dashboard' ? 'home' : target}`);
      }
    }
  }, [user, currentPage]);

  const handleAuthSuccess = (userData: { name: string; email: string; avatar?: string; provider?: string; role?: string }) => {
    setUser(userData);
    createActiveSession({ ...userData, role: userData.role as 'user' | 'superadmin' });
    fetchServerScanHistory();
    fetchServerVisionHistory();
    const target = userData.role === 'superadmin' ? 'superadmin' : 'dashboard';
    setCurrentPage(target);
    setActiveScrollSection('dashboard');
    if (window.location.hash !== `#/${target === 'dashboard' ? 'home' : target}`) {
      window.history.pushState(null, '', `#/${target === 'dashboard' ? 'home' : target}`);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    clearActiveUserScansCache();
    clearActiveVisionCache();
    performSignOut();
    setCurrentPage('dashboard');
    setActiveScrollSection('dashboard');
    if (window.location.hash !== '#/home') {
      window.history.pushState(null, '', '#/home');
    }
  };

  // If on login, signup, forgot-password, or reset-password view and user is NOT logged in, render dedicated AuthPage
  if (['login', 'signup', 'forgot-password', 'reset-password', 'reset'].includes(currentPage) && !user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0c]">
        <AuthPage
          initialMode={currentPage === 'reset' ? 'reset-password' : (currentPage as any)}
          onNavigate={handleNavigate}
          onAuthSuccess={handleAuthSuccess}
        />
        <CookieConsentBanner onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-warm-neutral text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      <div>
        <Header 
          activeTab={currentPage === 'dashboard' ? activeScrollSection : currentPage} 
          onNavigate={handleNavigate} 
          onOpenHistory={() => handleNavigate('history')}
          onGetStarted={() => handleOpenAuth('signup')}
          onOpenSettings={handleOpenSettings}
          user={user}
          onSignOut={handleSignOut}
        />
        
        {/* Render Active View / Page */}
        {currentPage === 'superadmin' ? (
          <SuperAdminPage onNavigate={handleNavigate} currentUser={user} />
        ) : currentPage === 'profile' || currentPage === 'account' ? (
          <ProfilePage
            activeTab="profile"
            onTabChange={(tab) => handleNavigate(tab)}
            user={user}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
          />
        ) : currentPage === 'history' ? (
          <HistoryPage
            user={user}
            onNavigate={handleNavigate}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        ) : currentPage === 'settings' ? (
          <SettingsPage
            user={user}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
          />
        ) : currentPage === 'privacy' ? (
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

      {/* Cookie Consent Manager Banner */}
      <CookieConsentBanner onNavigate={handleNavigate} />

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
      <ToastContainer />
    </ThemeProvider>
  );
}

export default App;
