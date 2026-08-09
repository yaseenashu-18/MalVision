import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { analyzeFile } from '../lib/scanEngine';
import { saveScanToHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import { ScanResult } from './ScanResult';

export const FileScan: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsScanning(true);
    try {
      const res = await analyzeFile(file);
      saveScanToHistory(res);
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
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {isScanning ? (
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-10 h-10 text-neutral-800 dark:text-neutral-200 animate-spin" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Analyzing binary structure...</p>
        </div>
      ) : (
        <>
          {/* File Upload Line Icon in Circle matching Image 2 */}
          <div className="w-16 h-16 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 shadow-xs">
            <div className="relative">
              <FileUp className="w-8 h-8 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
            Drop your file here
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            or click to browse
          </p>

          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-6 max-w-sm">
            Supports: .doc, .docx, .ppt, .pdf, .png, .jpg, .jpeg, .txt and more
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            File size up to <strong className="font-bold text-neutral-800 dark:text-neutral-200">50MB</strong>
          </p>
        </>
      )}
    </div>
  );
};
