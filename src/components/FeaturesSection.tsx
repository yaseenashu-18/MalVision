import React from 'react';
import { FileText, FileStack, FileSpreadsheet, Image as ImageIcon, Link as LinkIcon, Hash, Eye, Database } from 'lucide-react';
import type { ScannerTabId } from '../types';

interface FeaturesSectionProps {
  onScanSelect?: (tab: ScannerTabId) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onScanSelect }) => {
  const featureCards = [
    {
      id: 'files',
      title: 'Files',
      description: 'Scan any binary file format for hidden malware and suspicious payloads.',
      icon: FileText,
      tab: 'file-scan' as ScannerTabId
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Scan DOC, DOCX, PPT, TXT and office formats for embedded macros.',
      icon: FileStack,
      tab: 'file-scan' as ScannerTabId
    },
    {
      id: 'pdfs',
      title: 'PDFs',
      description: 'Inspect PDFs for hidden JavaScript triggers and dangerous stream objects.',
      icon: FileSpreadsheet,
      tab: 'pdf-inspector' as ScannerTabId
    },
    {
      id: 'images',
      title: 'Images',
      description: 'Scan images like JPG, PNG, and JPEG for hidden steganography risks.',
      icon: ImageIcon,
      tab: 'file-scan' as ScannerTabId
    },
    {
      id: 'links',
      title: 'Links',
      description: 'Check URLs and website links for phishing attempts and malicious redirects.',
      icon: LinkIcon,
      tab: 'url-scan' as ScannerTabId
    },
    {
      id: 'hashes',
      title: 'Hashes',
      description: 'Analyze SHA-256 and MD5 cryptographic hashes with threat intelligence.',
      icon: Hash,
      tab: 'hash-analysis' as ScannerTabId
    },
    {
      id: 'sandbox',
      title: 'Sandbox Preview',
      description: 'Preview document text and structures safely in an isolated browser environment.',
      icon: Eye,
      tab: 'preview-file' as ScannerTabId
    },
    {
      id: 'database',
      title: 'Database Cloud Sync',
      description: 'Sync your threat inspection records securely to MongoDB Atlas cluster.',
      icon: Database,
      tab: 'file-scan' as ScannerTabId
    }
  ];

  return (
    <section id="features-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Title & Subtitle */}
      <div className="text-center space-y-3 mb-10 sm:mb-14">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Features & Capabilities
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Comprehensive multi-engine threat detection tailored for files, documents, PDFs, images, links, hashes, and isolated sandboxing.
        </p>
      </div>

      {/* 8 Feature Cards Grid - Clean, No top-right badge text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => {
                onScanSelect?.(card.tab);
                const el = document.getElementById('threat-scanner-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-6 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#18181B] hover:border-neutral-400 dark:hover:border-neutral-700 transition duration-200 cursor-pointer shadow-xs flex flex-col justify-between space-y-4 group hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Icon className="w-6 h-6 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {card.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:translate-x-1 transition-transform duration-200">
                <span>Start Scanning →</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
