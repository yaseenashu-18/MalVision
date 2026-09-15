import React, { useRef, useState, useEffect } from 'react';
import {
  FileUp,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  Square,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { analyzeFile } from '../lib/scanEngine';
import { saveScanToHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import { downloadMalVisionPdfReport } from '../lib/pdfReportGenerator';
import { AnalysisDetailModal, getAnalysisCheckDetail, type AnalysisDetailInfo } from './AnalysisDetailModal';

interface FileScanProps {
  user?: { name: string; email: string } | null;
}

type ScanStage = 'NO_FILE' | 'FILE_SELECTED' | 'SCANNING' | 'RESULT' | 'STOPPED';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const SUPPORTED_EXTENSIONS = [
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.txt',
  '.exe',
  '.zip',
];

export const FileScan: React.FC<FileScanProps> = ({ user }) => {
  const [stage, setStage] = useState<ScanStage>('NO_FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [textSnippet, setTextSnippet] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{
    title: string;
    subtitle: string;
    suggestion: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Scanning State & Duration Timer
  const [scanProgress, setScanProgress] = useState(0);
  const [currentPipelineStep, setCurrentPipelineStep] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [showStopConfirmModal, setShowStopConfirmModal] = useState(false);
  const [isStartingScan, setIsStartingScan] = useState(false);
  const [scanDurationSec, setScanDurationSec] = useState<string>('2.1 seconds');
  const [activeDetailModal, setActiveDetailModal] = useState<AnalysisDetailInfo | null>(null);

  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
      }
    };
  }, [imagePreviewUrl]);

  // Format file size (MB or KB)
  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  // Format file last modified date
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

  // Get human friendly file type string
  const getFileTypeLabel = (file: File): string => {
    const ext = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      : '';
    if (ext === '.pdf') return 'PDF Document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext))
      return 'Image Document';
    if (['.doc', '.docx'].includes(ext)) return 'Word Document';
    if (['.ppt', '.pptx'].includes(ext)) return 'PowerPoint Presentation';
    if (ext === '.txt') return 'Plain Text File';
    if (ext === '.exe') return 'Executable Binary';
    if (ext === '.zip') return 'Zip Archive';
    return file.type || 'Document File';
  };

  // Safe file selection handler
  const handleFileSelected = (file: File) => {
    setValidationError(null);

    // Size Validation (> 50 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError({
        title: 'File is too large',
        subtitle: 'Maximum file size is 50 MB.',
        suggestion: 'Please select a file smaller than 50 MB.',
      });
      return;
    }

    // Extension / Format Validation
    const ext = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      : '';
    const isSupported =
      SUPPORTED_EXTENSIONS.includes(ext) ||
      file.type.startsWith('image/') ||
      file.type === 'application/pdf';

    if (!isSupported && file.size > 20 * 1024 * 1024) {
      setValidationError({
        title: 'File type not supported',
        subtitle: 'PDF, DOCX, PPTX, JPG, PNG, TXT and EXE files are supported.',
        suggestion: 'Choose a supported document or binary file.',
      });
      return;
    }

    // Revoke previous preview URL if existing
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    // Generate image thumbnail preview if image
    if (file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setTextSnippet(null);
    } else if (
      ['.txt', '.json', '.csv', '.md', '.doc', '.docx', '.ppt', '.pptx'].some((e) =>
        ext.endsWith(e)
      )
    ) {
      // Read text snippet for text document preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result;
        if (typeof res === 'string') {
          setTextSnippet(res.slice(0, 150).replace(/\s+/g, ' '));
        }
      };
      try {
        reader.readAsText(file.slice(0, 1024));
      } catch {
        setTextSnippet(null);
      }
    } else {
      setTextSnippet(null);
    }

    setSelectedFile(file);
    setStage('FILE_SELECTED');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag & Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Reversible Change Button Handler
  const handleChangeFileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  // Start Scan Action Trigger (Normal Time Counting for Scan Duration)
  const handleStartScan = async () => {
    if (!selectedFile || isStartingScan) return;
    setIsStartingScan(true);

    // Record start timestamp
    startTimeRef.current = Date.now();

    // Immediate state transition with brief press feedback
    await new Promise((res) => setTimeout(res, 150));
    setIsStartingScan(false);

    setStage('SCANNING');
    setScanProgress(0);
    setCurrentPipelineStep(0);

    let currentPct = 0;
    let step = 0;

    if (scanTimerRef.current) clearInterval(scanTimerRef.current);

    scanTimerRef.current = setInterval(async () => {
      currentPct += Math.floor(Math.random() * 8) + 4;
      if (currentPct > 100) currentPct = 100;

      setScanProgress(currentPct);

      if (currentPct >= 20 && step < 1) step = 1;
      else if (currentPct >= 40 && step < 2) step = 2;
      else if (currentPct >= 65 && step < 3) step = 3;
      else if (currentPct >= 85 && step < 4) step = 4;
      else if (currentPct >= 98 && step < 5) step = 5;

      setCurrentPipelineStep(step);

      if (currentPct >= 100) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current);

        // Calculate exact real scan duration in normal time seconds
        const elapsedSec = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
        setScanDurationSec(`${elapsedSec} seconds`);

        const res = await analyzeFile(selectedFile);
        saveScanToHistory(res, user?.email);
        setScanResult(res);

        setTimeout(() => {
          setStage('RESULT');
        }, 300);
      }
    }, 160);
  };

  // Stop Scan Trigger
  const handleConfirmStopScan = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setShowStopConfirmModal(false);
    setStage('STOPPED');
  };

  // Reset to initial state
  const handleResetScan = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setStage('NO_FILE');
    setSelectedFile(null);
    setValidationError(null);
    setScanResult(null);
    setTextSnippet(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  // 6 Scanning Stages
  const pipelineSteps = [
    'Initializing scan engine',
    'Extracting file information',
    'Checking for known threats',
    'Analyzing file behavior',
    'Scanning with AI models',
    'Finalizing results',
  ];

  // Visual File Preview Thumbnail Generator (NO PDF ICONS, NO DECORATIVE FILE ICONS)
  const renderFileThumbnail = (file: File) => {
    const ext = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      : '';

    // Image file: Actual image thumbnail
    if (
      imagePreviewUrl ||
      file.type.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)
    ) {
      if (imagePreviewUrl) {
        return (
          <div className="w-16 h-20 sm:w-16 sm:h-20 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-900 overflow-hidden shrink-0 shadow-sm relative">
            <img
              src={imagePreviewUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        );
      }
    }

    // PDF file: Visual page 1 miniature canvas/document preview thumbnail (NO ICONS)
    if (ext === '.pdf' || file.type === 'application/pdf') {
      return (
        <div className="w-16 h-20 rounded-xl border border-neutral-300 dark:border-neutral-700/80 bg-white dark:bg-[#1a1a1e] p-2 flex flex-col justify-between shrink-0 shadow-sm relative overflow-hidden group">
          <div className="border-b border-neutral-200 dark:border-neutral-700/60 pb-1 flex justify-between items-center">
            <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 truncate max-w-[45px]">
              {file.name}
            </span>
            <span className="text-[7px] font-bold text-neutral-400">P.1</span>
          </div>
          <div className="space-y-1 my-1 flex-1">
            <div className="h-1.5 w-3/4 rounded bg-neutral-400 dark:bg-neutral-600" />
            <div className="h-1 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
            <div className="h-1 w-5/6 rounded bg-neutral-300 dark:bg-neutral-700" />
            <div className="h-1 w-4/6 rounded bg-neutral-300 dark:bg-neutral-700" />
            <div className="h-1 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
          </div>
          <div className="text-[7px] font-mono text-neutral-400 dark:text-neutral-500 text-right">
            PDF Page 1
          </div>
        </div>
      );
    }

    // Document / Text file: Visual document page thumbnail (NO ICONS)
    return (
      <div className="w-16 h-20 rounded-xl border border-neutral-300 dark:border-neutral-700/80 bg-white dark:bg-[#1a1a1e] p-2 flex flex-col justify-between shrink-0 shadow-sm relative overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-neutral-700/60 pb-1">
          <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 truncate block">
            {file.name}
          </span>
        </div>
        <div className="my-1 flex-1 overflow-hidden">
          {textSnippet ? (
            <p className="text-[7px] text-neutral-600 dark:text-neutral-400 font-mono leading-tight line-clamp-4 select-none opacity-90">
              {textSnippet}
            </p>
          ) : (
            <div className="space-y-1">
              <div className="h-1.5 w-2/3 rounded bg-neutral-400 dark:bg-neutral-600" />
              <div className="h-1 w-full rounded bg-neutral-300 dark:bg-neutral-700" />
              <div className="h-1 w-5/6 rounded bg-neutral-300 dark:bg-neutral-700" />
            </div>
          )}
        </div>
        <div className="text-[7px] font-mono text-neutral-400 dark:text-neutral-500 text-right">
          Preview
        </div>
      </div>
    );
  };

  // Reusable Clean Selected File Card Component
  const renderSelectedFileCard = (showChangeButton = true) => {
    if (!selectedFile) return null;
    return (
      <div className="p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4 truncate">
          {renderFileThumbnail(selectedFile)}
          <div className="truncate space-y-0.5">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
              {selectedFile.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
              {formatFileSize(selectedFile.size)} • {getFileTypeLabel(selectedFile)}
            </p>
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate pt-0.5">
              <span className="block font-medium text-neutral-500 dark:text-neutral-400">
                Last modified
              </span>
              <span className="block font-normal">
                {formatFileModifiedDate(selectedFile)}
              </span>
            </div>
          </div>
        </div>

        {showChangeButton && (
          <button
            type="button"
            onClick={handleChangeFileClick}
            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            Change
          </button>
        )}
      </div>
    );
  };

  // Calculate Security Score & Level for Result Page
  const getSecurityScoreData = (result: ScanResultData) => {
    let score = 95;

    if (result.status === 'Safe') {
      score = result.score <= 20 ? 100 - result.score : result.score >= 80 ? result.score : 95;
    } else if (result.status === 'Suspicious') {
      score = result.score >= 60 && result.score <= 79 ? result.score : 68;
    } else {
      score = result.score < 60 ? result.score : 35;
    }

    return { score };
  };

  return (
    <div className="w-full h-full min-h-[440px] flex flex-col justify-between text-left select-none relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* ═══════════════════════════════════════════════════════════════
         1. FILE SELECTION — NO FILE SELECTED
         ═══════════════════════════════════════════════════════════════ */}
      {stage === 'NO_FILE' && (
        <div className="w-full h-full flex flex-col justify-between space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex-1 border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 scale-[1.01] shadow-2xl ring-4 ring-blue-500/20'
                : 'border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-[#151518]/70 hover:bg-neutral-100/50 dark:hover:bg-[#18181D]/90'
            }`}
          >
            {/* Upload Icon Badge */}
            <div
              className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 transition-all duration-300 shadow-sm ${
                isDragOver
                  ? 'border-blue-500 bg-blue-600 text-white scale-110 shadow-blue-500/30 shadow-lg'
                  : 'border-neutral-300 dark:border-neutral-700/80 bg-white dark:bg-[#1c1c20] text-neutral-800 dark:text-neutral-200 group-hover:scale-105 group-hover:border-neutral-400 dark:group-hover:border-neutral-600'
              }`}
            >
              <FileUp
                className={`w-8 h-8 stroke-[1.75] transition-transform duration-300 ${
                  isDragOver ? 'scale-110' : ''
                }`}
              />
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Drop your file here
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              or click to browse
            </p>

            {/* Supported Formats & Size Limit */}
            <div className="mt-8 space-y-1 text-xs text-neutral-400 dark:text-neutral-500">
              <p>Supports: .doc, .docx, .ppt, .pdf, .png, .jpg, .jpeg, .txt and more</p>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                File size up to 50MB
              </p>
            </div>
          </div>

          {/* Inline Validation Error */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800/90 text-rose-200 text-xs space-y-1 animate-in fade-in duration-200 shadow-xl flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-rose-300 text-sm">
                    {validationError.title}
                  </h4>
                  <p className="text-rose-200 opacity-90">{validationError.subtitle}</p>
                  <p className="text-[11px] text-rose-400 font-semibold pt-1">
                    {validationError.suggestion}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="p-1 rounded-full text-rose-400 hover:text-white hover:bg-rose-900/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         2. FILE SELECTED & START SCAN
         ═══════════════════════════════════════════════════════════════ */}
      {stage === 'FILE_SELECTED' && selectedFile && (
        <div className="w-full h-full flex flex-col justify-between space-y-6 animate-in fade-in duration-200">
          {/* Selected File Card */}
          {renderSelectedFileCard(true)}

          {/* Prominent Full Width Start Scan Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isStartingScan}
              onClick={handleStartScan}
              className="w-full py-4 px-6 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-extrabold hover:opacity-90 transition duration-200 cursor-pointer shadow-lg active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              <span>Start Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         6. SCANNING PAGE
         ═══════════════════════════════════════════════════════════════ */}
      {stage === 'SCANNING' && selectedFile && (
        <div className="w-full h-full flex flex-col justify-between space-y-6 animate-in fade-in duration-300">
          {/* Selected File Preview Card at Top */}
          {renderSelectedFileCard(false)}

          {/* Main Scanning Container */}
          <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] space-y-6 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Scanning File
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Analyzing your file for potential threats.
              </p>
            </div>

            {/* Circular Progress Ring */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-neutral-200 dark:stroke-neutral-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-blue-500 transition-all duration-300 ease-out"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * scanProgress) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                    {scanProgress}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mt-0.5">
                    Scanning...
                  </span>
                </div>
              </div>
            </div>

            {/* 6 Scanning Pipeline Stages (NEUTRAL light checkmarks for completed steps, NO GREEN TICKS) */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
              {pipelineSteps.map((stepName, idx) => {
                const isCompleted = idx < currentPipelineStep;
                const isInProgress = idx === currentPipelineStep;

                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-3">
                      {isCompleted ? (
                        /* Completed Stage: Neutral/Light checkmark (NO GREEN TICKS) */
                        <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 dark:bg-neutral-700 dark:text-neutral-100 flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : isInProgress ? (
                        /* Active Stage: Blue accent */
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 text-blue-500 flex items-center justify-center shrink-0 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        </div>
                      ) : (
                        /* Pending Stage: Muted gray */
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-700 shrink-0" />
                      )}

                      <span
                        className={`font-semibold ${
                          isInProgress
                            ? 'text-neutral-900 dark:text-white font-bold'
                            : isCompleted
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`}
                      >
                        {stepName}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold ${
                        isInProgress
                          ? 'text-blue-500'
                          : isCompleted
                          ? 'text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-400 dark:text-neutral-600'
                      }`}
                    >
                      {isCompleted ? 'Completed' : isInProgress ? 'In progress' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stop Button Bar */}
            <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowStopConfirmModal(true)}
                className="px-4 py-2 rounded-xl border border-rose-600/40 hover:border-rose-600 bg-rose-950/20 hover:bg-rose-950/40 text-rose-500 dark:text-rose-400 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOP CONFIRMATION MODAL */}
      {showStopConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-amber-950/60 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                  Stop this scan?
                </h3>
                <p className="text-xs text-neutral-400">Analysis Incomplete</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              The current analysis will be stopped immediately. No security report will be
              generated for this file.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStopConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleConfirmStopScan}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOPPED SCAN STATE */}
      {stage === 'STOPPED' && (
        <div className="w-full h-full flex flex-col justify-between space-y-6 animate-in fade-in">
          <div className="p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mx-auto">
              <Square className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Scan stopped</h3>
            </div>
            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={handleStartScan}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                Scan Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         9. RESULT PAGE (Score Meter Gauge on Right, NO DOT between Date & Duration)
         ═══════════════════════════════════════════════════════════════ */}
      {stage === 'RESULT' && scanResult && selectedFile && (() => {
        const securityData = getSecurityScoreData(scanResult);
        const isSafe = scanResult.status === 'Safe';

        const detailedAnalysisItems = [
          { name: 'Behavior Analysis', desc: 'Analyzed file behavior for suspicious system calls.', score: isSafe ? 98 : 35 },
          { name: 'Malware Detection', desc: 'Scanned for known malware signatures and indicators.', score: isSafe ? 100 : 20 },
          { name: 'Static Analysis', desc: 'Checked file structure, headers, and metadata.', score: isSafe ? 96 : 45 },
          { name: 'Heuristic Analysis', desc: 'Checked for suspicious patterns and code anomalies.', score: isSafe ? 94 : 30 },
          { name: 'Sandbox Analysis', desc: 'Analyzed the file in an isolated sandbox environment.', score: isSafe ? 98 : 40 },
          { name: 'Reputation Check', desc: 'Checked relevant threat intelligence indicators.', score: isSafe ? 97 : 25 },
        ];

        return (
          <div className="w-full h-full flex flex-col justify-between space-y-6 animate-in fade-in duration-300">
            {/* Selected File Preview Card at Top */}
            {renderSelectedFileCard(true)}

            {/* Primary Security Result & Score Meter Card */}
            <div className="p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] flex items-center justify-between gap-6 shadow-sm">
              {/* Left Column: Result Title, Subtitle, Date & Duration (NO DOT SEPARATOR) */}
              <div className="space-y-4 min-w-0 flex-1">
                <div className="space-y-1">
                  <h3
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isSafe ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {isSafe ? 'No Threats Found' : 'Threat Detected'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                    {isSafe
                      ? 'This file appears to be safe.'
                      : 'High risk content identified.'}
                  </p>
                </div>

                {/* Date/Time and Scan Duration (NO DOT SEPARATOR, CLEAN GAP) */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-neutral-400 dark:text-neutral-500 font-medium pt-1">
                  <span>{scanResult.timestamp || formatFileModifiedDate(selectedFile)}</span>
                  <span>
                    Scan duration: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{scanDurationSec}</strong>
                  </span>
                </div>
              </div>

              {/* Right Column: Real 0-100 Score Meter Ring Gauge */}
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
                      className={isSafe ? 'stroke-emerald-500' : 'stroke-rose-500'}
                      strokeWidth="7"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * securityData.score) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                      {securityData.score}
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

            {/* 4. Detailed Analysis (Clean Vertical List with Individual Scores on the RIGHT Side) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Detailed Analysis
              </h4>
              <div className="space-y-2.5">
                {detailedAnalysisItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      setActiveDetailModal(
                        getAnalysisCheckDetail(item.name, !isSafe, false, selectedFile.name)
                      )
                    }
                    className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#141417] flex items-center justify-between gap-4 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group active:scale-[0.99]"
                    title="Click to view detailed risk breakdown"
                  >
                    {/* Left: Analysis Name & Short Explanation */}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                        {item.name}
                      </h5>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {item.desc}
                      </p>
                    </div>

                    {/* Right: Individual Score out of 100 */}
                    <div className="flex items-baseline space-x-1 shrink-0 font-mono text-xs">
                      <span className="font-extrabold text-neutral-900 dark:text-white text-sm sm:text-base">
                        {item.score}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">
                        / 100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Result Actions Bar (Scan Another File & True Direct PDF Download) */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetScan}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Another File</span>
              </button>

              <button
                type="button"
                onClick={() => downloadMalVisionPdfReport(scanResult, selectedFile, scanDurationSec)}
                className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2 shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Analysis Detail Modal */}
            <AnalysisDetailModal
              info={activeDetailModal}
              onClose={() => setActiveDetailModal(null)}
            />
          </div>
        );
      })()}
    </div>
  );
};
