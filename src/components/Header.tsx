import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown, LogOut } from 'lucide-react';
import { useTheme } from '../lib/themeContext';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onGetStarted?: () => void;
  onOpenSettings?: (tab?: 'profile' | 'appearance' | 'privacy' | 'history' | 'plans') => void;
  user?: { name: string; email: string } | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate, onGetStarted, user, onSignOut }) => {
  const { theme, setTheme } = useTheme();
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const dashRef = useRef<HTMLButtonElement>(null);
  const scanRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);
  const aboutRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target as Node)) {
        setSettingsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update smooth sliding underline indicator position without text layout bounce
  useEffect(() => {
    let targetRef = dashRef;
    if (activeTab === 'scanner') targetRef = scanRef;
    else if (activeTab === 'history') targetRef = historyRef;
    else if (activeTab === 'about') targetRef = aboutRef;

    if (targetRef && targetRef.current) {
      setIndicatorStyle({
        left: targetRef.current.offsetLeft,
        width: targetRef.current.offsetWidth,
      });
    }
  }, [activeTab]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const renderThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4 text-neutral-900 dark:text-white stroke-[1.5]" />;
    if (theme === 'dark') return <Moon className="w-4 h-4 text-neutral-900 dark:text-white stroke-[1.5]" />;
    return <Monitor className="w-4 h-4 text-neutral-900 dark:text-white stroke-[1.5]" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-warm-neutral/80 dark:bg-[#121214]/80 border-b border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-200">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand - MalVision Text Only */}
        <button 
          onClick={() => onNavigate('home')} 
          className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white hover:opacity-90 transition cursor-pointer select-none"
        >
          MalVision
        </button>

        {/* Navigation & Actions */}
        <div className="flex items-center space-x-8">
          <nav className="relative flex items-center space-x-7 text-sm font-semibold">
            <button
              ref={dashRef}
              onClick={() => onNavigate('dashboard')}
              className={`py-1 transition-colors duration-200 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>

            <button
              ref={scanRef}
              onClick={() => onNavigate('scanner')}
              className={`py-1 transition-colors duration-200 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Scanner
            </button>

            <button
              ref={historyRef}
              onClick={() => onNavigate('history')}
              className={`py-1 transition-colors duration-200 cursor-pointer ${
                activeTab === 'history'
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              History
            </button>

            <button
              ref={aboutRef}
              onClick={() => onNavigate('about')}
              className={`py-1 transition-colors duration-200 cursor-pointer ${
                activeTab === 'about'
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              About
            </button>

            {/* Smooth Sliding Active Indicator Line */}
            <span
              className="absolute bottom-0 h-0.5 bg-neutral-900 dark:bg-white rounded-full transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          </nav>

          {/* Right Tools: Appearance Button & Profile Dropdown / Get Started Button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Appearance Button Dropdown */}
            <div className="relative" ref={settingsDropdownRef}>
              <button
                onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                className="p-2 rounded-full text-neutral-700 dark:text-neutral-300 bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition cursor-pointer flex items-center justify-center"
                aria-label="Appearance"
                title={`Theme: ${theme}`}
              >
                {renderThemeIcon()}
              </button>

              {settingsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-0.5">
                  <button
                    onClick={() => {
                      setTheme('light');
                      setSettingsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      theme === 'light'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sun className="w-3.5 h-3.5 text-neutral-900 dark:text-white stroke-[1.5]" />
                      <span>Light</span>
                    </div>
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('dark');
                      setSettingsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Moon className="w-3.5 h-3.5 text-neutral-900 dark:text-white stroke-[1.5]" />
                      <span>Dark</span>
                    </div>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                  </button>

                  <button
                    onClick={() => {
                      setTheme('system');
                      setSettingsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      theme === 'system'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Monitor className="w-3.5 h-3.5 text-neutral-900 dark:text-white stroke-[1.5]" />
                      <span>System</span>
                    </div>
                    {theme === 'system' && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown when authenticated OR Get Started Button */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <div className="w-5 h-5 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white font-extrabold text-[10px] flex items-center justify-center">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-xs font-semibold max-w-[110px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
                    {/* User Info Header: Name & Email below it */}
                    <div className="px-1 py-0.5 space-y-0.5">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="border-t border-neutral-200/80 dark:border-neutral-800" />

                    {/* Sign Out option in RED */}
                    <button
                      onClick={() => {
                        onSignOut?.();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onGetStarted ? onGetStarted : () => onNavigate('scanner')}
                className="px-5 py-2 text-sm font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-sm active:scale-95"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
