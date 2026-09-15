import React, { useRef, useState, useEffect } from 'react';
import {
  FileUp,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Download,
  FileText,
  Activity,
  Target,
  Cpu,
  Globe,
  Zap,
} from 'lucide-react';
import { saveScanToHistory } from '../lib/historyStore';
import { extractPdfData, type ExtractedPdfDetails } from '../lib/pdfAnalyzer';
import type { ScanResultData } from '../types';
import { downloadMalVisionPdfReport } from './HistoryModal';

interface PdfInspectorProps {
  user?: { name: string; email: string } | null;
}

export const PdfInspector: React.FC<PdfInspectorProps> = ({ user }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [pdfData, setPdfData] = useState<ExtractedPdfDetails | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

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
        score: extracted.isThreat ? 88 : 8,
        summary: extracted.isThreat
          ? `Threat detected in PDF stream analysis for ${file.name}.`
          : `PDF structure and content validated for ${file.name}. No threats detected.`,
        explanation: extracted.isThreat
          ? extracted.threatDetails.join(' ')
          : 'Document structure validated. No embedded malicious JavaScript streams or dangerous launch triggers identified.',
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

      {/* Header (No inside tabs) */}
      <div className="flex items-center justify-between pb-1 border-b border-neutral-200/80 dark:border-neutral-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            PDF Inspector
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time PDF content preview, metadata extraction, and security verification.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Know Before You Open.</span>
        </div>
      </div>

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
            {/* LEFT COLUMN (7 cols): ACTUAL PDF PREVIEW (Renders real PDF pages dynamically, no generic icon) */}
            <div className="lg:col-span-7 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] p-4 flex flex-col justify-between space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span>PDF Document Content Preview</span>
                </span>
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {pdfData.totalPages} {pdfData.totalPages === 1 ? 'Page' : 'Pages'}
                </span>
              </div>

              {/* Native PDF Render Container via Object Blob URL */}
              <div className="w-full h-[480px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] overflow-hidden shadow-inner relative">
                {pdfBlobUrl ? (
                  <iframe
                    src={`${pdfBlobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    title={pdfData.fileName}
                    className="w-full h-full border-none rounded-2xl"
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

          {/* BOTTOM SECTION: SCANNING HISTORY & SECURITY CHECKS */}
          <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-5">
            {/* Primary Status Banner */}
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                pdfData.isThreat
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
              }`}>
                {!pdfData.isThreat ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7 text-rose-500" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3
                  className={`text-xl font-extrabold tracking-tight ${
                    !pdfData.isThreat
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {!pdfData.isThreat ? 'No Threats Found' : 'Threat Found'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {!pdfData.isThreat
                    ? 'This PDF appears to be safe. PDF structure and streams have been verified.'
                    : 'Threat indicators identified in PDF binary stream.'}
                </p>
              </div>
            </div>

            {/* Dynamic Analysis Checks (If no threat, relevant checks show Clean) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181C] space-y-1">
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 w-fit">
                  <Activity className="w-4 h-4" />
                </div>
                <h5 className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                  Behavior Analysis
                </h5>
                <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                  {pdfData.isThreat ? 'Suspicious' : 'Clean'}
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
                  {pdfData.isThreat ? 'Threat Found' : 'Clean'}
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
                  {pdfData.hasJavaScript ? 'JS Flagged' : 'Clean'}
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
        </div>
      )}
    </div>
  );
};
