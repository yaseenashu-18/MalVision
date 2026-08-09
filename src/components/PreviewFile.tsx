import React, { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

export const PreviewFile: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<'sample.txt' | 'quarterly_report.pdf' | 'config.json' | null>('sample.txt');
  const [customFile, setCustomFile] = useState<{ name: string; type: string; size: string; content: string } | null>(null);

  const samples = {
    'sample.txt': {
      name: 'security_audit_log_2024.txt',
      type: 'Text Document (Plain Text)',
      size: '24.8 KB',
      content: `[2024-08-09 02:15:01] SYS_INIT: Threat inspection sub-routine initialized.
[2024-08-09 02:15:02] PARSE_STREAM: Read 1,024 byte chunks from buffer.
[2024-08-09 02:15:03] ENTROPY_CHECK: Normal distribution (4.12 bits/byte).
[2024-08-09 02:15:04] NO_EXPLOIT_HOOKS: Standard ASCII string payload detected.
[2024-08-09 02:15:05] INSPECTION_RESULT: Clean text stream. No shellcode or hidden macros.`
    },
    'quarterly_report.pdf': {
      name: 'quarterly_report_q3.pdf',
      type: 'Adobe Portable Document (PDF/A)',
      size: '1.4 MB',
      content: `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 78 >>
stream
BT /F1 12 Tf 72 712 Td (MalVision Safe Sandbox Preview Mode - Content Rendered Plaintext) Tj ET
endstream
endobj`
    },
    'config.json': {
      name: 'application_settings.json',
      type: 'JSON Configuration File',
      size: '4.2 KB',
      content: `{
  "appName": "MalVision-Core",
  "version": "2.4.0",
  "securityEngine": {
    "sandboxMode": true,
    "strictCertCheck": true,
    "maxPayloadSizeMb": 50
  },
  "status": "OPERATIONAL"
}`
    }
  };

  const currentSample = customFile || (selectedSample ? samples[selectedSample] : samples['sample.txt']);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomFile({
          name: file.name,
          type: file.type || 'Custom Document',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: event.target?.result as string || '[Binary or unreadable file content]'
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between text-left space-y-3">
      {/* Top Banner: Read-Only Safeguard indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Isolated Read-Only Preview Shell
          </span>
        </div>

        {/* Quick sample selector */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-neutral-400 hidden sm:inline">Samples:</span>
          <button
            onClick={() => { setCustomFile(null); setSelectedSample('sample.txt'); }}
            className={`px-2 py-0.5 rounded cursor-pointer transition ${selectedSample === 'sample.txt' && !customFile ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            txt
          </button>
          <button
            onClick={() => { setCustomFile(null); setSelectedSample('quarterly_report.pdf'); }}
            className={`px-2 py-0.5 rounded cursor-pointer transition ${selectedSample === 'quarterly_report.pdf' && !customFile ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            pdf
          </button>
          <label className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
            Upload Custom
            <input type="file" onChange={handleCustomUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-xs">
        <div>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold block">File Name</span>
          <span className="font-semibold text-neutral-900 dark:text-white truncate block">{currentSample.name}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Type</span>
          <span className="text-neutral-600 dark:text-neutral-400 truncate block">{currentSample.type}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-neutral-400 font-semibold block">Size</span>
          <span className="text-neutral-600 dark:text-neutral-400 block">{currentSample.size}</span>
        </div>
      </div>

      {/* Read-Only Content Box */}
      <div className="flex-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-900 text-neutral-200 p-3.5 font-mono text-xs overflow-y-auto max-h-[160px] leading-relaxed shadow-inner">
        <pre className="whitespace-pre-wrap break-all">{currentSample.content}</pre>
      </div>

      {/* Bottom Row */}
      <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Rendered in isolated sandbox environment. Scripts disabled.</span>
        </div>
        <button
          onClick={() => { setSelectedSample('sample.txt'); setCustomFile(null); }}
          className="px-4 py-1.5 text-xs font-medium rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New Scan</span>
        </button>
      </div>
    </div>
  );
};
