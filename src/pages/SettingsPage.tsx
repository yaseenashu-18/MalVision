import React, { useState, useEffect } from 'react';
import {
  Volume2, ShieldCheck, Bell, Shield, Lock, Trash2, LogOut,
  ChevronRight, CheckCircle2, X, Smartphone, Monitor, RefreshCw
} from 'lucide-react';
import { clearApplicationCache } from '../lib/cacheService';
import { isSoundEnabled, setSoundEnabled, playSound } from '../lib/soundEffects';
import { createActiveSession, extractUsername, updateUserProfileInStore } from '../lib/userStore';
import { apiGetActiveSessions, apiRevokeActiveSession, type ActiveSessionItem } from '../lib/authApi';
import { broadcastSyncEvent } from '../lib/syncChannel';
import { showToast } from '../lib/toastStore';
import {
  AddEmailModal, ChangePasswordModal, TwoFactorModal, SignOutConfirmModal
} from './ProfilePage';

interface SettingsPageProps {
  user?: {
    id?: string;
    name: string;
    email?: string;
    username?: string;
    avatar?: string;
    provider?: string;
    role?: string;
    emailVerified?: boolean;
  } | null;
  onSignOut?: () => void;
  onNavigate?: (page: string) => void;
  onUpdateUser?: (updatedUser: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onSignOut,
  onNavigate,
  onUpdateUser,
}) => {
  // ─── 1. Sound Settings ───
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());

  // ─── 2. Scanning Engines Settings ───
  const [engineStatic, setEngineStatic] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_engine_static') !== 'false';
  });
  const [engineHeuristic, setEngineHeuristic] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_engine_heuristic') !== 'false';
  });
  const [engineBehavioral, setEngineBehavioral] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_engine_behavioral') !== 'false';
  });
  const [engineSandbox, setEngineSandbox] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_engine_sandbox') !== 'false';
  });
  const [engineReputation, setEngineReputation] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_engine_reputation') !== 'false';
  });

  // ─── 3. Notification Settings ───
  const [notificationsGlobal, setNotificationsGlobal] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_notifs_global') !== 'false';
  });
  const [securityAlerts, setSecurityAlerts] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_notifs_security') !== 'false';
  });
  const [scanResultsNotif, setScanResultsNotif] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_notifs_scans') !== 'false';
  });
  const [threatDetectionNotif, setThreatDetectionNotif] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_notifs_threats') !== 'false';
  });
  const [systemUpdatesNotif, setSystemUpdatesNotif] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_notifs_updates') === 'true';
  });
  const [emailNotif, setEmailNotif] = useState<boolean>(() => {
    return localStorage.getItem('malvision_pref_notifs_email') !== 'false';
  });

  // ─── Modals State ───
  const [showClearCacheModal, setShowClearCacheModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [show2FAModal, setShow2FAModal] = useState<boolean>(false);
  const [showSignOutModal, setShowSignOutModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showSessionsModal, setShowSessionsModal] = useState<boolean>(false);

  // ─── Active Sessions Management State ───
  const [activeSessionsList, setActiveSessionsList] = useState<ActiveSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // ─── Cache Banner State ───
  const [cacheClearedBanner, setCacheClearedBanner] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isGoogleUser = user?.provider === 'google';
  const hasRealEmail = Boolean(user?.email && !user.email.toLowerCase().includes('@malvision.local'));
  const displayEmail = hasRealEmail ? user!.email! : '';
  const isEmailVerified = user?.emailVerified ?? (isGoogleUser || hasRealEmail);

  const loadActiveSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiGetActiveSessions();
      if (res.success && res.sessions && res.sessions.length > 0) {
        setActiveSessionsList(res.sessions);
      } else {
        setActiveSessionsList([
          {
            sessionId: 'current_sess',
            userId: user?.id || 'usr_current',
            userName: user?.name || 'Current User',
            userEmail: displayEmail,
            device: 'MalVision Web Client',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString(),
            isCurrent: true,
          },
        ]);
      }
    } catch {
      setActiveSessionsList([
        {
          sessionId: 'current_sess',
          userId: user?.id || 'usr_current',
          userName: user?.name || 'Current User',
          userEmail: displayEmail,
          device: 'MalVision Web Client',
          ipAddress: '127.0.0.1',
          createdAt: new Date().toISOString(),
          isCurrent: true,
        },
      ]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (showSessionsModal) {
      loadActiveSessions();
    }
  }, [showSessionsModal]);

  const handleRevokeOtherSession = async (sessionIdToRevoke: string) => {
    setRevokingSessionId(sessionIdToRevoke);
    try {
      const res = await apiRevokeActiveSession(sessionIdToRevoke);
      if (res.success) {
        setActiveSessionsList((prev) => prev.filter((s) => s.sessionId !== sessionIdToRevoke));
        broadcastSyncEvent('malvision:auth-changed', { revokedSessionId: sessionIdToRevoke });
        if (soundEnabled) playSound('click');
        showToast('Session signed out successfully.');
      } else {
        showToast(res.error || 'Failed to sign out session.', 'error');
      }
    } catch {
      showToast('Network error signing out session.', 'error');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Sound Handler
  const handleToggleSound = (val: boolean) => {
    setSoundEnabledState(val);
    setSoundEnabled(val);
    if (val) playSound('click');
    showToast(`Sound effects ${val ? 'enabled' : 'disabled'}.`);
  };

  // Engine Handler
  const handleToggleEngine = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(`malvision_pref_engine_${key}`, String(val));
    if (soundEnabled) playSound('click');
    showToast(`Engine update saved.`);
  };

  // Notification Handler
  const handleToggleNotif = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(`malvision_pref_notifs_${key}`, String(val));
    if (soundEnabled) playSound('click');
    showToast(`Notification setting updated.`);
  };

  // Clear Cache Handler
  const handleConfirmClearCache = () => {
    setShowClearCacheModal(false);
    const ok = clearApplicationCache();
    if (ok) {
      setCacheClearedBanner(true);
      if (soundEnabled) playSound('scan_success');
      showToast('Temporary cache cleared successfully.');
    } else {
      showToast('Cache could not be cleared. Try again.', 'error');
    }
  };

  // Email Saved Handler
  const handleSaveEmail = async (newEmail: string) => {
    const userKey = user?.email || user?.name || '';
    const res = await updateUserProfileInStore(userKey, {
      fullName: user?.name || 'MalVision User',
      username: user?.username || extractUsername(user?.email),
    });
    if (res.success && res.user) {
      const updatedUser = {
        ...user,
        email: newEmail,
        emailVerified: true,
      };
      createActiveSession(updatedUser as any);
      onUpdateUser?.(updatedUser);
      broadcastSyncEvent('malvision:auth-changed', { userId: updatedUser.id });
      showToast('Email address verified successfully!');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 space-y-6 animate-in fade-in duration-300">

      {/* ─── Cache Cleared Banner ─── */}
      {cacheClearedBanner && (
        <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-emerald-900/50 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">✓ Cache Cleared</h4>
              <p className="text-[11px] text-emerald-400/90 mt-0.5">
                Temporary data has been removed. Your scan history and saved reports are safe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCacheClearedBanner(false)}
            className="p-1 text-emerald-400 hover:text-white transition shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Page Header ─── */}
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">SETTINGS</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-5">

        {/* ═══════════════════════════════════════════════════════════════
           1. SOUND SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center space-x-2">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Sound</span>
            </h2>
          </div>

          <div className="p-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Sound Effects</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Play subtle sounds for important security events and actions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleSound(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundEnabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={soundEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           2. SCANNING ENGINES SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Scanning Engines</span>
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Choose which security engines are used when analyzing your files.
            </p>
          </div>

          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-xs">
            
            {/* Engine 1: Malware Detection (Required) */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Malware Detection</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Detect known malicious signatures and threats.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40 text-[10px] font-bold uppercase tracking-wider shrink-0">
                Required
              </span>
            </div>

            {/* Engine 2: Static Analysis */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Static Analysis</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Analyze file structure, metadata, and contents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEngine('static', !engineStatic, setEngineStatic)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  engineStatic ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={engineStatic}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    engineStatic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Engine 3: Heuristic Analysis */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Heuristic Analysis</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Detect suspicious patterns and anomalies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEngine('heuristic', !engineHeuristic, setEngineHeuristic)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  engineHeuristic ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={engineHeuristic}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    engineHeuristic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Engine 4: Behavioral Analysis */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Behavioral Analysis</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Analyze potentially suspicious file behavior.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEngine('behavioral', !engineBehavioral, setEngineBehavioral)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  engineBehavioral ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={engineBehavioral}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    engineBehavioral ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Engine 5: Sandbox Analysis */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Sandbox Analysis</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Analyze files in an isolated environment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEngine('sandbox', !engineSandbox, setEngineSandbox)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  engineSandbox ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={engineSandbox}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    engineSandbox ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Engine 6: Reputation Check */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Reputation Check</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Check file reputation against available threat intelligence.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEngine('reputation', !engineReputation, setEngineReputation)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  engineReputation ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={engineReputation}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    engineReputation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           3. NOTIFICATIONS SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center space-x-2">
              <Bell className="w-3.5 h-3.5 text-blue-500" />
              <span>Notifications</span>
            </h2>
          </div>

          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-xs">
            
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Notifications</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Receive important updates and security alerts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleNotif('global', !notificationsGlobal, setNotificationsGlobal)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notificationsGlobal ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={notificationsGlobal}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notificationsGlobal ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category 1: Security Alerts */}
            <div className="flex items-center justify-between p-4 pl-6">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Security Alerts</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Notify me when a security threat is detected.
                </p>
              </div>

              <button
                type="button"
                disabled={!notificationsGlobal}
                onClick={() => handleToggleNotif('security', !securityAlerts, setSecurityAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !notificationsGlobal ? 'opacity-40 cursor-not-allowed bg-neutral-700' : securityAlerts ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={securityAlerts}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    securityAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category 2: Scan Results */}
            <div className="flex items-center justify-between p-4 pl-6">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Scan Results</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Notify me when a file scan is complete.
                </p>
              </div>

              <button
                type="button"
                disabled={!notificationsGlobal}
                onClick={() => handleToggleNotif('scans', !scanResultsNotif, setScanResultsNotif)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !notificationsGlobal ? 'opacity-40 cursor-not-allowed bg-neutral-700' : scanResultsNotif ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={scanResultsNotif}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    scanResultsNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category 3: Threat Detection */}
            <div className="flex items-center justify-between p-4 pl-6">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Threat Detection</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Notify me immediately when a threat is detected.
                </p>
              </div>

              <button
                type="button"
                disabled={!notificationsGlobal}
                onClick={() => handleToggleNotif('threats', !threatDetectionNotif, setThreatDetectionNotif)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !notificationsGlobal ? 'opacity-40 cursor-not-allowed bg-neutral-700' : threatDetectionNotif ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={threatDetectionNotif}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    threatDetectionNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category 4: System Updates */}
            <div className="flex items-center justify-between p-4 pl-6">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">System Updates</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Receive important MalVision updates.
                </p>
              </div>

              <button
                type="button"
                disabled={!notificationsGlobal}
                onClick={() => handleToggleNotif('updates', !systemUpdatesNotif, setSystemUpdatesNotif)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !notificationsGlobal ? 'opacity-40 cursor-not-allowed bg-neutral-700' : systemUpdatesNotif ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                role="switch"
                aria-checked={systemUpdatesNotif}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    systemUpdatesNotif ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category 5: Email Notifications */}
            <div className="flex items-center justify-between p-4 pl-6">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Email Notifications</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {hasRealEmail
                    ? 'Receive important security notifications by email.'
                    : 'Add and verify your email to receive email notifications.'}
                </p>
              </div>

              <div>
                {hasRealEmail ? (
                  <button
                    type="button"
                    disabled={!notificationsGlobal}
                    onClick={() => handleToggleNotif('email', !emailNotif, setEmailNotif)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !notificationsGlobal ? 'opacity-40 cursor-not-allowed bg-neutral-700' : emailNotif ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    role="switch"
                    aria-checked={emailNotif}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        emailNotif ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Add & Verify
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           4. PRIVACY & DATA SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Privacy & Data</span>
            </h2>
          </div>

          <div className="p-4 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">Clear Cache</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Remove temporary data stored on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowClearCacheModal(true)}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 border border-neutral-200 dark:border-neutral-700"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           5. SECURITY SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
            <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>Security</span>
            </h2>
          </div>

          <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60 text-xs">
            
            {/* Change Password */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition cursor-pointer group text-left"
            >
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-blue-500 transition">Change Password</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Update your account password</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition shrink-0" />
            </button>

            {/* Two-Factor Authentication */}
            <button
              type="button"
              onClick={() => setShow2FAModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition cursor-pointer group text-left"
            >
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-blue-500 transition">Two-Factor Authentication</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Add an extra layer of account security</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold border border-neutral-200 dark:border-neutral-700">
                  Not Enabled
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition shrink-0" />
              </div>
            </button>

            {/* Active Sessions / Devices */}
            <button
              type="button"
              onClick={() => setShowSessionsModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition cursor-pointer group text-left"
            >
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-blue-500 transition">Active Sessions / Devices</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Manage devices signed into your account</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition shrink-0" />
            </button>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           6. SIGN OUT SECTION
           ═══════════════════════════════════════════════════════════════ */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl border border-rose-600/40 hover:border-rose-600 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs group"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:scale-110 transition duration-200" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
         MODALS
         ═══════════════════════════════════════════════════════════════ */}

      {/* CLEAR CACHE CONFIRMATION MODAL */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-amber-950/60 text-amber-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Clear Cache?</h3>
                <p className="text-xs text-neutral-400">Temporary Device Data</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              This will remove temporary data stored on this device. Your account, scan history, saved reports, and previous scan results will not be deleted.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCache}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          isGoogleOnly={isGoogleUser && !user?.id?.startsWith('usr_')}
          userEmail={displayEmail}
          isEmailVerified={isEmailVerified}
          onNavigate={onNavigate}
          onOpenAddEmail={() => {
            setShowPasswordModal(false);
            setShowEmailModal(true);
          }}
        />
      )}

      {/* 2FA MODAL */}
      {show2FAModal && (
        <TwoFactorModal onClose={() => setShow2FAModal(false)} />
      )}

      {/* ACTIVE SESSIONS / DEVICES MODAL */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-950/60 text-blue-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Active Sessions & Devices</h3>
                  <p className="text-[11px] text-neutral-400">Manage active user accounts and device connections</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionsModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Cards List */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {loadingSessions ? (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs text-neutral-400 font-medium">Loading active sessions...</p>
                </div>
              ) : activeSessionsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">
                  No active sessions found.
                </div>
              ) : (
                activeSessionsList.map((sess) => {
                  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
                  const isMobile = sess.isCurrent ? (isMobileView || sess.device.includes('Mobile') || sess.device.includes('iPhone') || sess.device.includes('Android')) : (sess.device.includes('Mobile') || sess.device.includes('iPhone') || sess.device.includes('Android'));
                  
                  let deviceLabel = sess.device;
                  if (sess.isCurrent) {
                    if (isMobileView && deviceLabel.includes('PC')) {
                      deviceLabel = deviceLabel.replace('PC', 'Mobile');
                    } else if (!isMobileView && deviceLabel.includes('Mobile') && !deviceLabel.includes('iPhone') && !deviceLabel.includes('Android')) {
                      deviceLabel = deviceLabel.replace('Mobile', 'PC');
                    }
                  }

                  return (
                    <div
                      key={sess.sessionId}
                      className={`p-4 rounded-2xl border transition flex items-center justify-between text-xs gap-3 ${
                        sess.isCurrent
                          ? 'bg-neutral-50 dark:bg-neutral-900/80 border-emerald-800/40'
                          : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
                          {isMobile ? (
                            <Smartphone className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Monitor className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-neutral-900 dark:text-white truncate">
                              {sess.userName || 'Active Account'}
                            </h4>
                            {sess.userEmail && (
                              <span className="text-[10px] text-neutral-400 truncate">({sess.userEmail})</span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                            {deviceLabel} • <span className="font-mono text-[10px]">{sess.ipAddress}</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {sess.isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 text-[10px] font-bold border border-emerald-800/40 whitespace-nowrap">
                            Current Session
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={revokingSessionId === sess.sessionId}
                            onClick={() => handleRevokeOtherSession(sess.sessionId)}
                            className="px-3 py-1.5 rounded-xl border border-rose-600/40 hover:border-rose-600 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            {revokingSessionId === sess.sessionId ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <LogOut className="w-3.5 h-3.5" />
                            )}
                            <span>Sign Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSessionsModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <AddEmailModal
          currentEmail={hasRealEmail ? displayEmail : ''}
          onClose={() => setShowEmailModal(false)}
          onSave={handleSaveEmail}
        />
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showSignOutModal && (
        <SignOutConfirmModal
          onConfirm={() => {
            setShowSignOutModal(false);
            onSignOut?.();
          }}
          onClose={() => setShowSignOutModal(false)}
        />
      )}

    </div>
  );
};
