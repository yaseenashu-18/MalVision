import React, { useState } from 'react';
import { Link as LinkIcon, Loader2, Globe, Search, AlertCircle } from 'lucide-react';
import type { StandardURLScanResult, ScanStageStatus } from '../types/urlScanner';
import { performUrlScan } from '../lib/urlScannerApi';
import { UrlScanResult } from './UrlScanResult';

interface UrlScanProps {
  user?: { name: string; email: string } | null;
}

export const UrlScan: React.FC<UrlScanProps> = ({ user: _user }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<{ stage: ScanStageStatus; message: string }>({
    stage: 'validating',
    message: 'Initializing MALVISION URL Engine...',
  });
  const [scanResult, setScanResult] = useState<StandardURLScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScan = async (urlToScan?: string) => {
    const target = urlToScan || inputUrl;
    if (!target.trim()) return;

    setIsScanning(true);
    setErrorMsg(null);
    setScanResult(null);

    try {
      const result = await performUrlScan(target, (stage, message) => {
        setScanStage({ stage, message });
      });

      if (result.scan_status === 'failed' && result.errors.length > 0) {
        setErrorMsg(result.errors[0]);
      } else {
        setScanResult(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Scan failed to complete due to a network anomaly.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan();
  };

  if (scanResult) {
    return (
      <UrlScanResult
        result={scanResult}
        onNewScan={() => {
          setScanResult(null);
          setErrorMsg(null);
        }}
        onRescan={() => handleScan(scanResult.url)}
      />
    );
  }

  return (
    <div className="w-full h-full border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-neutral-50/40 dark:bg-neutral-800/20 transition-all">
      {isScanning ? (
        <div className="w-full max-w-md space-y-6 py-8">
          <div className="relative w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-neutral-900 dark:text-white animate-spin" />
            <Globe className="w-4 h-4 text-neutral-700 dark:text-neutral-300 absolute" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              MALVISION Stream Analysis
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono animate-pulse">
              {scanStage.message}
            </p>
          </div>

          {/* Dynamic Stage Indicator */}
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-neutral-900 dark:bg-white h-1.5 rounded-full animate-pulse w-3/4 transition-all duration-300" />
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px] text-neutral-400 font-mono">
            <span className={scanStage.stage === 'validating' ? 'text-neutral-900 dark:text-white font-bold' : ''}>VALIDATE</span>
            <span className={scanStage.stage === 'resolving' ? 'text-neutral-900 dark:text-white font-bold' : ''}>RESOLVE</span>
            <span className={scanStage.stage === 'reputation' ? 'text-neutral-900 dark:text-white font-bold' : ''}>INTEL</span>
            <span className={scanStage.stage === 'security' || scanStage.stage === 'building' ? 'text-neutral-900 dark:text-white font-bold' : ''}>REPORT</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="w-full max-w-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto shadow-xs">
            <Globe className="w-8 h-8 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              Advanced URL Scanner
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              Scan links for phishing traps, brand impersonation, malware payloads, SSL risks, and malicious redirects.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-neutral-700 dark:text-neutral-300" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="relative flex items-center">
            <LinkIcon className="w-5 h-5 absolute left-4 text-neutral-400" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste link to scan (e.g. https://example.com)"
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
        </form>
      )}
    </div>
  );
};
