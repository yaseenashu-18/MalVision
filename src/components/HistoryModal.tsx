import React, { useState, useEffect } from 'react';
import { X, Clock, Search, Trash2, ShieldAlert, ShieldCheck as SafeIcon, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getScanHistory, removeScanFromHistory, clearScanHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name: string; email: string } | null;
  onOpenAuth?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, user, onOpenAuth }) => {
  const [historyItems, setHistoryItems] = useState<ScanResultData[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Safe' | 'Suspicious' | 'Malicious'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  const loadHistory = () => {
    setHistoryItems(getScanHistory(user?.email));
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative transform animate-in zoom-in-95 duration-200 p-6 sm:p-8 space-y-5 max-h-[85vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Scan History & Log
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {user ? `Saved threat scans for ${user.email}` : 'Session threat inspection log'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Action Bar */}
        {historyItems.length > 0 && (
          <div className="space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search file name, URL, or hash..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                />
              </div>

              <button
                onClick={handleClearAll}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-1.5 text-xs overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                  historyFilter === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                All ({historyItems.length})
              </button>

              <button
                onClick={() => setHistoryFilter('Safe')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                  historyFilter === 'Safe'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Safe
              </button>

              <button
                onClick={() => setHistoryFilter('Suspicious')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
                  historyFilter === 'Suspicious'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                Suspicious
              </button>

              <button
                onClick={() => setHistoryFilter('Malicious')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap ${
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

        {/* Scrollable Records Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
              <Clock className="w-10 h-10 text-neutral-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {user ? 'No scan history recorded' : 'No guest scans recorded'}
                </p>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  Inspect files, URLs, or hashes using the Threat Scanner. Your results will appear here.
                </p>
              </div>
              {!user && onOpenAuth && (
                <button
                  onClick={() => { onClose(); onOpenAuth(); }}
                  className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-sm"
                >
                  <span>Sign in to Save History</span>
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isExpanded = expandedScanId === item.id;
              const isUrlTarget = item.targetType === 'url' || item.target.startsWith('http://') || item.target.startsWith('https://');

              return (
                <div
                  key={item.id}
                  onClick={() => setExpandedScanId(isExpanded ? null : item.id)}
                  className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shrink-0">
                        {item.status === 'Safe' ? (
                          <SafeIcon className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ShieldAlert className={`w-4 h-4 ${item.status === 'Malicious' ? 'text-rose-500' : 'text-amber-500'}`} />
                        )}
                      </div>
                      <div className="truncate">
                        {isUrlTarget ? (
                          <a
                            href={item.target}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1.5 truncate max-w-[220px] sm:max-w-md group"
                          >
                            <span className="truncate">{item.target}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[220px] sm:max-w-md">
                            {item.target}
                          </h4>
                        )}
                        <p className="text-[10px] text-neutral-400 flex items-center space-x-2 mt-0.5">
                          <span className="uppercase font-bold text-[9px] text-neutral-500">{item.targetType}</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0">
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
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2 animate-in fade-in duration-150">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
                        {item.explanation}
                      </p>
                      {item.recommendedAction && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-200">
                          <strong>Recommended Action:</strong> {item.recommendedAction}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
