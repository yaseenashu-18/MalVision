import React from 'react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-neutral-200/80 dark:border-neutral-800 bg-transparent pt-8 sm:pt-12 pb-6 relative overflow-hidden select-none flex flex-col justify-between items-center min-h-[160px] sm:min-h-[220px]">
      {/* Giant MalVision Watermark - Fully visible, total width fit in mobile & desktop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden px-2">
        <span className="text-[17.5vw] sm:text-[16vw] md:text-[210px] lg:text-[240px] font-black tracking-tighter text-neutral-300/90 dark:text-neutral-700/75 leading-none select-none whitespace-nowrap">
          MalVision
        </span>
      </div>

      {/* Spacer to push links to the bottom */}
      <div className="flex-1" />

      {/* Rights, Terms, Privacy, Cookies & Git links positioned over the watermark */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-400 backdrop-blur-[1px] text-center md:text-left">
        {/* Copyright & Legal links */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-8">
          <span>© 2024 MalVision. All rights reserved.</span>
          <button onClick={() => onNavigate?.('terms')} className="hover:text-neutral-900 dark:hover:text-white transition cursor-pointer">
            Terms of Service
          </button>
          <button onClick={() => onNavigate?.('privacy')} className="hover:text-neutral-900 dark:hover:text-white transition cursor-pointer">
            Privacy Policy
          </button>
          <button onClick={() => onNavigate?.('cookies')} className="hover:text-neutral-900 dark:hover:text-white transition cursor-pointer">
            Cookies
          </button>
        </div>

        {/* Git / Author attribution link */}
        <div>
          Built by{' '}
          <a
            href="https://github.com/yaseenashu-18"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-neutral-900 dark:text-white underline hover:opacity-80 transition"
          >
            yaseenashu-18
          </a>
        </div>
      </div>
    </footer>
  );
};
