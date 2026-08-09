import React, { useState, useEffect } from 'react';
import { X, User, Palette, ShieldCheck, Clock, Sparkles, Sun, Moon, Monitor, Check, LogOut, Trash2, Search, ShieldAlert, ShieldCheck as SafeIcon, ExternalLink } from 'lucide-react';
import { useTheme } from '../lib/themeContext';
import { getScanHistory, removeScanFromHistory, clearScanHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'appearance' | 'privacy' | 'history' | 'plans';
  user?: { name: string; email: string } | null;
  onSignOut?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'appearance',
  user,
  onSignOut,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy' | 'history' | 'plans'>(initialTab);
  const [historyItems, setHistoryItems] = useState<ScanResultData[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Safe' | 'Suspicious' | 'Malicious'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setHistoryItems(getScanHistory());
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeScanFromHistory(id);
    setHistoryItems(updated);
  };

  const handleClearHistory = () => {
    const updated = clearScanHistory();
    setHistoryItems(updated);
  };

  const filteredHistory = historyItems.filter((item) => {
    if (!item || typeof item.target !== 'string') return false;
    const targetStr = (item.target || '').toLowerCase();
    const targetTypeStr = (item.targetType || '').toLowerCase();
    const searchLower = (historySearch || '').toLowerCase();

    const matchesFilter = historyFilter === 'all' || item.status === historyFilter;
    const matchesSearch = targetStr.includes(searchLower) || targetTypeStr.includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#1A1A1D] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row min-h-[500px] transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 bg-neutral-50/70 dark:bg-neutral-900/60 border-r border-neutral-200/80 dark:border-neutral-800 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Settings
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage MalVision preferences
              </p>
            </div>

            {/* Nav Tabs */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Scan History</span>
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>My Plans</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-400">
            MalVision v1.0.4 • Security Web App
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[500px]">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">User Profile</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage your account information and security profile.</p>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                <div className="w-12 h-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-lg">
                  {user ? getInitials(user.name) : 'MV'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {user ? user.name : 'MalVision Guest'}
                  </h4>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user ? user.email : 'guest@malvision.security'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Display Name</label>
                  <input
                    type="text"
                    readOnly
                    value={user ? user.name : 'MalVision Guest'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={user ? user.email : 'guest@malvision.security'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                {user && (
                  <button
                    onClick={() => {
                      onSignOut?.();
                      onClose();
                    }}
                    className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Appearance & Theme</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Customize how MalVision looks on your screen.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border flex flex-col items-center space-y-3 cursor-pointer transition ${
                    theme === 'light'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">Light</span>
                  {theme === 'light' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border flex flex-col items-center space-y-3 cursor-pointer transition ${
                    theme === 'dark'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">Dark</span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                <button
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border flex flex-col items-center space-y-3 cursor-pointer transition ${
                    theme === 'system'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">System</span>
                  {theme === 'system' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Privacy & Security</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Control data retention and inspection isolation settings.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">Local-First Sandbox Inspection</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Inspect content safely without storing unencrypted files.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">Anonymous Threat Telemetry</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Help improve malicious URL & hash threat intelligence database.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* SCAN HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Scan History</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Review your past inspected files, URLs, and hashes.</p>
                </div>
                {historyItems.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Search and Filter controls */}
              <div className="space-y-3">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search history by name, URL or hash..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'all'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                    }`}
                  >
                    All ({historyItems.length})
                  </button>

                  <button
                    onClick={() => setHistoryFilter('Safe')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'Safe'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Safe
                  </button>

                  <button
                    onClick={() => setHistoryFilter('Suspicious')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'Suspicious'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    Suspicious
                  </button>

                  <button
                    onClick={() => setHistoryFilter('Malicious')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'Malicious'
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                    }`}
                  >
                    Malicious
                  </button>
                </div>
              </div>

              {/* History Item Cards */}
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
                  <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">No scan history found</p>
                  <p className="text-[11px] text-neutral-400">Run a scan using the Threat Scanner to see results logged here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHistory.map((item) => {
                    const isExpanded = expandedScanId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setExpandedScanId(isExpanded ? null : item.id)}
                        className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 truncate mr-3">
                            <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                              {item.status === 'Safe' ? (
                                <SafeIcon className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ShieldAlert className={`w-4 h-4 ${item.status === 'Malicious' ? 'text-rose-500' : 'text-amber-500'}`} />
                              )}
                            </div>
                            <div className="truncate">
                              {item.targetType === 'url' || item.target.startsWith('http://') || item.target.startsWith('https://') ? (
                                <a
                                  href={item.target}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 truncate max-w-xs sm:max-w-md group"
                                >
                                  <span className="truncate">{item.target}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 group-hover:opacity-100 transition" />
                                </a>
                              ) : (
                                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">
                                  {item.target}
                                </h4>
                              )}
                              <p className="text-[11px] text-neutral-400 flex items-center space-x-1.5 mt-0.5">
                                <span className="uppercase font-semibold text-[10px] text-neutral-500">{item.targetType}</span>
                                <span>•</span>
                                <span>{item.timestamp}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Safe'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : item.status === 'Suspicious'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {item.status}
                            </span>

                            <button
                              onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs space-y-2 animate-in fade-in duration-150">
                            <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                              {item.explanation}
                            </p>
                            {item.recommendedAction && (
                              <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300">
                                <strong>Recommended:</strong> {item.recommendedAction}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MY PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">My Plans & Subscriptions</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">View current tier usage and upgrade options.</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Current Active Tier</span>
                    <h4 className="text-xl font-extrabold">MalVision Free Tier</h4>
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  Unlimited standard file, PDF, link, and hash scanning with local sandboxing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
