import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, ArrowRight, Search, Trash2, ShieldAlert, ShieldCheck as SafeIcon, ExternalLink, ChevronUp, LogIn } from 'lucide-react';
import { getScanHistory, removeScanFromHistory, clearScanHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import mascotImg from '../assets/robot_mascot.png';

interface HistorySectionProps {
  user?: { name: string; email: string; avatar?: string } | null;
  onOpenAuth?: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ user, onOpenAuth }) => {
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [historyItems, setHistoryItems] = useState<ScanResultData[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Safe' | 'Suspicious' | 'Malicious'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  const loadHistory = () => {
    setHistoryItems(getScanHistory(user?.email));
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleToggleHistory = () => {
    if (!showHistoryList) {
      loadHistory();
    }
    setShowHistoryList(!showHistoryList);
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeScanFromHistory(id, user?.email);
    setHistoryItems(updated);
  };

  const handleClearAll = () => {
    const updated = clearScanHistory(user?.email);
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

  return (
    <section id="scan-history-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Details */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6 z-10">
          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
              Scan smartest,<br />stay protected.
            </h2>
            <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed pt-1">
              {user 
                ? 'Your file scans are encrypted and saved securely under your account in our database.'
                : 'Detect threats in files, links, and documents. Sign in with Google to save your scans permanently across devices.'}
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 flex items-start space-x-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  {user ? 'Cloud History Sync' : 'Session Scans'}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  {user ? 'Scans sync automatically to your MongoDB database account.' : 'Guest scans expire when session ends.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 flex items-start space-x-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Multi-Engine Protection</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                  Advanced threat detection keeps your inspections isolated & safe.
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={handleToggleHistory}
              className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs sm:text-sm hover:opacity-90 transition cursor-pointer shadow-md active:scale-95 w-full sm:w-auto"
            >
              <span>{showHistoryList ? 'Hide History' : `View History (${historyItems.length})`}</span>
              {showHistoryList ? (
                <ChevronUp className="w-4 h-4 stroke-[1.5]" />
              ) : (
                <ArrowRight className="w-4 h-4 stroke-[1.5]" />
              )}
            </button>

            {!user && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer shadow-xs w-full sm:w-auto"
              >
                <LogIn className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sign in to Save History</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Mascot Illustration */}
        <div className="hidden md:flex lg:col-span-6 justify-center lg:justify-end items-center relative select-none pt-4 lg:pt-0">
          <div className="relative w-64 sm:w-80 md:w-[460px] h-64 sm:h-80 md:h-[460px] flex items-center justify-center select-none">
            <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800/40 rounded-full blur-3xl opacity-80" />
            <img
              src={mascotImg}
              alt="MalVision Robot Security Mascot"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-contain relative z-10 filter drop-shadow-2xl pointer-events-none select-none"
              style={{ userSelect: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* Expandable Scan History List Panel */}
      {showHistoryList && (
        <div className="mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">
                {user ? `Scan Log (${user.email})` : 'Scan Log'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Displaying threat inspection logs.
              </p>
            </div>

            {historyItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          {historyItems.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by file name, URL, or hash..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                />
              </div>

              <div className="flex items-center space-x-1.5 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                    historyFilter === 'all'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  All ({historyItems.length})
                </button>

                <button
                  onClick={() => setHistoryFilter('Safe')}
                  className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                    historyFilter === 'Safe'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  Safe
                </button>

                <button
                  onClick={() => setHistoryFilter('Suspicious')}
                  className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                    historyFilter === 'Suspicious'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Suspicious
                </button>

                <button
                  onClick={() => setHistoryFilter('Malicious')}
                  className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                    historyFilter === 'Malicious'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                  }`}
                >
                  Malicious
                </button>
              </div>
            </div>
          )}

          {/* History Cards */}
          {filteredHistory.length === 0 ? (
            <div className="p-8 sm:p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
              <Clock className="w-10 h-10 text-neutral-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {user ? 'No scan history recorded yet' : 'No guest scans performed in this session'}
                </p>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  {user 
                    ? 'Use the Threat Scanner above to inspect files, URLs, or hashes. Your scan results will appear here automatically.'
                    : 'Perform a scan above or sign in with Google to save scans permanently.'}
                </p>
              </div>
              {!user && onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const isExpanded = expandedScanId === item.id;
                const isUrlTarget = item.targetType === 'url' || item.target.startsWith('http://') || item.target.startsWith('https://');

                return (
                  <div
                    key={item.id}
                    onClick={() => setExpandedScanId(isExpanded ? null : item.id)}
                    className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shrink-0">
                          {item.status === 'Safe' ? (
                            <SafeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                          ) : (
                            <ShieldAlert className={`w-4 h-4 sm:w-5 sm:h-5 ${item.status === 'Malicious' ? 'text-rose-500' : 'text-amber-500'}`} />
                          )}
                        </div>
                        <div className="truncate">
                          {isUrlTarget ? (
                            <a
                              href={item.target}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1.5 truncate max-w-[200px] sm:max-w-xl group"
                            >
                              <span className="truncate">{item.target}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                            </a>
                          ) : (
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-xl">
                              {item.target}
                            </h4>
                          )}
                          <p className="text-[10px] sm:text-[11px] text-neutral-400 flex items-center space-x-2 mt-0.5">
                            <span className="uppercase font-bold text-[9px] sm:text-[10px] text-neutral-500">{item.targetType}</span>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-200/60 dark:border-neutral-800/60">
                        <span
                          className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold ${
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
                          onClick={(e) => handleRemoveItem(item.id, e)}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2.5 animate-in fade-in duration-150">
                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
                          {item.explanation}
                        </p>
                        {item.recommendedAction && (
                          <div className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200">
                            <strong>Recommended Action:</strong> {item.recommendedAction}
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
    </section>
  );
};
