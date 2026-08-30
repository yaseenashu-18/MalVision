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
      className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end"
      onClick={onClose}
    >
      {/* Right Side Fixed Width Drawer Panel (No size change on search) */}
      <div 
        className="w-full sm:w-[450px] md:w-[480px] h-full bg-white dark:bg-[#18181B] border-l border-neutral-200/80 dark:border-neutral-800 shadow-2xl flex flex-col justify-between relative transform animate-in slide-in-from-right duration-300 shrink-0 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Scan History
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {user ? user.email : 'Active session scan log'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close history drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Action Bar */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search file name, URL, or hash..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition"
              />
            </div>

            {historyItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Simple Text-Only Filter Chips (Text Highlight Only - NO Background Box) */}
          <div className="flex items-center space-x-4 text-xs pt-1 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-2">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`transition cursor-pointer ${
                historyFilter === 'all'
                  ? 'text-neutral-900 dark:text-white font-bold underline decoration-2 underline-offset-4'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium'
              }`}
            >
              All ({historyItems.length})
            </button>

            <button
              onClick={() => setHistoryFilter('Safe')}
              className={`transition cursor-pointer ${
                historyFilter === 'Safe'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold underline decoration-2 underline-offset-4'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium'
              }`}
            >
              Safe
            </button>

            <button
              onClick={() => setHistoryFilter('Suspicious')}
              className={`transition cursor-pointer ${
                historyFilter === 'Suspicious'
                  ? 'text-amber-600 dark:text-amber-400 font-bold underline decoration-2 underline-offset-4'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium'
              }`}
            >
              Suspicious
            </button>

            <button
              onClick={() => setHistoryFilter('Malicious')}
              className={`transition cursor-pointer ${
                historyFilter === 'Malicious'
                  ? 'text-rose-600 dark:text-rose-400 font-bold underline decoration-2 underline-offset-4'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium'
              }`}
            >
              Malicious
            </button>
          </div>
        </div>

        {/* Scrollable Records List (Fixed height container) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2.5 bg-neutral-50/50 dark:bg-neutral-900/30 my-4">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {user ? 'No scan history recorded' : 'No guest scans recorded'}
                </p>
                <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                  Scan files, URLs, or hashes. Results will appear here.
                </p>
              </div>
              {!user && onOpenAuth && (
                <button
                  onClick={() => { onClose(); onOpenAuth(); }}
                  className="mt-1 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
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
                  className="p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shrink-0">
                        {item.status === 'Safe' ? (
                          <SafeIcon className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ShieldAlert className={`w-3.5 h-3.5 ${item.status === 'Malicious' ? 'text-rose-500' : 'text-amber-500'}`} />
                        )}
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        {isUrlTarget ? (
                          <a
                            href={item.target}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1 truncate max-w-full group"
                          >
                            <span className="truncate">{item.target}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                          </a>
                        ) : (
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {item.target}
                          </h4>
                        )}
                        <p className="text-[10px] text-neutral-400 flex items-center space-x-1.5 mt-0.5">
                          <span className="uppercase font-bold text-[9px] text-neutral-500">{item.targetType}</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Safe'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.status === 'Suspicious'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.status}
                      </span>

                      <button
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2 animate-in fade-in duration-150">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-xs">
                        {item.explanation}
                      </p>
                      {item.recommendedAction && (
                        <div className="p-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-200">
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
