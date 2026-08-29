import React, { useEffect } from 'react';
import { FileText, ArrowLeft, ShieldAlert, Scale, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

interface TermsOfServiceProps {
  onNavigate: (page: string) => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onNavigate }) => {
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
          Effective Date: August 30, 2026
        </span>
      </div>

      {/* Hero Title Header */}
      <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Scale className="w-4 h-4 text-indigo-500" />
          <span>Legal Agreement & Terms</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
          Terms of Service
        </h1>
        
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Please read these Terms of Service carefully before accessing or using the MalVision threat detection platform. By accessing or using our services, you agree to be bound by these legal rules and terms.
        </p>
      </div>

      {/* Main Legal Sections Container */}
      <div className="space-y-12 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        
        {/* Section 1: Acceptable Use */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            <h2>1. Acceptable Use & User Responsibilities</h2>
          </div>
          <p>
            MalVision provides automated cybersecurity inspection tools designed for threat detection, PDF stream verification, URL risk checking, and cryptographic hash analysis.
          </p>
          <div className="space-y-2 pt-2">
            <span className="font-bold text-neutral-900 dark:text-white text-xs block">By using MalVision, you agree NOT to:</span>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-neutral-600 dark:text-neutral-400">
              <li>Use MalVision to reverse-engineer, test, or fine-tune zero-day exploits or active ransomware payloads for unlawful purposes.</li>
              <li>Attempt to disrupt, overload, or flood our MongoDB cluster indexes or web application infrastructure.</li>
              <li>Bypass authentication mechanisms or impersonate other authorized users.</li>
              <li>Scrape, duplicate, or redistribute threat signatures without explicit authorization.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Threat Detection Disclaimer */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2>2. Cybersecurity & Analysis Disclaimer</h2>
          </div>
          <p>
            MalVision utilizes multi-engine heuristic signature evaluation, PDF object stream parsing, and hash reputation lookup to calculate risk probability scores.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Important Security Notice</span>
            </div>
            <p className="opacity-95 leading-relaxed">
              While our detection engine achieves high-confidence risk scoring, no threat scanner can guarantee 100% detection of zero-day vulnerabilities or previously undocumented malware. Reports provided by MalVision are for informational and security guidance purposes.
            </p>
          </div>
        </section>

        {/* Section 3: Intellectual Property */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <FileText className="w-5 h-5 text-emerald-500" />
            <h2>3. Intellectual Property Rights</h2>
          </div>
          <p>
            The MalVision brand, user interface design, custom styling system, source code, logos, and security telemetry architecture are the intellectual property of MalVision and maintainer{' '}
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

        {/* Section 4: Limitation of Liability */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <Scale className="w-5 h-5 text-rose-500" />
            <h2>4. Limitation of Liability</h2>
          </div>
          <p>
            To the maximum extent permitted by applicable law, MalVision and its developers shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform, including but not limited to loss of data, system disruption, or malware execution on unisolated host machines.
          </p>
        </section>

        {/* Section 5: Modifications to Terms */}
        <section className="space-y-4 bg-white dark:bg-[#1A1A1D] p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center space-x-3 text-neutral-900 dark:text-white font-bold text-lg">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            <h2>5. Service Modifications & Termination</h2>
          </div>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature or service of MalVision at any time. Notice of material updates to these Terms of Service will be posted on this page with an updated effective date.
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
