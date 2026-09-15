import type { StandardURLScanResult, ScanStageStatus } from '../types/urlScanner';
import type { ScanResultData, ThreatStatus } from '../types';
import { executeStandardURLScan } from './urlScanEngine';
import { saveScanToHistory } from './historyStore';

/**
 * Converts StandardURLScanResult into legacy ScanResultData for history store compatibility
 */
export function convertToScanResultData(urlScan: StandardURLScanResult): ScanResultData {
  let status: ThreatStatus = 'Safe';
  if (urlScan.overall_verdict === 'malicious') {
    status = 'Malicious';
  } else if (urlScan.overall_verdict === 'phishing' || urlScan.overall_verdict === 'scam' || urlScan.overall_verdict === 'suspicious') {
    status = 'Suspicious';
  } else if (urlScan.overall_verdict === 'unknown' || urlScan.overall_verdict === 'inconclusive') {
    status = 'Unknown';
  }

  const findings = [
    ...urlScan.verdict_reasons.map((r) => ({
      type: (status === 'Malicious' ? 'danger' : status === 'Suspicious' ? 'warning' : 'info') as 'danger' | 'warning' | 'info' | 'success',
      title: 'Verdict Reason',
      detail: r,
    })),
    ...urlScan.positive_indicators.map((p) => ({
      type: 'success' as const,
      title: 'Positive Indicator',
      detail: p,
    })),
  ];

  return {
    id: urlScan.scan_id,
    target: urlScan.url,
    targetType: 'url',
    status,
    score: urlScan.risk_score,
    summary: urlScan.sections.verdict_summary.summary_text,
    explanation: urlScan.sections.ai_security_summary.summary_text,
    findings,
    recommendedAction: urlScan.sections.ai_security_summary.recommendation_verdict,
    timestamp: urlScan.scan_completed_at,
    createdAt: urlScan.scan_completed_at,
    metadata: {
      ipAddress: urlScan.sections.ip_infrastructure.ipv4 || undefined,
      serverLocation: `${urlScan.sections.ip_infrastructure.city || ''}, ${urlScan.sections.ip_infrastructure.country || ''}`.trim() || undefined,
      sslCert: urlScan.sections.ssl_tls.issuer || undefined,
    },
  };
}

/**
 * Executes a full URL scan and saves to history store
 */
export async function performUrlScan(
  url: string,
  onProgress?: (stage: ScanStageStatus, message: string) => void
): Promise<StandardURLScanResult> {
  const result = await executeStandardURLScan(url, onProgress);
  
  // Save to unified history store
  if (result.scan_status === 'completed') {
    const legacyResult = convertToScanResultData(result);
    await saveScanToHistory(legacyResult);
  }

  return result;
}

/**
 * Preset sample URLs for one-click testing
 */
export const SAMPLE_URLS = [
  {
    label: 'Clean Domain (Google)',
    url: 'https://google.com',
    type: 'safe',
  },
  {
    label: 'Phishing Test (PayPal Spoof)',
    url: 'http://paypal.login-verify-account.sec-auth.xyz/signin',
    type: 'phishing',
  },
  {
    label: 'Malware Payload Test',
    url: 'https://malware-payload.example-test.org/download/payload.exe',
    type: 'malicious',
  },
  {
    label: 'Shortened Link',
    url: 'https://bit.ly/3xYz900-test',
    type: 'suspicious',
  },
];
