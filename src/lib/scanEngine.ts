import type { ScanResultData, ThreatStatus, FindingItem } from '../types';

// Helper to determine hash algorithm
export function identifyHashType(hashStr: string): 'MD5' | 'SHA-1' | 'SHA-256' | 'Unknown' {
  const clean = hashStr.trim().toLowerCase();
  if (/^[a-f0-9]{32}$/.test(clean)) return 'MD5';
  if (/^[a-f0-9]{40}$/.test(clean)) return 'SHA-1';
  if (/^[a-f0-9]{64}$/.test(clean)) return 'SHA-256';
  return 'Unknown';
}

// Known threat sample hashes for realistic demo
const KNOWN_MALICIOUS_HASHES = new Set([
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  '44d88612fea8a8f36de82e1278abb02f',
  '207001000858e998782f9d7c0f00115a4d6f6e80',
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
]);

const KNOWN_SUSPICIOUS_HASHES = new Set([
  '098f6bcd4621d373cade4e832627b4f6',
  'a35472a3928a36b3e6e9f1a26d705c93a0b893dd',
  '11111111111111111111111111111111'
]);

// Simulated Scan Logic
export async function analyzeFile(file: File): Promise<ScanResultData> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  let status: ThreatStatus = 'Safe';
  let score = 5;
  let explanation = 'No suspicious characteristics or known malicious signatures were detected during binary structure analysis.';
  let recommendedAction = 'File appears clean. Proceed with standard caution.';

  const findings: FindingItem[] = [
    { type: 'success', title: 'Header Integrity', detail: 'File header matches expected structure.' },
    { type: 'info', title: 'Entropy Assessment', detail: 'Entropy score is within normal range (4.2 bits/byte).' }
  ];

  if (lowerName.endsWith('.exe') || lowerName.endsWith('.vbs') || lowerName.endsWith('.bat') || lowerName.includes('malware') || lowerName.includes('payload')) {
    status = 'Malicious';
    score = 92;
    explanation = 'High-risk executable pattern detected with anomalous PE headers and suspicious system call imports.';
    recommendedAction = 'Quarantine or isolate this file immediately. Do not execute.';
    findings.unshift(
      { type: 'danger', title: 'Suspicious Execution Flag', detail: 'File contains executable instructions or auto-run script hooks.' },
      { type: 'danger', title: 'Threat Intelligence Match', detail: 'Signature matches reported trojan dropper pattern.' }
    );
  } else if (lowerName.endsWith('.macro') || lowerName.includes('invoice_doc') || lowerName.includes('phish')) {
    status = 'Suspicious';
    score = 68;
    explanation = 'Embedded macro script detected inside document. Macros can automatically execute commands when opened.';
    recommendedAction = 'Open only in isolated sandbox or plain text preview mode.';
    findings.unshift(
      { type: 'warning', title: 'Embedded Scripting', detail: 'VBA Macro stream detected in document structure.' }
    );
  }

  return {
    id: `scan-${Date.now()}`,
    target: fileName,
    targetType: 'file',
    status,
    score,
    summary: `File analysis complete for ${fileName} (${sizeMb} MB).`,
    explanation,
    findings,
    recommendedAction,
    timestamp: new Date().toLocaleTimeString(),
    metadata: {
      fileSize: `${sizeMb} MB`,
      mimeType: file.type || 'application/octet-stream'
    }
  };
}

export async function analyzePdf(file: File): Promise<ScanResultData> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  let status: ThreatStatus = 'Safe';
  let score = 8;
  let explanation = 'Document structure validated. No embedded JavaScript streams or hidden action triggers identified.';
  let recommendedAction = 'PDF is clear of automated scripting risks.';

  const findings: FindingItem[] = [
    { type: 'success', title: 'Structure Validation', detail: 'Valid PDF cross-reference table and body xref objects.' },
    { type: 'info', title: 'Embedded Objects', detail: 'Standard font streams and vector paths.' }
  ];

  if (lowerName.includes('payload') || lowerName.includes('exploit') || lowerName.includes('invoice_fake')) {
    status = 'Malicious';
    score = 88;
    explanation = 'Critical threat identified: Embedded JavaScript `/AA` / `/OpenAction` trigger designed to initiate remote URI fetch upon opening.';
    recommendedAction = 'Do not open in PDF viewer. Delete or quarantine file.';
    findings.unshift(
      { type: 'danger', title: 'Automated Action Trigger', detail: 'Found /Launch and /JS action streams in Catalog.' },
      { type: 'danger', title: 'Hidden URI Callback', detail: 'Attempted connection to unverified external domain.' }
    );
  } else if (lowerName.includes('form') || lowerName.includes('bank') || lowerName.includes('verify')) {
    status = 'Suspicious';
    score = 54;
    explanation = 'PDF contains interactive form fields requesting credentials or personal information.';
    recommendedAction = 'Verify the source of this document before filling out any interactive fields.';
    findings.unshift(
      { type: 'warning', title: 'AcroForm Fields', detail: 'Contains 4 interactive text fields and submit form actions.' }
    );
  }

  return {
    id: `pdf-${Date.now()}`,
    target: fileName,
    targetType: 'pdf',
    status,
    score,
    summary: `PDF Inspection complete for ${fileName}.`,
    explanation,
    findings,
    recommendedAction,
    timestamp: new Date().toLocaleTimeString(),
    metadata: {
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      pageCount: Math.floor(Math.random() * 5) + 1,
      javascriptDetected: status !== 'Safe',
      hiddenLayers: false
    }
  };
}

