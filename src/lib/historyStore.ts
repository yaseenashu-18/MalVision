import type { ScanResultData } from '../types';
import { syncScanToMongoDB } from './mongoService';

const STORAGE_KEY = 'malvision_scan_history';

export const DEFAULT_HISTORY: ScanResultData[] = [
  {
    id: 'hist-1',
    target: 'invoice_2024_08.pdf',
    targetType: 'pdf',
    status: 'Safe',
    score: 8,
    summary: 'PDF Inspection complete for invoice_2024_08.pdf.',
    explanation: 'Document structure validated. No embedded JavaScript streams or hidden action triggers identified.',
    findings: [
      { type: 'success', title: 'Structure Validation', detail: 'Valid PDF cross-reference table.' }
    ],
    recommendedAction: 'PDF is clear of automated scripting risks.',
    timestamp: '10m ago',
    metadata: { fileSize: '1.4 MB', pageCount: 2 }
  },
  {
    id: 'hist-2',
    target: 'https://login-verify-account.net',
    targetType: 'url',
    status: 'Malicious',
    score: 95,
    summary: 'URL Inspection complete for https://login-verify-account.net',
    explanation: 'Deceptive site copy attempt detected. URL impersonates a financial service to harvest authentication credentials.',
    findings: [
      { type: 'danger', title: 'Credential Harvesting Pattern', detail: 'Brand impersonation score 98/100.' }
    ],
    recommendedAction: 'Do not visit this URL or submit any credentials.',
    timestamp: '1h ago',
    metadata: { ipAddress: '104.21.72.189', serverLocation: 'United States' }
  },
  {
    id: 'hist-3',
    target: 'e3b0c44298fc1c149afbf4c8996fb924...',
    targetType: 'hash',
    status: 'Malicious',
    score: 99,
    summary: 'SHA-256 Analysis complete for e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    explanation: 'High-confidence malware match. This SHA-256 corresponds to a documented ransomware payload.',
    findings: [
      { type: 'danger', title: 'Multi-AV Signature Match', detail: '58 of 70 security vendor engines flagged this hash.' }
    ],
    recommendedAction: 'Treat associated file as compromised. Isolate immediately.',
    timestamp: '3h ago',
    metadata: { hashType: 'SHA-256' }
  },
  {
    id: 'hist-4',
    target: 'financial_report_v2.docx',
    targetType: 'file',
    status: 'Suspicious',
    score: 68,
    summary: 'File analysis complete for financial_report_v2.docx (4.80 MB).',
    explanation: 'Embedded macro script detected inside document. Macros can automatically execute commands when opened.',
    findings: [
      { type: 'warning', title: 'Embedded Scripting', detail: 'VBA Macro stream detected in document structure.' }
    ],
    recommendedAction: 'Open only in isolated sandbox or plain text preview mode.',
    timestamp: '1d ago',
    metadata: { fileSize: '4.8 MB', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  }
];

export function getScanHistory(): ScanResultData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HISTORY));
      return DEFAULT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_HISTORY;
    const valid = parsed.filter(item => item && typeof item.target === 'string' && typeof item.id === 'string');
    return valid.length > 0 ? valid : DEFAULT_HISTORY;
  } catch (e) {
    console.error('Error reading scan history:', e);
    return DEFAULT_HISTORY;
  }
}

export function saveScanToHistory(scan: ScanResultData): ScanResultData[] {
  try {
    const current = getScanHistory();
    // Prepend new scan, avoiding exact ID duplicates
    const filtered = current.filter(item => item.id !== scan.id);
    const updated = [scan, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Sync scan record to MongoDB threat-detection database
    try {
      syncScanToMongoDB(scan);
    } catch (err) {
      console.warn('MongoDB sync notice:', err);
    }

    return updated;
  } catch (e) {
    console.error('Error saving scan to history:', e);
    return getScanHistory();
  }
}

export function removeScanFromHistory(id: string): ScanResultData[] {
  try {
    const current = getScanHistory();
    const updated = current.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error removing scan from history:', e);
    return getScanHistory();
  }
}

export function clearScanHistory(): ScanResultData[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (e) {
    console.error('Error clearing scan history:', e);
    return [];
  }
}
