import React, { useEffect } from 'react';
import { ShieldCheck, ArrowLeft, Lock, Database, Key, Server, Eye, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (page: string) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to MalVision</span>
        </button>

        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
          Last Updated: August 30, 2026
        </span>
      </div>

      {/* Hero Title Header */}
      <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Privacy-First Architecture</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
          Privacy Policy
        </h1>
        
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          MalVision is engineered with a local-first security architecture. We analyze files, URLs, and file hashes with zero unnecessary data collection, ensuring your confidential documents remain strictly under your control.
        </p>
      </div>

      {/* Main Legal Sections Container */}
      <div className="space-y-12 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        
        {/* Section 1: Core Principles */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h2>1. Core Privacy Principles</h2>
          </div>
          <p>
            At MalVision, privacy is not an afterthought—it is the foundation of our engineering design. Unlike traditional cloud antivirus tools that upload whole files to external third-party servers, MalVision performs local inspection, stream parsing, and hash extraction directly inside your browser sandbox whenever possible.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-neutral-900 dark:text-white text-xs block">Local Sandbox Parsing</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">PDF structure checks and macro inspections run directly within your browser runtime environment.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
              <span className="font-bold text-neutral-900 dark:text-white text-xs block">Zero Content Monetization</span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">We do not sell, rent, or trade your scanned document metadata or search history to advertisers or third parties.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Data We Collect */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Eye className="w-5 h-5 text-blue-500" />
            <h2>2. Information We Collect & How It Is Used</h2>
          </div>
          <p>
            We collect only the minimal data necessary to deliver real-time threat intelligence and maintain your user session.
          </p>
          
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-neutral-900 dark:text-white text-sm">A. Google OAuth Account Information</h3>
            <p>
              When you authenticate using Google Sign-In, we receive your basic Google profile details:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
              <li>Full Name & Email Address</li>
              <li>Google Profile Picture (Avatar URL)</li>
              <li>Google Unique Subject Identifier (sub)</li>
            </ul>
            <p className="text-xs opacity-90">
              We use this information exclusively to personalize your session, sync your database scan history across devices, and secure your account. We never request access to your Google Drive, Gmail messages, or contacts.
            </p>

            <h3 className="font-bold text-neutral-900 dark:text-white text-sm pt-4">B. Scan Metadata & Threat Intelligence Hash Index</h3>
            <p>
              To check files against threat intelligence databases, MalVision computes standard cryptographic hashes (SHA-256 / MD5). Only cryptographic hashes and non-sensitive file properties (file name, file size, mime type) are queried against our MongoDB threat signatures index (<code className="font-mono text-emerald-600 dark:text-emerald-400">threat-detection</code> database).
            </p>
          </div>
        </section>

        {/* Section 3: Database & Data Storage */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Database className="w-5 h-5 text-emerald-500" />
            <h2>3. Database Storage & Persistence</h2>
          </div>
          <p>
            Scan reports, threat scores, and metadata are saved to your account in our cloud MongoDB cluster (<code className="font-mono text-emerald-600 dark:text-emerald-400">threat-detection</code> collection) and cached locally in your browser session storage.
          </p>
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-xs text-neutral-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>User Control over History</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              You retain full control over your stored scan records. Clicking "Clear History" permanently deletes all stored scan logs from both your browser cache and your MongoDB cluster index.
            </p>
          </div>
        </section>

        {/* Section 4: Security & Compliance */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Server className="w-5 h-5 text-indigo-500" />
            <h2>4. Security Standards & SSL Encryption</h2>
          </div>
          <p>
            All network communication between your web browser, Google Identity Services, and MongoDB Atlas database clusters is encrypted using TLS 1.3 / SSL standards. Access keys and client identifiers are managed in compliance with modern web application security practices.
          </p>
        </section>

        {/* Section 5: Contact Information */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Key className="w-5 h-5 text-amber-500" />
            <h2>5. Contact Us Regarding Your Data Rights</h2>
          </div>
          <p>
            If you have questions regarding this Privacy Policy, your data rights, or account deletion, contact our security maintainer on GitHub at{' '}
            <a 
              href="https://github.com/yaseenashu-18" 
              target="_blank" 
              rel="noreferrer" 
              className="font-bold underline text-neutral-900 dark:text-white hover:opacity-80"
            >
              @yaseenashu-18
            </a>.
          </p>
        </section>
      </div>

      {/* Bottom Back Button */}
      <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
        >
          Return to MalVision Dashboard
        </button>
      </div>
    </div>
  );
};