export async function analyzeUrl(inputUrl: string): Promise<ScanResultData> {
  await new Promise(resolve => setTimeout(resolve, 800));

  let cleanUrl = inputUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  const lower = cleanUrl.toLowerCase();
  let status: ThreatStatus = 'Safe';
  let score = 2;
  let explanation = 'Domain reputation is verified. Valid SSL certificate, no malicious redirection or phishing indicators found.';
  let recommendedAction = 'Safe to navigate.';

  const findings: FindingItem[] = [
    { type: 'success', title: 'SSL Certificate Status', detail: 'TLS 1.3 encryption active, valid domain ownership.' },
    { type: 'info', title: 'Redirection Route', detail: 'Direct connection without intermediate hops.' }
  ];

  if (lower.includes('phish') || lower.includes('login-verify') || lower.includes('free-money') || lower.includes('claim-gift')) {
    status = 'Malicious';
    score = 95;
    explanation = 'Deceptive site copy attempt detected. URL impersonates a financial service to harvest authentication credentials.';
    recommendedAction = 'Do not visit this URL or submit any credentials.';
    findings.unshift(
      { type: 'danger', title: 'Credential Harvesting Pattern', detail: 'Brand impersonation score 98/100.' },
      { type: 'danger', title: 'Domain Reputation', detail: 'Domain created 2 days ago, flagged by 14 security feeds.' }
    );
  } else if (lower.includes('short') || lower.includes('bit.ly') || lower.includes('redirect')) {
    status = 'Suspicious';
    score = 48;
    explanation = 'Shortened URL hides final destination path. High risk of redirecting to untrusted third-party hosts.';
    recommendedAction = 'Expand destination URL before clicking.';
    findings.unshift(
      { type: 'warning', title: 'Opaque Redirect', detail: 'URL masking destination address.' }
    );
  }

  return {
    id: `url-${Date.now()}`,
    target: cleanUrl,
    targetType: 'url',
    status,
    score,
    summary: `URL Inspection complete for ${cleanUrl}`,
    explanation,
    findings,
    recommendedAction,
    timestamp: new Date().toLocaleTimeString(),
    metadata: {
      ipAddress: '104.21.72.189',
      serverLocation: 'United States',
      sslCert: 'Let\'s Encrypt RSA (Valid)'
    }
  };
}

export async function analyzeHash(hashInput: string): Promise<ScanResultData> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const cleanHash = hashInput.trim().toLowerCase();
  const hashType = identifyHashType(cleanHash);

  if (hashType === 'Unknown') {
    return {
      id: `hash-${Date.now()}`,
      target: hashInput,
      targetType: 'hash',
      status: 'Unknown',
      score: 0,
      summary: 'Unrecognized hash format.',
      explanation: 'The provided string does not match standard hexadecimal lengths for MD5 (32 chars), SHA-1 (40 chars), or SHA-256 (64 chars).',
      findings: [
        { type: 'info', title: 'Input Length', detail: `Length: ${hashInput.length} characters.` }
      ],
      recommendedAction: 'Please enter a valid MD5, SHA-1, or SHA-256 cryptographic hash string.',
      timestamp: new Date().toLocaleTimeString(),
      metadata: { hashType: 'Invalid' }
    };
  }

  let status: ThreatStatus = 'Safe';
  let score = 0;
  let explanation = 'No known malware samples or intelligence alerts match this hash in threat databases.';
  let recommendedAction = 'Hash lookup returned clean reputation indicators.';

  const findings: FindingItem[] = [
    { type: 'info', title: 'Algorithm Identified', detail: `Valid ${hashType} format.` },
    { type: 'success', title: 'Threat Intelligence Feeds', detail: 'Queried multi-engine hash index (0 positive matches).' }
  ];

  if (KNOWN_MALICIOUS_HASHES.has(cleanHash)) {
    status = 'Malicious';
    score = 99;
    explanation = `High-confidence malware match. This ${hashType} corresponds to a documented ransomware / remote access payload.`;
    recommendedAction = 'Treat any associated file as compromised. Isolate immediately.';
    findings.unshift(
      { type: 'danger', title: 'Multi-AV Signature Match', detail: '58 of 70 security vendor engines flagged this hash as malicious.' },
      { type: 'danger', title: 'Known Family', detail: 'Ransomware.Win32.WannaCry / Generic.Malware' }
    );
  } else if (KNOWN_SUSPICIOUS_HASHES.has(cleanHash)) {
    status = 'Suspicious';
    score = 62;
    explanation = `Hash matches a PUP (Potentially Unwanted Program) or adware utility.`;
    recommendedAction = 'Review application permissions and source before execution.';
    findings.unshift(
      { type: 'warning', title: 'Adware Classifier', detail: 'Flagged as riskware by 8 security vendors.' }
    );
  }

  return {
    id: `hash-${Date.now()}`,
    target: cleanHash,
    targetType: 'hash',
    status,
    score,
    summary: `${hashType} Analysis complete for ${cleanHash.substring(0, 16)}...`,
    explanation,
    findings,
    recommendedAction,
    timestamp: new Date().toLocaleTimeString(),
    metadata: {
      hashType
    }
  };
}
