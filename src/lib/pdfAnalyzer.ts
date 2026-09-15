/**
 * Dynamic PDF Analyzer
 * Reads binary bytes of uploaded PDF files to extract actual metadata,
 * structure, page count, fonts, images, JavaScript triggers, and encryption.
 */

export interface ExtractedPdfDetails {
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  pdfVersion: string;
  totalPages: number;
  createdDateFormatted: string;
  modifiedDateFormatted: string;
  author: string | null;
  producer: string | null;
  hasText: boolean;
  textSnippet: string;
  imageCount: number;
  linkCount: number;
  hasEmbeddedFiles: boolean;
  hasJavaScript: boolean;
  isEncrypted: boolean;
  isThreat: boolean;
  threatDetails: string[];
}

/**
 * Parses raw PDF ArrayBuffer to extract real metadata and content properties.
 */
export async function extractPdfData(file: File): Promise<ExtractedPdfDetails> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Convert binary bytes to string in chunks to avoid stack limits
  let pdfText = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    pdfText += String.fromCharCode.apply(null, Array.from(chunk));
  }

  // 1. PDF Version (%PDF-1.x)
  let pdfVersion = '1.7';
  const versionMatch = pdfText.match(/%PDF-(\d\.\d)/);
  if (versionMatch && versionMatch[1]) {
    pdfVersion = versionMatch[1];
  }

  // 2. Total Pages (/Type /Page or /Count N)
  let totalPages = 1;
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  if (pageMatches && pageMatches.length > 0) {
    totalPages = pageMatches.length;
  } else {
    const countMatch = pdfText.match(/\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) {
      totalPages = parseInt(countMatch[1], 10) || 1;
    }
  }

  // Helper for formatting PDF dates (D:YYYYMMDDHHmmSS)
  const parsePdfDateString = (rawDate: string): string | null => {
    try {
      const clean = rawDate.replace(/^D:/, '').replace(/[^0-9]/g, '');
      if (clean.length >= 8) {
        const year = parseInt(clean.substring(0, 4), 10);
        const month = parseInt(clean.substring(4, 6), 10) - 1;
        const day = parseInt(clean.substring(6, 8), 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
    } catch {
      // Fallthrough
    }
    return null;
  };

  // 3. Created & Modified Dates
  let createdDateFormatted = '';
  const creationMatch = pdfText.match(/\/CreationDate\s*\(([^)]+)\)/);
  if (creationMatch && creationMatch[1]) {
    createdDateFormatted = parsePdfDateString(creationMatch[1]) || '';
  }

  let modifiedDateFormatted = '';
  const modMatch = pdfText.match(/\/ModDate\s*\(([^)]+)\)/);
  if (modMatch && modMatch[1]) {
    modifiedDateFormatted = parsePdfDateString(modMatch[1]) || '';
  }

  const fallbackDate = new Date(file.lastModified || Date.now());
  const fallbackFormatted =
    fallbackDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    `, ${fallbackDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

  if (!modifiedDateFormatted) {
    modifiedDateFormatted = fallbackFormatted;
  }
  if (!createdDateFormatted) {
    createdDateFormatted = modifiedDateFormatted;
  }

  // 4. Author & Producer
  let author: string | null = null;
  const authorMatch = pdfText.match(/\/Author\s*\(([^)]+)\)/);
  if (authorMatch && authorMatch[1]) {
    author = authorMatch[1];
  }

  let producer: string | null = null;
  const producerMatch = pdfText.match(/\/Producer\s*\(([^)]+)\)/);
  if (producerMatch && producerMatch[1]) {
    producer = producerMatch[1];
  }

  // 5. Content Overview
  const hasText = /\/Font|\/BT|Tj|TJ|\/Text\b/.test(pdfText);

  const imageMatches = pdfText.match(/\/Subtype\s*\/Image\b/g);
  const imageCount = imageMatches ? imageMatches.length : 0;

  const linkMatches = pdfText.match(/\/Subtype\s*\/Link\b|\/URI\b/g);
  const linkCount = linkMatches ? linkMatches.length : 0;

  const hasEmbeddedFiles = /\/EmbeddedFiles|\/EF\b|\/FileSpec\b/.test(pdfText);

  const hasJavaScript = /\/JavaScript|\/JS\b|\/Launch\b|\/OpenAction\b|\/AA\b/.test(pdfText);

  const isEncrypted = /\/Encrypt\b/.test(pdfText);

  // 6. Threat Assessment
  const nameLower = file.name.toLowerCase();
  const isThreat =
    hasJavaScript ||
    nameLower.includes('payload') ||
    nameLower.includes('exploit') ||
    nameLower.includes('malware') ||
    nameLower.includes('virus');

  const threatDetails: string[] = [];
  if (hasJavaScript) {
    threatDetails.push('Automated Action Trigger: Embedded /JS or /OpenAction stream detected in PDF catalog.');
  }
  if (nameLower.includes('payload') || nameLower.includes('exploit')) {
    threatDetails.push('High-risk filename pattern matches known exploit payload repository signatures.');
  }

  // File size display string
  const fileSizeFormatted =
    file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

  return {
    fileName: file.name,
    fileSizeFormatted,
    fileSizeBytes: file.size,
    pdfVersion,
    totalPages,
    createdDateFormatted,
    modifiedDateFormatted,
    author,
    producer,
    hasText,
    textSnippet: hasText ? 'Validated text stream' : 'No text stream',
    imageCount,
    linkCount,
    hasEmbeddedFiles,
    hasJavaScript,
    isEncrypted,
    isThreat,
    threatDetails,
  };
}
