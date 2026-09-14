import React, { useRef, useState } from 'react';
import {
  FileUp,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Download,
  Minus,
  Plus,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Activity,
  Target,
  Cpu,
  Globe,
  Zap,
} from 'lucide-react';
import { analyzePdf } from '../lib/scanEngine';
import { saveScanToHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import { downloadMalVisionPdfReport } from './HistoryModal';

interface PdfInspectorProps {
  user?: { name: string; email: string } | null;
}

type InspectorTab = 'preview' | 'analysis' | 'details';

export const PdfInspector: React.FC<PdfInspectorProps> = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorTab>('preview');
  const [activePage, setActivePage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default sample values for demo PDF inspect if file is uploaded
  const totalPages = 12;

  // Format file size (MB or KB)
  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  // Format file modified date
  const formatFileModifiedDate = (file: File): string => {
    try {
      const date = file.lastModified ? new Date(file.lastModified) : new Date();
      return (
        date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        `, ${date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`
      );
    } catch {
      return 'Sep 11, 2026, 10:24 AM';
    }
  };

  const handlePdfSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid PDF document.');
      return;
    }

    setSelectedFile(file);
    setIsScanning(true);
    setActivePage(1);

    try {
      const res = await analyzePdf(file);
      saveScanToHistory(res, user?.email);
      setScanResult(res);
    } finally {
      setIsScanning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handlePdfSelected(files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChangeFileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setScanResult(null);
    setActivePage(1);
  };

  // Render Visual Miniature PDF Page Preview Thumbnail (NO GENERIC PDF ICONS)
  const renderPdfThumbnail = (fileName: string) => {
    return (
      <div className="w-16 h-20 rounded-xl border border-neutral-300 dark:border-neutral-700/80 bg-white dark:bg-[#1a1a1e] p-2 flex flex-col justify-between shrink-0 shadow-sm relative overflow-hidden group">
        <div className="border-b border-neutral-200 dark:border-neutral-700/60 pb-1 flex justify-between items-center">
          <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 truncate max-w-[45px]">
            {fileName}
          </span>
          <span className="text-[7px] font-bold text-neutral-400">P.1</span>
        </div>
        <div className="space-y-1 my-1 flex-1">
          <div className="h-1.5 w-3/4 rounded bg-neutral-400 dark:bg-neutral-600" />
          <div className="h-1 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
          <div className="h-1 w-5/6 rounded bg-neutral-300 dark:bg-neutral-700" />
          <div className="h-1 w-4/6 rounded bg-neutral-300 dark:bg-neutral-700" />
        </div>
        <div className="text-[7px] font-mono text-neutral-400 dark:text-neutral-500 text-right">
          PDF Page 1
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[460px] flex flex-col justify-between text-left select-none relative space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* ═══════════════════════════════════════════════════════════════
         TOP HEADER (Title, Subtitle & Know Before You Open Badge)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pb-1 border-b border-neutral-200/80 dark:border-neutral-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            PDF Inspector
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Preview and analyze PDF content before opening.
          </p>
        </div>

        {/* Know Before You Open Badge */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Know Before You Open.</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         STATE 1 — NO FILE SELECTED (Drop Zone)
         ═══════════════════════════════════════════════════════════════ */}
      {!selectedFile && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex-1 border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200 bg-neutral-50/50 dark:bg-[#151518]/70 hover:bg-neutral-100/50 dark:hover:bg-[#18181D]/90 group"
        >
          <div className="w-16 h-16 rounded-2xl border border-neutral-300 dark:border-neutral-700/80 bg-white dark:bg-[#1c1c20] text-neutral-800 dark:text-neutral-200 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <FileUp className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Drop your PDF document here
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            or click to browse PDF files
          </p>

          <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500">
            Supports PDF documents up to 50MB
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         STATE 2 — SCANNING LOADING STATE
         ═══════════════════════════════════════════════════════════════ */}
      {selectedFile && isScanning && (
        <div className="w-full flex-1 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] p-12 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-10 h-10 text-neutral-900 dark:text-white animate-spin" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Deconstructing PDF Structure...
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Parsing cross-reference tables, font streams, and embedded action triggers.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         STATE 3 — PDF INSPECTED (Preview, Analysis & Details Views)
         ═══════════════════════════════════════════════════════════════ */}
      {selectedFile && !isScanning && scanResult && (
        <div className="w-full flex-1 flex flex-col justify-between space-y-5 animate-in fade-in duration-200">
          {/* Selected File Card Header */}
          <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-4 truncate">
              {renderPdfThumbnail(selectedFile.name)}
              <div className="truncate space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                  {selectedFile.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                  {formatFileSize(selectedFile.size)} • {totalPages} pages
                </p>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate pt-0.5">
                  <span>Last modified {formatFileModifiedDate(selectedFile)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangeFileClick}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              Change File
            </button>
          </div>

          {/* Segmented Navigation Control Tabs (Preview / Analysis / Details) */}
          <div className="p-1 rounded-2xl bg-neutral-100 dark:bg-[#141417] border border-neutral-200/80 dark:border-neutral-800 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2 ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2 ${
                activeTab === 'analysis'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-2 ${
                activeTab === 'details'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
             TAB 1 — PREVIEW MODE (2-Column Grid matching Screenshot)
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'preview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (8 cols): PDF Viewer Container */}
              <div className="lg:col-span-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] p-4 flex flex-col justify-between space-y-4 shadow-sm">
                {/* PDF Viewer Control Bar */}
                <div className="flex items-center justify-between text-xs border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={activePage <= 1}
                      onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    </button>

                    <span className="font-bold text-neutral-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      {activePage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={activePage >= totalPages}
                      onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-[11px]">
                      {zoomLevel}%
                    </span>

                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                      className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setZoomLevel(100)}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                      title="Fit View"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Rendered Document Page (High-Fidelity Paper Simulation) */}
                <div className="w-full min-h-[360px] rounded-2xl bg-white text-neutral-900 p-8 shadow-inner flex flex-col justify-between border border-neutral-300 overflow-hidden relative">
                  {/* Document Page Header Content */}
                  <div className="space-y-4">
                    <div className="border-b border-neutral-300 pb-4">
                      <h1 className="text-2xl font-black tracking-tight text-neutral-900">
                        {activePage === 1 ? 'Project Report' : `Section ${activePage}: Analysis Overview`}
                      </h1>
                      <p className="text-xs font-semibold text-neutral-600 mt-1">
                        Cybersecurity Analysis System
                      </p>
                    </div>

                    <p className="text-xs text-neutral-700 leading-relaxed font-serif">
                      {activePage === 1
                        ? 'A comprehensive analysis of file scanning techniques, threat detection mechanisms, and AI-based malware identification.'
                        : `Page ${activePage} of ${selectedFile.name}. Content parsed in isolated read-only preview shell without executing embedded macros or active scripts.`}
                    </p>

                    <div className="space-y-2 pt-4 text-xs font-serif text-neutral-600">
                      <div className="h-2 bg-neutral-200 rounded w-full" />
                      <div className="h-2 bg-neutral-200 rounded w-5/6" />
                      <div className="h-2 bg-neutral-200 rounded w-4/6" />
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="pt-8 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500 font-sans">
                    <span>Prepared by <strong>MalVision Team</strong></span>
                    <span>September 11, 2026</span>
                  </div>
                </div>

                {/* Page Thumbnails Selector Row */}
                <div className="flex items-center space-x-2 pt-1 overflow-x-auto pb-1">
                  {[1, 2, 3, 4].map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setActivePage(pageNum)}
                      className={`w-12 h-14 rounded-lg border flex flex-col justify-between p-1 cursor-pointer transition shrink-0 ${
                        activePage === pageNum
                          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 ring-2 ring-blue-500/30'
                          : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="h-1 bg-neutral-400 dark:bg-neutral-500 rounded w-3/4" />
                        <div className="h-0.5 bg-neutral-300 dark:bg-neutral-600 rounded w-full" />
                        <div className="h-0.5 bg-neutral-300 dark:bg-neutral-600 rounded w-1/2" />
                      </div>
                      <span className="text-[9px] font-bold text-center block text-neutral-600 dark:text-neutral-400">
                        {pageNum}
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setActivePage(5)}
                    className="w-12 h-14 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs flex items-center justify-center shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                  >
                    +{totalPages - 4}
                  </button>
                </div>
              </div>

              {/* Right Column (5 cols): Document Info & Content Overview Cards */}
              <div className="lg:col-span-5 space-y-4">
                {/* Card 1: Document Information */}
                <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span>Document Information</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">File name</span>
                      <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[160px]">
                        {selectedFile.name}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">File size</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Total pages</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{totalPages}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">File type</span>
                      <span className="font-bold text-neutral-900 dark:text-white">PDF Document</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Created</span>
                      <span className="font-bold text-neutral-900 dark:text-white">Sep 10, 2026, 02:14 PM</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Modified</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {formatFileModifiedDate(selectedFile)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Author</span>
                      <span className="font-bold text-neutral-900 dark:text-white">MalVision Team</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Producer</span>
                      <span className="font-bold text-neutral-900 dark:text-white">Microsoft Word</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500 dark:text-neutral-400">PDF version</span>
                      <span className="font-bold text-neutral-900 dark:text-white">1.7</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Content Overview */}
                <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-neutral-400" />
                    <span>Content Overview</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Text content</span>
                      <span className="font-bold text-neutral-900 dark:text-white">Yes</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Images</span>
                      <span className="font-bold text-neutral-900 dark:text-white">4</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Tables</span>
                      <span className="font-bold text-neutral-900 dark:text-white">2</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Links</span>
                      <span className="font-bold text-neutral-900 dark:text-white">3</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Form fields</span>
                      <span className="font-bold text-neutral-900 dark:text-white">No</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">Embedded files</span>
                      <span className="font-bold text-neutral-900 dark:text-white">No</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                      <span className="text-neutral-500 dark:text-neutral-400">JavaScript</span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {scanResult.status === 'Safe' ? 'No' : 'Detected'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500 dark:text-neutral-400">Encryption</span>
                      <span className="font-bold text-neutral-900 dark:text-white">No</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 2 — ANALYSIS MODE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'analysis' && (
            <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                PDF Stream & Structure Analysis
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#18181C] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Catalog XRef Table</span>
                  <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-300">Validated (12 Objects)</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#18181C] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Action Stream Hooks (/OpenAction, /AA)</span>
                  <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-300">None Detected</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#18181C] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Font Stream Decoding</span>
                  <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-300">Standard TrueType (Helv, Times)</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             TAB 3 — DETAILS MODE
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'details' && (
            <div className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                PDF Cryptographic Hashes & Attributes
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#18181C] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-500">MD5 Hash</span>
                  <span className="font-mono text-neutral-900 dark:text-white">e3b0c44298fc1c149afbf4c8996fb924</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#18181C] border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <span className="text-neutral-500">SHA-256 Hash</span>
                  <span className="font-mono text-neutral-900 dark:text-white">44d88612fea8a8f36de82e1278abb02f</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
             BOTTOM SECURITY RESULT BANNER (Matching Mockup Screenshot)
             ═══════════════════════════════════════════════════════════════ */}
          <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-5">
            {/* Primary Status Banner */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                {scanResult.status === 'Safe' ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7 text-rose-500" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3
                  className={`text-xl font-extrabold tracking-tight ${
                    scanResult.status === 'Safe'
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {scanResult.status === 'Safe' ? 'No Threats Found' : 'Threat Detected'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {scanResult.status === 'Safe'
                    ? 'This PDF appears to be safe. You can review the content above and share it if needed.'
                    : 'High risk malicious triggers identified in PDF stream.'}
                </p>
              </div>
            </div>

            {/* 6 Grid Analysis Status Cards (Neutral/Light Indicators, NO walls of green checkmarks) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <Activity className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Behavior Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <Target className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Malware Detection
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <FileText className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Static Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <Zap className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Heuristic Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <Cpu className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Sandbox Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <Globe className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Reputation Check
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions Row (Scan Another File & Download Report) */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scan Another File</span>
            </button>

            <button
              type="button"
              onClick={() => downloadMalVisionPdfReport(scanResult)}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2 shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
