import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock, CheckCircle2 } from 'lucide-react';

interface PrivacyAndTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'cookies';
}

export const PrivacyAndTermsModal: React.FC<PrivacyAndTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1A1A1D] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              {activeTab === 'privacy' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : activeTab === 'terms' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {activeTab === 'privacy' ? 'Privacy Policy' : activeTab === 'terms' ? 'Terms of Service' : 'Cookie & Security Policy'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                MalVision Security & Compliance Standards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-neutral-200/60 dark:border-neutral-800/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'terms'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'cookies'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
            }`}
          >
            Cookie Policy
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Local-First Inspection Guarantee: Files are scanned in isolated browser sandboxes.</span>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">1. Information We Collect</h3>
                <p>
                  MalVision prioritizes user privacy. When inspecting files, links, or document hashes, analysis is executed locally or via encrypted SSL telemetry feeds to match threat intelligence signatures in MongoDB Atlas (<code className="font-mono text-emerald-600 dark:text-emerald-400">threat-detection</code>).
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">2. Google OAuth Data Usage</h3>
                <p>
                  When signing in with Google OAuth, MalVision accesses basic profile details (your name, verified email address, and avatar picture). We do not request access to your Google Drive, Gmail, or private storage.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">3. Data Retention & History</h3>
                <p>
                  Scan reports and threat hashes logged in your history are stored in your encrypted local cache and synced to your MongoDB session database. You may clear your scan history at any time from the Scan History tab.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">1. Acceptable Use</h3>
                <p>
                  MalVision is provided for security analysis, threat detection, PDF stream verification, and domain reputation checking. Users agree not to misuse the platform to distribute malicious software or bypass security controls.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">2. Disclaimer of Warranties</h3>
                <p>
                  MalVision employs multi-engine signature matching and heuristic sandboxing. Threat detection metrics provide high-confidence probability scores, but users should exercise standard cybersecurity precautions when handling unknown executables.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">3. Platform Modifications</h3>
                <p>
                  We reserve the right to update security features, engine rules, and threat database indexes to maintain system integrity against emerging malware vectors.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4 animate-in fade-in">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">1. Session Storage & Essential Cookies</h3>
                <p>
                  MalVision uses local session storage strictly for maintaining your theme preference (Light/Dark/System), active MongoDB cluster state, and authenticated Google session token.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">2. No Third-Party Tracking Cookies</h3>
                <p>
                  MalVision does not use third-party advertising cookies, cross-site trackers, or behavioral profiling scripts.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
