import React, { useState, useEffect } from 'react';
import {
  Clock, Search, Trash2, ShieldCheck, ShieldAlert, Shield, ExternalLink,
  FileText, Globe, Hash, Download, ChevronRight, X,
  AlertTriangle, RefreshCw, File
} from 'lucide-react';
import { getScanHistory, fetchServerScanHistory, removeScanFromHistory, clearScanHistory, formatScanDateTime } from '../lib/historyStore';
import { downloadMalVisionPdfReport } from '../components/HistoryModal';
import type { ScanResultData, ThreatStatus } from '../types';

interface HistoryPageProps {
  user?: { name: string; email: string } | null;
  onNavigate?: (page: string) => void;
  onOpenAuth?: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user, onNavigate }) => {
  const [historyItems, setHistoryItems] = useState<ScanResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Safe' | 'Threats' | 'Suspicious'>('All');
  const [selectedScan, setSelectedScan] = useState<ScanResultData | null>(null);

  const loadScans = async () => {
    setLoading(true);
    try {
      const items = await fetchServerScanHistory();
      setHistoryItems(items);
    } catch {
      setHistoryItems(getScanHistory(user?.email));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadScans();
  }, [user?.email]);

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await removeScanFromHistory(id, user?.email);
    setHistoryItems(updated);
    if (selectedScan?.id === id) {
      setSelectedScan(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all scan history records?')) return;
    const updated = await clearScanHistory(user?.email);
    setHistoryItems(updated);
    setSelectedScan(null);
  };

  // Filter logic
  const filteredItems = historyItems.filter((item) => {
    if (!item) return false;
    const targetStr = (item.target || '').toLowerCase();
    const targetTypeStr = (item.targetType || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase().trim();

    const matchesSearch = !searchLower || targetStr.includes(searchLower) || targetTypeStr.includes(searchLower);

    let matchesFilter = true;
    if (statusFilter === 'Safe') {
      matchesFilter = item.status === 'Safe';
    } else if (statusFilter === 'Threats') {
      matchesFilter = item.status === 'Malicious' || item.status === 'Unknown';
    } else if (statusFilter === 'Suspicious') {
      matchesFilter = item.status === 'Suspicious';
    }

    return matchesSearch && matchesFilter;
  });

  const getTargetIcon = (type?: string, target?: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'pdf' || (target && target.endsWith('.pdf'))) {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    if (t === 'url' || (target && (target.startsWith('http://') || target.startsWith('https://')))) {
      return <Globe className="w-4 h-4 text-blue-400" />;
    }
    if (t === 'hash') {
      return <Hash className="w-4 h-4 text-purple-400" />;
    }
    return <File className="w-4 h-4 text-neutral-400" />;
  };

  const getStatusBadge = (status: ThreatStatus) => {
    switch (status) {
      case 'Safe':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/60 dark:bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>No Threats Found</span>
          </span>
        );
      case 'Suspicious':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-950/60 dark:bg-amber-950/80 text-amber-400 border border-amber-800/40 text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Suspicious</span>
          </span>
        );
      case 'Malicious':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-950/60 dark:bg-rose-950/80 text-rose-400 border border-rose-800/40 text-[11px] font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Threat Detected</span>
          </span>
        );
      case 'Unknown':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Unknown / Unverified</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-6 animate-in fade-in duration-300">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">HISTORY</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">Scan History</h1>
        </div>

        {historyItems.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-rose-900/60 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="p-4 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, URL, or hash..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {(['All', 'Safe', 'Threats', 'Suspicious'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── History Records List / Table ─── */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] space-y-3">
          <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-medium">Loading scan history...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        /* ─── Empty State ─── */
        <div className="p-10 sm:p-14 text-center rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center mx-auto text-neutral-400">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {searchQuery || statusFilter !== 'All' ? 'No matching scans found' : 'No scan history yet'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Your scanned files, URLs, and hashes will appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('scanner')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md"
          >
            <span>Start a Scan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          
          {/* Desktop Table Header (>= 768px) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            <div className="col-span-5">File / Target</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Records List */}
          {filteredItems.map((item) => {
            const isUrl = item.targetType === 'url' || item.target.startsWith('http://') || item.target.startsWith('https://');
            const metaSize = item.metadata?.fileSize || (item.targetType === 'file' || item.targetType === 'pdf' ? '1.2 MB' : undefined);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedScan(item)}
                className="group relative rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#121215] hover:border-neutral-300 dark:hover:border-neutral-700 transition duration-200 p-4 sm:p-5 shadow-xs cursor-pointer"
              >
                {/* Desktop Row View (>= 768px) */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  
                  {/* File / Target */}
                  <div className="col-span-5 flex items-center space-x-3 truncate">
                    <div className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                      {getTargetIcon(item.targetType, item.target)}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {item.target}
                        </span>
                        {isUrl && <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 flex items-center space-x-2 mt-0.5">
                        <span className="uppercase font-bold text-[9px] text-neutral-500">{item.targetType}</span>
                        {metaSize && (
                          <>
                            <span>•</span>
                            <span>{metaSize}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-3">
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Date & Time */}
                  <div className="col-span-2 text-xs font-medium text-neutral-400">
                    {formatScanDateTime(item.timestamp, item.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMalVisionPdfReport(item);
                      }}
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="Download PDF Threat Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScan(item);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold transition cursor-pointer"
                    >
                      View Report
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, e)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-950/30 transition cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile Compact Card View (< 768px) */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                        {getTargetIcon(item.targetType, item.target)}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {item.target}
                        </h4>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          <span className="uppercase font-bold text-[9px] text-neutral-500">{item.targetType}</span>
                          {metaSize && ` • ${metaSize}`}
                          {` • ${formatScanDateTime(item.timestamp, item.createdAt)}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, e)}
                      className="p-1 text-neutral-400 hover:text-rose-500 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>{getStatusBadge(item.status)}</div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScan(item);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                      View Report
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* ─── Detailed Report Modal ─── */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                  {getTargetIcon(selectedScan.targetType, selectedScan.target)}
                </div>
                <div className="truncate">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white truncate">
                    {selectedScan.target}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Scan Report ID: {selectedScan.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              
              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">Scan Status</span>
                <div>{getStatusBadge(selectedScan.status)}</div>
              </div>

              {/* Date & Time Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Date & Time</div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-xs mt-0.5">
                    {formatScanDateTime(selectedScan.timestamp, selectedScan.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Target Type</div>
                  <div className="font-semibold text-neutral-900 dark:text-white text-xs mt-0.5 uppercase">
                    {selectedScan.targetType || 'File'}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Scan Report ID</div>
                  <div className="font-mono text-[11px] text-neutral-500 truncate mt-0.5">
                    {selectedScan.id}
                  </div>
                </div>
              </div>

              {/* Analysis Explanation */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[10px] text-neutral-400">
                  Analysis Summary
                </h4>
                <p className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {selectedScan.explanation || selectedScan.summary || 'No threat indicators detected during heuristic analysis.'}
                </p>
              </div>

              {/* Recommended Action */}
              {selectedScan.recommendedAction && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[10px] text-neutral-400">
                    Recommended Action
                  </h4>
                  <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-900/40 text-blue-300 font-semibold leading-relaxed">
                    {selectedScan.recommendedAction}
                  </div>
                </div>
              )}

              {/* Findings List */}
              {selectedScan.findings && selectedScan.findings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[10px] text-neutral-400">
                    Technical Findings ({selectedScan.findings.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedScan.findings.map((f, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-1">
                        <div className="font-bold text-neutral-900 dark:text-white">{f.title}</div>
                        <div className="text-neutral-500 dark:text-neutral-400">{f.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => downloadMalVisionPdfReport(selectedScan)}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="py-2.5 px-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
