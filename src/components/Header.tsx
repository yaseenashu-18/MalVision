import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown, LogOut, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleMobileNav = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-warm-neutral/90 dark:bg-[#121214]/90 border-b border-neutral-200/50 dark:border-neutral-800/50 transition-all duration-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand - MalVision Text Only */}
        <button 
          onClick={() => handleMobileNav('home')} 
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white hover:opacity-90 transition cursor-pointer select-none shrink-0"
        >
          MalVision
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold relative">
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

        {/* Right Tools: Appearance Button & Profile / Get Started Button */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* Desktop Appearance Button Dropdown */}
          <div className="relative hidden md:block" ref={settingsDropdownRef}>
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

          {/* Profile Dropdown or Get Started Button */}
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-sm active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white font-extrabold text-[10px] flex items-center justify-center">
                  {getInitials(user.name)}
                </div>
                <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-0.5" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
                  <div className="px-1 py-0.5 space-y-0.5">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="border-t border-neutral-200/80 dark:border-neutral-800" />

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
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
            >
              Get Started
            </button>
          )}

          {/* Mobile Hamburger Menu Icon Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[2]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md px-6 py-4 space-y-4 animate-in slide-in-from-top duration-200 shadow-xl">
          <nav className="flex flex-col space-y-3 font-semibold text-sm">
            <button
              onClick={() => handleMobileNav('dashboard')}
              className={`text-left py-2 px-3 rounded-xl transition ${
                activeTab === 'dashboard' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => handleMobileNav('scanner')}
              className={`text-left py-2 px-3 rounded-xl transition ${
                activeTab === 'scanner' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Scanner
            </button>

            <button
              onClick={() => handleMobileNav('history')}
              className={`text-left py-2 px-3 rounded-xl transition ${
                activeTab === 'history' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              History
            </button>

            <button
              onClick={() => handleMobileNav('about')}
              className={`text-left py-2 px-3 rounded-xl transition ${
                activeTab === 'about' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              About
            </button>
          </nav>

          {/* Theme Selector in Mobile Menu */}
          <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Theme</span>
            <div className="flex items-center space-x-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition ${theme === 'light' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-400'}`}
                title="Light"
              >
                <Sun className="w-4 h-4 stroke-[1.5]" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-400'}`}
                title="Dark"
              >
                <Moon className="w-4 h-4 stroke-[1.5]" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg transition ${theme === 'system' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : 'text-neutral-400'}`}
                title="System"
              >
                <Monitor className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
