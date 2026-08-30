import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Search, Trash2, ShieldAlert, ShieldCheck as SafeIcon, ExternalLink, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { getScanHistory, removeScanFromHistory, clearScanHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import malvisionLogoSvg from '../assets/MalVision_glossy_black_logo_2K_2026083006316.svg';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name: string; email: string } | null;
  onOpenAuth?: () => void;
}

/**
 * Native PDF Generator featuring the official MalVision_glossy_black_logo_2K_2026083006316.svg
 * Uses light grey paper background (#f4f4f5), dark text (#09090b), and strict red/green status colors.
 */
export function downloadMalVisionPdfReport(item: ScanResultData) {
  const isSafe = item.status === 'Safe';
  // Strict 3-color palette: Green (#16a34a) for Safe, Red (#dc2626) for Malicious, rest Black/Grey/White
  const statusColor = isSafe ? '#16a34a' : '#dc2626';
  const statusBg = isSafe ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MalVision_Threat_Report_${item.id || 'scan'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f4f4f5 !important;
            color: #09090b !important;
            margin: 0;
            padding: 30px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #e4e4e7;
            padding-bottom: 20px;
            margin-bottom: 28px;
          }
          .logo-img {
            height: 48px;
            width: auto;
            object-fit: contain;
          }
          .report-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #71717a !important;
            font-weight: 700;
            margin-top: 6px;
          }
          .status-tag {
            font-size: 14px;
            font-weight: 800;
            color: ${statusColor} !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: ${statusBg} !important;
            padding: 6px 16px;
            border-radius: 9999px;
            border: 1px solid ${statusColor} !important;
            display: inline-block;
          }
          .section-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #71717a !important;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .section-value {
            font-size: 15px;
            font-weight: 700;
            color: #09090b !important;
            word-break: break-all;
          }
          .divider {
            border-top: 1px solid #e4e4e7;
            margin: 24px 0;
          }
          .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 1px solid #e4e4e7;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #71717a !important;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <img src="${malvisionLogoSvg}" alt="MalVision Logo" class="logo-img" />
            <div class="report-title">Threat Analysis Report</div>
          </div>
          <div class="status-tag">
            STATUS: ${item.status.toUpperCase()}
          </div>
        </div>

        <!-- Essential File Information (Paper Style - NO Boxes, NO Cards) -->
        <div style="margin-bottom: 24px; line-height: 1.8;">
          <div style="margin-bottom: 16px;">
            <div class="section-label">Target Analyzed</div>
            <div class="section-value">${item.target}</div>
          </div>

          <div style="display: flex; gap: 48px; margin-bottom: 16px;">
            <div>
              <div class="section-label">Scan Timestamp</div>
              <div style="font-size: 13px; font-weight: 600; color: #18181b;">${item.timestamp || new Date().toLocaleString()}</div>
            </div>
            <div>
              <div class="section-label">Target Type</div>
              <div style="font-size: 13px; font-weight: 600; color: #18181b; text-transform: uppercase;">${item.targetType}</div>
            </div>
            <div>
              <div class="section-label">Report ID</div>
              <div style="font-size: 13px; font-weight: 600; color: #18181b;">${item.id}</div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Assessment Summary -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 800; color: #09090b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            Assessment Summary
          </div>
          <div style="font-size: 13px; line-height: 1.7; color: #27272a;">
            ${item.explanation}
          </div>
        </div>

        <!-- Recommended Action -->
        <div style="margin-bottom: 32px;">
          <div style="font-size: 12px; font-weight: 800; color: #09090b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            Recommended Action
          </div>
          <div style="font-size: 13px; font-weight: 700; color: ${statusColor};">
            ${item.recommendedAction || 'No action required.'}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>Verified Threat Analysis • MalVision Security</div>
          <div>https://malvision.vercel.app</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 150);
          };
        </script>
      </body>
    </html>
  `;

  // Create print iframe to render paper PDF accurately with zero blank pages
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  }
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, user, onOpenAuth }) => {
  const [historyItems, setHistoryItems] = useState<ScanResultData[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Safe' | 'Malicious'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  // Filter button refs for smooth sliding tab indicator (All, Safe, Malicious)
  const allRef = useRef<HTMLButtonElement>(null);
  const safeRef = useRef<HTMLButtonElement>(null);
  const maliciousRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const loadHistory = () => {
    setHistoryItems(getScanHistory(user?.email));
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, user]);

  // Update sliding indicator position on filter change
  useEffect(() => {
    if (!isOpen) return;
    let targetRef = allRef;
    if (historyFilter === 'Safe') targetRef = safeRef;
    else if (historyFilter === 'Malicious') targetRef = maliciousRef;

    if (targetRef.current) {
      setIndicatorStyle({
        left: targetRef.current.offsetLeft,
        width: targetRef.current.offsetWidth,
      });
    }
  }, [historyFilter, isOpen, historyItems.length]);

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

  const handleDownloadItemPdf = (item: ScanResultData, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadMalVisionPdfReport(item);
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
      className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end p-0"
      onClick={onClose}
    >
      {/* TapType Style Floating Right Panel (All, Safe, Malicious Tabs) */}
      <div 
        className="fixed top-4 bottom-4 right-3 sm:right-5 w-[calc(100%-24px)] sm:w-[400px] md:w-[420px] max-h-[calc(100vh-32px)] bg-white dark:bg-[#18181D] border border-neutral-200/90 dark:border-neutral-800/90 rounded-[28px] shadow-2xl flex flex-col justify-between relative transform animate-in slide-in-from-right duration-300 p-5 overflow-hidden z-50 box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Session History
              </h2>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                {user ? user.email : 'Guest scan log'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-neutral-200/60 dark:border-neutral-700/60"
            aria-label="Close history panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Action Bar */}
        <div className="space-y-3 shrink-0 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search file name, URL, or hash..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition"
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

          {/* Smooth Sliding Filter Bar (All, Safe, Malicious) */}
          <div className="relative flex items-center space-x-4 text-xs pt-1 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-2.5 overflow-x-auto scrollbar-none">
            <button
              ref={allRef}
              onClick={() => setHistoryFilter('all')}
              className={`transition cursor-pointer relative z-10 ${
                historyFilter === 'all'
                  ? 'text-neutral-900 dark:text-white font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium'
              }`}
            >
              All ({historyItems.length})
            </button>

            <button
              ref={safeRef}
              onClick={() => setHistoryFilter('Safe')}
              className={`transition cursor-pointer relative z-10 ${
                historyFilter === 'Safe'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium'
              }`}
            >
              Safe
            </button>

            <button
              ref={maliciousRef}
              onClick={() => setHistoryFilter('Malicious')}
              className={`transition cursor-pointer relative z-10 ${
                historyFilter === 'Malicious'
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium'
              }`}
            >
              Malicious
            </button>

            {/* Smooth Sliding Underline Indicator */}
            <div
              className={`absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out z-0 ${
                historyFilter === 'Safe'
                  ? 'bg-emerald-500'
                  : historyFilter === 'Malicious'
                  ? 'bg-rose-500'
                  : 'bg-neutral-900 dark:bg-white'
              }`}
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          </div>
        </div>

        {/* Scrollable Records List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pt-2 min-h-0">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800/80 rounded-2xl space-y-2.5 bg-neutral-50/50 dark:bg-neutral-900/30 my-2">
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
                  className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-[#222227]/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shrink-0">
                        {item.status === 'Safe' ? (
                          <SafeIcon className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
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

                    {/* Clean Action Buttons (Icon Only - No PDF text label, no Safe/Malicious text) */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Direct PDF Download Icon Button */}
                      <button
                        onClick={(e) => handleDownloadItemPdf(item, e)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition cursor-pointer"
                        title="Download PDF Threat Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition cursor-pointer"
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
