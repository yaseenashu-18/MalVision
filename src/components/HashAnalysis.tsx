import React, { useState } from 'react';
import { Hash, Loader2, Search, Cpu } from 'lucide-react';
import { analyzeHash, identifyHashType } from '../lib/scanEngine';
import { saveScanToHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import { ScanResult } from './ScanResult';

interface HashAnalysisProps {
  user?: { name: string; email: string } | null;
}

export const HashAnalysis: React.FC<HashAnalysisProps> = ({ user }) => {
  const [inputHash, setInputHash] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);

  const detectedType = identifyHashType(inputHash);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHash.trim()) return;

    setIsScanning(true);
    try {
      const res = await analyzeHash(inputHash);
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
    <div className="w-full h-full border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-neutral-50/40 dark:bg-neutral-800/20">
      {isScanning ? (
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-10 h-10 text-neutral-800 dark:text-neutral-200 animate-spin" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Querying threat intelligence database for hash reputation...</p>
        </div>
      ) : (
        <form onSubmit={handleScan} className="w-full max-w-lg space-y-6">
          <div className="w-14 h-14 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto shadow-xs">
            <Hash className="w-7 h-7 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              Cryptographic Hash Threat Lookup
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Supports MD5, SHA-1, and SHA-256 formats to cross-reference threat intelligence feeds.
            </p>
          </div>

          <div className="relative flex items-center">
            <Cpu className="w-5 h-5 absolute left-4 text-neutral-400" />
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb924..."
              className="w-full pl-12 pr-32 py-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              required
            />
            <button
              type="submit"
              className="absolute right-1.5 px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup</span>
            </button>
          </div>

          {/* Detected Format Badge & Sample Hashes */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <span className="flex items-center space-x-1.5">
              <span>Detected Algorithm:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                detectedType !== 'Unknown' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}>
                {detectedType}
              </span>
            </span>

            <div className="flex items-center space-x-2">
              <span className="text-neutral-400">Sample:</span>
              <button
                type="button"
                onClick={() => setInputHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                className="underline hover:text-neutral-900 dark:hover:text-white cursor-pointer font-mono text-[10px]"
              >
                Malicious SHA-256
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
