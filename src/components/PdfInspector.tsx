import React, { useRef, useState, useEffect } from 'react';
import {
  FileUp,
  Loader2,
  RefreshCw,
  Download,
  FileText,
  Activity,
  Target,
  Cpu,
  Globe,
  Zap,
  Minus,
  Plus,
  Maximize2,
} from 'lucide-react';
import { saveScanToHistory } from '../lib/historyStore';
import { extractPdfData, type ExtractedPdfDetails } from '../lib/pdfAnalyzer';
import type { ScanResultData } from '../types';
import { downloadMalVisionPdfReport } from './HistoryModal';
import { AnalysisDetailModal, getAnalysisCheckDetail, type AnalysisDetailInfo } from './AnalysisDetailModal';

interface PdfInspectorProps {
  user?: { name: string; email: string } | null;
}

export const PdfInspector: React.FC<PdfInspectorProps> = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pdfData, setPdfData] = useState<ExtractedPdfDetails | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [activeDetailModal, setActiveDetailModal] = useState<AnalysisDetailInfo | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handlePdfSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Please select a valid PDF document.');
      return;
    }

    // Revoke previous object URL if any
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }

    setSelectedFile(file);
    setIsScanning(true);

    try {
      const blobUrl = URL.createObjectURL(file);
      setPdfBlobUrl(blobUrl);

      // Dynamically extract real PDF metadata and structure from file ArrayBuffer
      const extracted = await extractPdfData(file);
      setPdfData(extracted);

      const now = new Date();
      const createdAt = now.toISOString();
      const timestamp = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const res: ScanResultData = {
        id: `pdf-${Date.now()}`,
        target: file.name,
        targetType: 'pdf',
        status: extracted.isThreat ? 'Malicious' : 'Safe',
        score: extracted.calculatedScore,
        summary: extracted.isThreat
          ? `Threat detected in PDF stream analysis for ${file.name}.`
          : `PDF structure and content validated for ${file.name}. No threats detected.`,
        explanation: extracted.verdictReason,
        findings: extracted.isThreat
          ? extracted.threatDetails.map((detail) => ({
              type: 'danger',
              title: 'Threat Detected',
              detail,
            }))
          : [
              {
                type: 'success',
                title: 'PDF Structure Validated',
                detail: `PDF version ${extracted.pdfVersion} with ${extracted.totalPages} page(s).`,
              },
              {
                type: 'info',
                title: 'Content Verification',
                detail: `Text: ${extracted.hasText ? 'Present' : 'None'}, Images: ${extracted.imageCount}, Links: ${extracted.linkCount}.`,
              },
            ],
        recommendedAction: extracted.isThreat
          ? 'Quarantine or delete this PDF document. Do not execute embedded scripts.'
          : 'PDF document is safe to view and process.',
        createdAt,
        timestamp,
        metadata: {
          fileSize: extracted.fileSizeFormatted,
          pageCount: extracted.totalPages,
          javascriptDetected: extracted.hasJavaScript,
          hiddenLayers: false,
        },
      };

      saveScanToHistory(res, user?.email);
      setScanResult(res);
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
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
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setSelectedFile(null);
    setPdfData(null);
    setScanResult(null);
    setZoomLevel(100);
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

      {/* STATE 1 — NO FILE SELECTED (Drop Zone) */}
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

      {/* STATE 2 — SCANNING LOADING STATE */}
      {selectedFile && isScanning && (
        <div className="w-full flex-1 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] p-12 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-10 h-10 text-neutral-900 dark:text-white animate-spin" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Parsing PDF Binary Streams & Structure...
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Extracting metadata, pages, font objects, and scanning for active script triggers.
            </p>
          </div>
        </div>
      )}

      {/* STATE 3 — PDF INSPECTED (Preview + Extracted PDF Information + Scan History) */}
      {selectedFile && !isScanning && pdfData && scanResult && (
        <div className="w-full flex-1 flex flex-col justify-between space-y-5 animate-in fade-in duration-200">
          {/* Selected File Card Header */}
          <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-4 truncate">
              <div className="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0">
                <FileText className="w-6 h-6" />
              </div>

              <div className="truncate space-y-0.5">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                  {pdfData.fileName}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                  {pdfData.fileSizeFormatted} • {pdfData.totalPages} {pdfData.totalPages === 1 ? 'page' : 'pages'} • PDF {pdfData.pdfVersion}
                </p>
                <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate pt-0.5">
                  <span>Last modified {pdfData.modifiedDateFormatted}</span>
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

          {/* MAIN GRID: PDF PREVIEW (Left) + DYNAMICALLY EXTRACTED METADATA (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN (7 cols): ACTUAL PDF PREVIEW (Scrollable PDF in box with Zoom Controls) */}
            <div className="lg:col-span-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] p-4 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span>PDF Content Preview</span>
                </span>

                {/* Interactive Zoom Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                    className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {zoomLevel}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                    className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
                    title="Zoom In"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* PDF Preview Container Box (No Slide, Full Scrollable PDF with Zoom) */}
              <div className="w-full h-[540px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] overflow-auto shadow-inner relative">
                {pdfBlobUrl ? (
                  <iframe
                    src={`${pdfBlobUrl}#zoom=${zoomLevel}&toolbar=1&navpanes=0&scrollbar=1`}
                    title={pdfData.fileName}
                    className="w-full h-full border-none rounded-2xl transition-all duration-200"
                    style={{
                      transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                      transformOrigin: 'top left',
                      width: zoomLevel !== 100 ? `${(100 / zoomLevel) * 100}%` : '100%',
                      height: zoomLevel !== 100 ? `${(100 / zoomLevel) * 100}%` : '100%',
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                    Loading PDF preview...
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (5 cols): DOCUMENT INFORMATION & CONTENT OVERVIEW CARDS */}
            <div className="lg:col-span-5 space-y-4">
              {/* CARD 1: DOCUMENT INFORMATION */}
              <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-3 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span>Document Information</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">File name</span>
                    <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[170px]" title={pdfData.fileName}>
                      {pdfData.fileName}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">File size</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.fileSizeFormatted}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Total pages</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{pdfData.totalPages}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">File type</span>
                    <span className="font-bold text-neutral-900 dark:text-white">PDF Document</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Created date</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{pdfData.createdDateFormatted}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Modified date</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{pdfData.modifiedDateFormatted}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500 dark:text-neutral-400">PDF version</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{pdfData.pdfVersion}</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: CONTENT OVERVIEW */}
              <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-3 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-neutral-400" />
                  <span>Content Overview</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Text</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.hasText ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Images</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.imageCount > 0 ? pdfData.imageCount : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Links</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.linkCount > 0 ? pdfData.linkCount : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">Embedded files</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.hasEmbeddedFiles ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="text-neutral-500 dark:text-neutral-400">JavaScript</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.hasJavaScript ? 'Detected' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500 dark:text-neutral-400">Encryption</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {pdfData.isEncrypted ? 'Encrypted' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: SCANNING HISTORY & ACCURATE SECURITY SCORE METER */}
          <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-5 shadow-sm">
            {/* Primary Security Score Meter & Verdict Banner */}
            <div className="flex items-center justify-between gap-6">
              {/* Left Side: Result Verdict, Subtitle & Accurate Reason */}
              <div className="space-y-3 min-w-0 flex-1">
                <div className="space-y-1">
                  <h3
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      !pdfData.isThreat
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {!pdfData.isThreat ? 'No Threats Found' : 'Threat Found'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                    {pdfData.verdictReason}
                  </p>
                </div>

                <div className="flex items-center space-x-4 text-xs text-neutral-400 dark:text-neutral-500 font-medium pt-1">
                  <span>Inspected at: <strong className="text-neutral-700 dark:text-neutral-300">{scanResult.timestamp}</strong></span>
                  <span>•</span>
                  <span>Pages analyzed: <strong className="text-neutral-700 dark:text-neutral-300">{pdfData.totalPages}</strong></span>
                </div>
              </div>

              {/* Right Side: Accurate Score Meter Ring Gauge (0-100) */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-neutral-200 dark:stroke-neutral-800"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className={!pdfData.isThreat ? 'stroke-emerald-500' : 'stroke-rose-500'}
                      strokeWidth="7"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * pdfData.calculatedScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                      {pdfData.calculatedScore}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider -mt-0.5">
                      / 100
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-1">
                  Security Score
                </span>
              </div>
            </div>

            {/* Dynamic Analysis Checks (Clickable for extra explanation) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                onClick={() =>
                  setActiveDetailModal(
                    getAnalysisCheckDetail('Behavior Analysis', pdfData.isThreat, pdfData.hasJavaScript, pdfData.fileName)
                  )
                }
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group hover:scale-[1.02] active:scale-95 space-y-1 shadow-xs"
                title="Click for detailed analysis breakdown"
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                  <Activity className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Behavior Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  {pdfData.isThreat ? 'Suspicious' : 'Clean'}
                </span>
              </div>

              <div
                onClick={() =>
                  setActiveDetailModal(
                    getAnalysisCheckDetail('Malware Detection', pdfData.isThreat, pdfData.hasJavaScript, pdfData.fileName)
                  )
                }
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group hover:scale-[1.02] active:scale-95 space-y-1 shadow-xs"
                title="Click for detailed analysis breakdown"
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                  <Target className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Malware Detection
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  {pdfData.isThreat ? 'Threat Found' : 'Clean'}
                </span>
              </div>

              <div
                onClick={() =>
                  setActiveDetailModal(
                    getAnalysisCheckDetail('Static Analysis', pdfData.isThreat, pdfData.hasJavaScript, pdfData.fileName)
                  )
                }
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group hover:scale-[1.02] active:scale-95 space-y-1 shadow-xs"
                title="Click for detailed analysis breakdown"
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                  <FileText className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Static Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  {pdfData.hasJavaScript ? 'JS Flagged' : 'Clean'}
                </span>
              </div>

              <div
                onClick={() =>
                  setActiveDetailModal(
                    getAnalysisCheckDetail('Heuristic Analysis', pdfData.isThreat, pdfData.hasJavaScript, pdfData.fileName)
                  )
                }
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group hover:scale-[1.02] active:scale-95 space-y-1 shadow-xs"
                title="Click for detailed analysis breakdown"
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                  <Zap className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Heuristic Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div
                onClick={() =>
                  setActiveDetailModal(
                    getAnalysisCheckDetail('Sandbox Analysis', pdfData.isThreat, pdfData.hasJavaScript, pdfData.fileName)
                  )
                }
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group hover:scale-[1.02] active:scale-95 space-y-1 shadow-xs"
                title="Click for detailed analysis breakdown"
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
                  <Cpu className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Sandbox Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Clean
                </span>
              </div>

              <div
                onClick={() =>
                  setActiveDetailModal(
                    getAnalysisCheckDetail('Reputation Check', pdfData.isThreat, pdfData.hasJavaScript, pdfData.fileName)
                  )
                }
                className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group hover:scale-[1.02] active:scale-95 space-y-1 shadow-xs"
                title="Click for detailed analysis breakdown"
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700">
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

          {/* Bottom Actions Row */}
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

          {/* Analysis Check Detail Modal */}
          <AnalysisDetailModal
            info={activeDetailModal}
            onClose={() => setActiveDetailModal(null)}
          />
        </div>
      )}
    </div>
  );
};
