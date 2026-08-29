import React from 'react';
import type { ScannerTabId } from '../types';
import { FileScan } from './FileScan';
import { PreviewFile } from './PreviewFile';
import { PdfInspector } from './PdfInspector';
import { UrlScan } from './UrlScan';
import { HashAnalysis } from './HashAnalysis';

interface ScannerViewportProps {
  activeTab: ScannerTabId;
  user?: { name: string; email: string } | null;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({ activeTab, user }) => {
  return (
    <div className="w-full min-h-[320px] sm:h-[360px] flex-1 relative overflow-y-auto mt-3 sm:mt-4">
      {activeTab === 'file-scan' && <FileScan user={user} />}
      {activeTab === 'preview-file' && <PreviewFile />}
      {activeTab === 'pdf-inspector' && <PdfInspector user={user} />}
      {activeTab === 'url-scan' && <UrlScan user={user} />}
      {activeTab === 'hash-analysis' && <HashAnalysis user={user} />}
    </div>
  );
};
