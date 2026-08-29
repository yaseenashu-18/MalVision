import React from 'react';
import type { ScannerTabId } from '../types';
import { FileScan } from './FileScan';
import { PreviewFile } from './PreviewFile';
import { PdfInspector } from './PdfInspector';
import { UrlScan } from './UrlScan';
import { HashAnalysis } from './HashAnalysis';

interface ScannerViewportProps {
  activeTab: ScannerTabId;
}

export const ScannerViewport: React.FC<ScannerViewportProps> = ({ activeTab }) => {
  return (
    <div className="w-full min-h-[320px] sm:h-[360px] flex-1 relative overflow-y-auto mt-3 sm:mt-4">
      {activeTab === 'file-scan' && <FileScan />}
      {activeTab === 'preview-file' && <PreviewFile />}
      {activeTab === 'pdf-inspector' && <PdfInspector />}
      {activeTab === 'url-scan' && <UrlScan />}
      {activeTab === 'hash-analysis' && <HashAnalysis />}
    </div>
  );
};
