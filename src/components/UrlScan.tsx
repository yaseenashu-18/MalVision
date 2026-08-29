import React, { useState } from 'react';
import { Link as LinkIcon, Loader2, Globe, Search } from 'lucide-react';
import { analyzeUrl } from '../lib/scanEngine';
import { saveScanToHistory } from '../lib/historyStore';
import type { ScanResultData } from '../types';
import { ScanResult } from './ScanResult';

interface UrlScanProps {
  user?: { name: string; email: string } | null;
}

export const UrlScan: React.FC<UrlScanProps> = ({ user }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsScanning(true);
    try {
      const res = await analyzeUrl(inputUrl);
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
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Tracing URL redirects & checking SSL certificates...</p>
        </div>
      ) : (
        <form onSubmit={handleScan} className="w-full max-w-lg space-y-6">
          <div className="w-14 h-14 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto shadow-xs">
            <Globe className="w-7 h-7 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
              Inspect suspicious URL or Link
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Verify links for phishing attempts, malicious redirects, and credential traps.
            </p>
          </div>

          <div className="relative flex items-center">
            <LinkIcon className="w-5 h-5 absolute left-4 text-neutral-400" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-12 pr-32 py-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
              required
            />
            <button
              type="submit"
              className="absolute right-1.5 px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Scan URL</span>
            </button>
          </div>

          {/* Quick sample chips */}
          <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500">
            <span>Try sample:</span>
            <button
              type="button"
              onClick={() => setInputUrl('https://example.com')}
              className="underline hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              https://example.com
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setInputUrl('https://phish-secure-login-verify.com')}
              className="underline hover:text-neutral-900 dark:hover:text-white cursor-pointer text-amber-600 dark:text-amber-400"
            >
              Suspicious URL
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
