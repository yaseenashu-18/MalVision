import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, FileCheck, Shield, AlertTriangle } from 'lucide-react';
import { analyzePdf } from '../lib/scanEngine';
import { saveScanToHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import { ScanResult } from './ScanResult';

interface PdfInspectorProps {
  user?: { name: string; email: string } | null;
}

export const PdfInspector: React.FC<PdfInspectorProps> = ({ user }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processPdf(files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processPdf(e.dataTransfer.files[0]);
    }
  };

  const processPdf = async (file: File) => {
    setIsScanning(true);
    try {
      const res = await analyzePdf(file);
      saveScanToHistory(res, user?.email);
      setScanResult(res);
    } finally {
      setIsScanning(false);
    }
  };

  if (scanResult) {
    return <ScanResult result={scanResult} onNewScan={() => setScanResult(null)} />;
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className="w-full h-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 bg-neutral-50/40 dark:bg-neutral-800/20 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 select-none group"
    >
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handlePdfChange}
        className="hidden"
      />

      {isScanning ? (
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-10 h-10 text-neutral-800 dark:text-neutral-200 animate-spin" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Deconstructing PDF streams & JavaScript triggers...</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 shadow-xs">
            <FileSpreadsheet className="w-8 h-8 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
          </div>

          <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
            Drop your PDF document here
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            or click to browse PDF files
          </p>

          <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Stream Analysis</span>
            </span>
            <span className="flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>JS Action Triggers</span>
            </span>
            <span className="flex items-center space-x-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Font Objects</span>
            </span>
          </div>

          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4">
            Inspect PDFs safely before opening in Acrobat or browser previewers
          </p>
        </>
      )}
    </div>
  );
};
