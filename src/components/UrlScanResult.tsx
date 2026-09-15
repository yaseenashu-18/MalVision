import React, { useState } from 'react';
import type { StandardURLScanResult, ResultStatus } from '../types/urlScanner';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Download,
  Lock,
  Globe,
  Server,
  FileCode,
  Cpu,
  Shield,
  Code,
  Terminal,
  Sparkles,
  Link,
} from 'lucide-react';

interface UrlScanResultProps {
  result: StandardURLScanResult;
  onNewScan: () => void;
  onRescan?: () => void;
}

export const UrlScanResult: React.FC<UrlScanResultProps> = ({ result, onNewScan, onRescan }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    verdict_summary: true,
    threat_detection: true,
    phishing_analysis: false,
    url_analysis: false,
    domain_information: false,
    ip_infrastructure: false,
    ssl_tls: false,
    ai_security_summary: true,
  });

  const [copied, setCopied] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `malvision_urlscan_${result.scan_id}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Verdict Badge Styling
  const getVerdictBadge = () => {
    switch (result.overall_verdict) {
      case 'safe':
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Safe Domain</span>
          </div>
        );
      case 'low_risk':
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Low Risk</span>
          </div>
        );
      case 'suspicious':
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Suspicious</span>
          </div>
        );
      case 'phishing':
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Phishing Risk</span>
          </div>
        );
      case 'scam':
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Scam / Fraud</span>
          </div>
        );
      case 'malicious':
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Malicious Threat</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Inconclusive</span>
          </div>
        );
    }
  };

  const getStatusPill = (status: ResultStatus) => {
    switch (status) {
      case 'detected':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">DETECTED</span>;
      case 'not_detected':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">CLEAN</span>;
      case 'suspicious':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">SUSPICIOUS</span>;
      case 'unavailable':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-500/15 text-neutral-500 dark:text-neutral-400 border border-neutral-500/20">UNAVAILABLE</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-neutral-500/15 text-neutral-500 dark:text-neutral-400 border border-neutral-500/20">{status.toUpperCase()}</span>;
    }
  };

  // Score Color Gauge
  const score = result.risk_score;
  const scoreColor =
    score >= 65 ? 'text-rose-500 stroke-rose-500' : score >= 40 ? 'text-amber-500 stroke-amber-500' : score >= 16 ? 'text-blue-500 stroke-blue-500' : 'text-emerald-500 stroke-emerald-500';

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sections = result.sections;

  return (
    <div className="w-full max-w-5xl mx-auto text-left space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNewScan}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition cursor-pointer"
            title="Back to Scanner"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate max-w-md">
              {result.sections.url_analysis.host || result.url}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-lg font-mono">
              {result.normalized_url}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center space-x-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>

          {onRescan && (
            <button
              onClick={onRescan}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rescan</span>
            </button>
          )}

          <button
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Level 1: Verdict Banner & Score Gauge Meter */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121216] border border-neutral-200/80 dark:border-neutral-800 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Score Ring Gauge */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-neutral-200 dark:stroke-neutral-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`transition-all duration-1000 stroke-current ${scoreColor}`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-black ${scoreColor.split(' ')[0]}`}>{score}</span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Risk Score</span>
            </div>
          </div>
          <span className="mt-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 capitalize">
            Risk Level: <span className="font-bold text-neutral-900 dark:text-white">{result.risk_level}</span>
          </span>
        </div>

        {/* Verdict Highlights */}
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center space-x-3">
            {getVerdictBadge()}
            <span className="text-xs font-mono text-neutral-400">
              Scan ID: {result.scan_id.substring(0, 16)}
            </span>
          </div>

          <a
            href={result.normalized_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-extrabold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-2 truncate max-w-xl group"
          >
            <span className="truncate">{result.normalized_url}</span>
            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition shrink-0" />
          </a>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs border-t border-neutral-100 dark:border-neutral-800/80">
            <div>
              <span className="text-[11px] text-neutral-400 block">Checks Passed</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {sections.verdict_summary.checks_passed} Checked
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Threats Flagged</span>
              <span className={`font-bold ${sections.verdict_summary.checks_detected > 0 ? 'text-rose-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                {sections.verdict_summary.checks_detected} Detected
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Duration</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {result.scan_duration}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Confidence</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Level 2: Verdict Reasons & Indicator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verdict Reasons / Risk Factors */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            <span>Verdict Reasons & Risk Drivers</span>
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {result.verdict_reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Positive & Negative Indicators */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Security Indicators</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block mb-1">
                Positive Signs
              </span>
              {result.positive_indicators.length > 0 ? (
                <div className="space-y-1">
                  {result.positive_indicators.map((pos, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      <span>{pos}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-neutral-400 italic">No positive indicators recorded.</span>
              )}
            </div>

            {result.negative_indicators.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide block mb-1">
                  Negative Indicators
                </span>
                <div className="space-y-1">
                  {result.negative_indicators.map((neg, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{neg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level 3: Threat Detection Matrix & Redirect Chain */}
      <div className="space-y-4">
        {/* Threat Grid */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Threat Detection Matrix</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sections.threat_detection.items.map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">{item.name}</span>
                  {getStatusPill(item.status)}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Redirect Chain Diagram */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#121216] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
          <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <Link className="w-4 h-4 text-indigo-500" />
            <span>HTTP Redirect Chain ({sections.redirect_analysis.redirect_count} Redirects)</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 overflow-x-auto pb-2">
            {sections.redirect_analysis.redirect_chain.map((hop, idx) => (
              <React.Fragment key={idx}>
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-xs min-w-[200px] flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-400 text-[10px]">STEP {hop.step}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      HTTP {hop.statusCode}
                    </span>
                  </div>
                  <div className="font-bold text-neutral-900 dark:text-white truncate" title={hop.url}>
                    {hop.domain}
                  </div>
                  <div className="text-[10px] text-neutral-400 capitalize">{hop.type} hop</div>
                </div>

                {idx < sections.redirect_analysis.redirect_chain.length - 1 && (
                  <div className="hidden sm:flex items-center text-neutral-400 shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Level 4: Expandable Technical Section Drawers (Accordion) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Technical Analysis Modules (25 Technical Drawers)
        </h3>

        {/* 1. URL Analysis */}
        <AccordionDrawer
          title="URL Structure & Syntax Analysis"
          icon={<Code className="w-4 h-4 text-emerald-500" />}
          isOpen={openSections.url_analysis}
          onToggle={() => toggleSection('url_analysis')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">Scheme</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.scheme}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Host Domain</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.host}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">URL Length</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.length} chars</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Subdomains</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.subdomain_count}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">URL Shortener</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.is_url_shortener ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Punycode Encoding</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.is_punycode ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">IP-based Host</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.url_analysis.is_ip_based ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Suspicious Keywords</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {sections.url_analysis.suspicious_keywords.length > 0 ? sections.url_analysis.suspicious_keywords.join(', ') : 'None'}
              </span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 2. Phishing Analysis */}
        <AccordionDrawer
          title="Phishing & Social Engineering Analysis"
          icon={<AlertOctagon className="w-4 h-4 text-orange-500" />}
          isOpen={openSections.phishing_analysis}
          onToggle={() => toggleSection('phishing_analysis')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">Phishing Status</span>
              {getStatusPill(sections.phishing_analysis.phishing_status)}
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Target Brand</span>
              <span className="font-bold text-neutral-900 dark:text-white">{sections.phishing_analysis.target_brand || 'None Detected'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Impersonated Domain</span>
              <span className="font-mono text-neutral-900 dark:text-white">{sections.phishing_analysis.impersonated_domain || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Login Form Present</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.phishing_analysis.login_form_detected ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 3. Brand Impersonation */}
        <AccordionDrawer
          title="Brand Impersonation & Spoofing"
          icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
          isOpen={openSections.brand_impersonation}
          onToggle={() => toggleSection('brand_impersonation')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">Brand Detected</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.brand_impersonation.brand_detected ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Claimed Brand</span>
              <span className="font-bold text-neutral-900 dark:text-white">{sections.brand_impersonation.claimed_brand || 'None'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Expected Official Domain</span>
              <span className="font-mono text-neutral-900 dark:text-white">{sections.brand_impersonation.expected_domain || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Similarity Score</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.brand_impersonation.similarity_score}%</span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 4. Domain Info & WHOIS */}
        <AccordionDrawer
          title="Domain Registration & WHOIS Information"
          icon={<Globe className="w-4 h-4 text-blue-500" />}
          isOpen={openSections.domain_information}
          onToggle={() => toggleSection('domain_information')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">Registrable Domain</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">{sections.domain_information.registrable_domain}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Domain Age</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.domain_information.domain_age || 'Unavailable'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Creation Date</span>
              <span className="font-mono text-neutral-900 dark:text-white">{sections.domain_information.creation_date || 'Unavailable'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Registrar</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.domain_information.registrar || 'Protected / Unknown'}</span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 5. IP & Infrastructure */}
        <AccordionDrawer
          title="IP Address & Network Infrastructure"
          icon={<Server className="w-4 h-4 text-indigo-500" />}
          isOpen={openSections.ip_infrastructure}
          onToggle={() => toggleSection('ip_infrastructure')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">IPv4 Address</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">{sections.ip_infrastructure.ipv4 || 'Unavailable'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">ASN / ISP</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.ip_infrastructure.isp || 'Unavailable'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Server Header</span>
              <span className="font-mono text-neutral-900 dark:text-white">{sections.ip_infrastructure.server_header || 'Hidden'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Geographic Location</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {sections.ip_infrastructure.country ? `${sections.ip_infrastructure.city || ''}, ${sections.ip_infrastructure.country}` : 'Unavailable'}
              </span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 6. SSL / TLS Certificate */}
        <AccordionDrawer
          title="SSL / TLS Transport Security Certificate"
          icon={<Lock className="w-4 h-4 text-emerald-500" />}
          isOpen={openSections.ssl_tls}
          onToggle={() => toggleSection('ssl_tls')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">HTTPS Enabled</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{sections.ssl_tls.https_enabled ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Certificate Issuer</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.ssl_tls.issuer || 'Unavailable'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">TLS Protocol Version</span>
              <span className="font-mono text-neutral-900 dark:text-white">{sections.ssl_tls.tls_version || 'TLS 1.3'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Days to Expiration</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.ssl_tls.days_to_expiration ?? 'N/A'} days</span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 7. HTTP Headers & Security Audit */}
        <AccordionDrawer
          title="HTTP Response Headers & Security Configuration"
          icon={<FileCode className="w-4 h-4 text-purple-500" />}
          isOpen={openSections.http_analysis}
          onToggle={() => toggleSection('http_analysis')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">HTTP Status Code</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">{sections.http_analysis.status_code}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Response Time</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.http_analysis.response_time_ms} ms</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Security Headers Found</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {sections.http_analysis.security_headers.detected_count} / {sections.http_analysis.security_headers.total_recommended}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Strict-Transport-Security (HSTS)</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.http_analysis.security_headers.hsts ? 'Active' : 'Missing'}</span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 8. JavaScript & Script Audit */}
        <AccordionDrawer
          title="JavaScript & Obfuscation Analysis"
          icon={<Terminal className="w-4 h-4 text-amber-500" />}
          isOpen={openSections.javascript_analysis}
          onToggle={() => toggleSection('javascript_analysis')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">Total Script Files</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.javascript_analysis.script_count}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">External Scripts</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.javascript_analysis.external_script_count}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Obfuscated Code</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.javascript_analysis.obfuscated_script_count} flagged</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Malicious Executable Logic</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.javascript_analysis.malicious_script_count} flagged</span>
            </div>
          </div>
        </AccordionDrawer>

        {/* 9. Technology Stack */}
        <AccordionDrawer
          title="Detected Technology Stack & Frameworks"
          icon={<Cpu className="w-4 h-4 text-cyan-500" />}
          isOpen={openSections.technology_detection}
          onToggle={() => toggleSection('technology_detection')}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-neutral-400 block">CMS</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.technology_detection.cms || 'Custom / None'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Frameworks</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.technology_detection.frameworks.join(', ') || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">CDN / Proxy</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.technology_detection.cdn || 'Direct Server'}</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400 block">Web Server</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{sections.technology_detection.server || 'Standard'}</span>
            </div>
          </div>
        </AccordionDrawer>
      </div>

      {/* MalVision AI Summary — Clean & Minimal at the bottom */}
      <div className="p-5 rounded-2xl bg-neutral-900 text-white dark:bg-[#18181D] dark:border dark:border-neutral-800 space-y-3 shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>MalVision AI — Unified Executive Summary</span>
        </div>

        <p className="text-sm text-neutral-200 leading-relaxed">
          {sections.ai_security_summary.summary_text}
        </p>

        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-neutral-400">
            <span className="font-semibold text-white">Recommended Action:</span>
            <span>{sections.ai_security_summary.recommendation_verdict}</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            Analyzed by MALVISION AI Model v1.0
          </span>
        </div>
      </div>
    </div>
  );
};

interface AccordionDrawerProps {
  title: string;
  icon: React.ReactNode;
  isOpen?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionDrawer: React.FC<AccordionDrawerProps> = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className="rounded-xl bg-white dark:bg-[#121216] border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition cursor-pointer"
      >
        <div className="flex items-center space-x-2.5">
          {icon}
          <span className="text-xs font-bold text-neutral-900 dark:text-white">{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};
