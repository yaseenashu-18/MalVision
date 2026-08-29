import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (page: string) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to MalVision</span>
        </button>

        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
          Privacy Policy &bull; MalVision Security
        </span>
      </div>

      {/* Main Title */}
      <div className="space-y-4 border-b border-neutral-200/60 dark:border-neutral-800/60 pb-8">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-base sm:text-lg font-serif italic text-neutral-600 dark:text-neutral-400 leading-relaxed">
          MalVision is built around an unyielding commitment to your digital privacy and data security.
        </p>
      </div>

      {/* Fluid Cursive & Elegant Text Body */}
      <div className="space-y-10 font-serif italic text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
        
        <div className="space-y-3">
          <h2 className="font-sans not-italic text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Local-First Inspection Guarantee
          </h2>
          <p>
            When you inspect files, document streams, URLs, or file hashes using MalVision, our primary security engine operates locally within your web browser. Confidential documents, PDFs, and binary files are never uploaded to remote third-party data centers or sold to data brokers.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-sans not-italic text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Google Authentication Scope
          </h2>
          <p>
            When you sign in using Google OAuth, MalVision accesses basic profile credentials—specifically your verified email address, display name, and avatar image—solely to personalize your threat dashboard and sync your scan history across devices. We never request or access your private Google Drive files, Gmail messages, or contacts.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-sans not-italic text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Threat Intelligence & Hash Indexing
          </h2>
          <p>
            To evaluate file safety without transmitting original document contents, MalVision extracts cryptographic hashes (SHA-256 and MD5). These non-reversible cryptographic identifiers are matched against our MongoDB signature index (<span className="font-mono not-italic text-xs text-emerald-600 dark:text-emerald-400">threat-detection</span>) to provide instant malware reputation feedback.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-sans not-italic text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Data Storage & Complete Control
          </h2>
          <p>
            Your scan history remains entirely under your ownership. You can purge all cached report records, database entries, and session metrics at any time with a single click using the Clear History function.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-sans not-italic text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Encryption & Network Safeguards
          </h2>
          <p>
            All communications between your browser runtime, Google Identity Services, and our MongoDB database clusters are protected with TLS 1.3 enterprise encryption protocols.
          </p>
        </div>

      </div>

      {/* Footer Return Link */}
      <div className="pt-10 border-t border-neutral-200/60 dark:border-neutral-800/60 flex justify-center">
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-sans not-italic font-semibold text-xs hover:opacity-90 transition cursor-pointer"
        >
          Return to MalVision
        </button>
      </div>
    </div>
  );
};
