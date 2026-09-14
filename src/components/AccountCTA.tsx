import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface AccountCTAProps {
  onAccountClick?: () => void;
  user?: { name: string; email: string } | null;
}

export const AccountCTA: React.FC<AccountCTAProps> = ({ onAccountClick, user }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-20">
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Text & CTA */}
        <div className="md:col-span-7 space-y-6">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
            Scan smarter<br />
            with an account.
          </h2>

          <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-md leading-relaxed">
            Save scans, review history, organize reports and stay protected always.
          </p>

          {/* Hide Create Account button when user is signed in */}
          {!user ? (
            <div>
              <button
                onClick={onAccountClick}
                className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-sm hover:opacity-90 transition cursor-pointer shadow-sm active:scale-95 group"
              >
                <span>Create account</span>
                <span className="w-6 h-6 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Signed in as {user.name}</span>
            </div>
          )}
        </div>

        {/* Right Illustration: Friendly Monochrome Character */}
        <div className="md:col-span-5 flex justify-center md:justify-end select-none">
          <div className="w-64 h-64 relative flex items-center justify-center">
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full text-neutral-900 dark:text-white"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ground Shadow */}
              <ellipse cx="150" cy="245" rx="75" ry="10" fill="currentColor" fillOpacity="0.08" />

              {/* Character Outer Head/Body Shell */}
              <path
                d="M 80 200 C 65 190 75 140 120 120 C 130 115 170 115 180 120 C 225 140 235 190 220 200 C 210 215 90 215 80 200 Z"
                fill="currentColor"
                fillOpacity="0.12"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Antenna Tube & Ring */}
              <path d="M 150 115 L 150 75" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              <ellipse cx="150" cy="65" rx="14" ry="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="5" />

              {/* Face Inner Oval Window */}
              <ellipse cx="150" cy="165" rx="50" ry="38" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="4" />

              {/* Cute Eyes */}
              <ellipse cx="132" cy="158" rx="7" ry="11" fill="currentColor" />
              <ellipse cx="134" cy="154" rx="2" ry="3" fill="white" />

              <ellipse cx="168" cy="158" rx="7" ry="11" fill="currentColor" />
              <ellipse cx="170" cy="154" rx="2" ry="3" fill="white" />

              {/* Friendly Smile */}
              <path d="M 142 176 Q 150 184 158 176" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

              {/* Spark Rays */}
              <path d="M 60 140 L 45 125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M 70 115 L 55 100" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M 85 95 L 75 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

              <path d="M 235 175 L 255 165" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M 245 195 L 260 190" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              
              <path d="M 55 210 L 40 220" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M 70 230 L 60 245" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
