export type ThemeMode = 'light' | 'dark' | 'system';

export type ScannerTabId = 'file-scan' | 'preview-file' | 'pdf-inspector' | 'url-scan' | 'hash-analysis';

export type ThreatStatus = 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';

export interface FindingItem {
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  detail: string;
}

export interface ScanResultData {
  id: string;
  userEmail?: string;
  target: string;
  targetType: 'file' | 'pdf' | 'url' | 'hash';
  status: ThreatStatus;
  score: number; // 0 to 100
  summary: string;
  explanation: string;
  findings: FindingItem[];
  recommendedAction: string;
  timestamp: string;
  metadata?: {
    fileSize?: string;
    mimeType?: string;
    hashType?: string;
    ipAddress?: string;
    serverLocation?: string;
    sslCert?: string;
    pageCount?: number;
    javascriptDetected?: boolean;
    hiddenLayers?: boolean;
  };
}

export interface HistoricalScan {
  id: string;
  target: string;
  type: 'File' | 'PDF' | 'URL' | 'Hash';
  status: ThreatStatus;
  date: string;
}
