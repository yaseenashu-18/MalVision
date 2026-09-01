import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Menu, X, Clock, User, Settings } from 'lucide-react';
import malvisionLogoSvg from '../assets/MalVision_logo_pixel_match.svg';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenHistory?: () => void;
  onGetStarted?: () => void;
  onOpenSettings?: (tab?: 'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans') => void;
  user?: { name: string; email: string; avatar?: string; provider?: string } | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenHistory,
  onGetStarted,
  onOpenSettings,
  user,
  onSignOut,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const dashRef = useRef<HTMLButtonElement>(null);
  const scanRef = useRef<HTMLButtonElement>(null);
  const featuresRef = useRef<HTMLButtonElement>(null);
  const aboutRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // Passive scroll listener for threshold check
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 40;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update desktop navigation pill position
  useEffect(() => {
    let currentRef: React.RefObject<HTMLButtonElement | null> = dashRef;
    if (activeTab === 'scanner') currentRef = scanRef;
    else if (activeTab === 'features') currentRef = featuresRef;
    else if (activeTab === 'about') currentRef = aboutRef;

    if (currentRef.current) {
      setIndicatorStyle({
        left: currentRef.current.offsetLeft,
        width: currentRef.current.offsetWidth,
      });
    }
  }, [activeTab, isScrolled]);

  // Close dropdowns/menus on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleMobileNav = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header
      ref={headerRef}
      style={{
        transitionDuration: '500ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`fixed z-50 transition-all motion-reduce:transition-none ${
        isScrolled
          ? 'top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[calc(100%-20px)] md:w-[min(calc(100%-32px),1320px)] rounded-[22px] sm:rounded-[24px] bg-white/72 dark:bg-[#141416]/75 backdrop-blur-xl saturate-140 border border-black/8 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] py-2.5 px-4 sm:px-6'
          : 'top-0 left-0 right-0 w-full bg-transparent border-b border-transparent shadow-none py-4 px-6 lg:px-8'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Balanced Brand Lockup (Logo + Wordmark) */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-2 focus:outline-none transition opacity-95 hover:opacity-100 cursor-pointer group py-1 shrink-0"
          aria-label="MalVision Home"
        >
          <img
            src={malvisionLogoSvg}
            alt="MalVision Logo"
            className="h-6 sm:h-7 w-auto object-contain dark:invert transition-transform duration-200 group-hover:scale-105"
          />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white leading-none">
            MalVision
          </span>
        </button>

        {/* Center: Desktop Navigation (>= 768px) - Clean & unencapsulated at top */}
        <nav
          className={`hidden md:flex items-center relative transition-all duration-300 ${
            isScrolled
              ? 'bg-neutral-200/50 dark:bg-neutral-800/50 p-1 rounded-full border border-neutral-300/40 dark:border-neutral-700/40 backdrop-blur-xs'
              : 'bg-transparent p-0 border-none space-x-1'
          }`}
        >
          <button
            ref={dashRef}
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            ref={scanRef}
            onClick={() => onNavigate('scanner')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors cursor-pointer ${
              activeTab === 'scanner'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Scanner
          </button>
          <button
            ref={featuresRef}
            onClick={() => onNavigate('features')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors cursor-pointer ${
              activeTab === 'features'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Features
          </button>
          <button
            ref={aboutRef}
            onClick={() => onNavigate('about')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full z-10 transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            About
          </button>

          {/* Active Tab Sliding Pill Indicator (visible when scrolled or active) */}
          {isScrolled && (
            <div
              className="absolute top-1 bottom-1 bg-white dark:bg-neutral-900 rounded-full shadow-xs transition-all duration-300 ease-out z-0"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          )}
        </nav>

        {/* Right Tools (Desktop): Appearance -> Get Started (when !user) OR Profile Dropdown (when user) */}
        <div className="hidden md:flex items-center space-x-2.5 sm:space-x-3">
          {/* Appearance Toggle */}
          <ThemeToggle />

          {!user ? (
            /* Primary CTA: Get Started when not authenticated */
            <button
              onClick={onGetStarted ? onGetStarted : () => onNavigate('scanner')}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              Get Started
            </button>
          ) : (
            /* Profile Dropdown Trigger when authenticated */
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition cursor-pointer active:scale-95"
                aria-label="Profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span className="text-xs font-semibold max-w-[110px] truncate">
                  {user.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-neutral-900/95 shadow-xl border border-neutral-200/80 dark:border-neutral-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl space-y-1">
                  <div className="px-3 py-2 space-y-0.5 border-b border-neutral-200/80 dark:border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenSettings?.('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenHistory ? onOpenHistory() : onNavigate('history');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>History</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenSettings?.('database');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-neutral-200/80 dark:border-neutral-800" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSignOut?.();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Tools (Mobile < 768px): Get Started (when !user) OR Profile (when user) -> Appearance -> Hamburger */}
        <div className="flex md:hidden items-center space-x-2">
          {!user ? (
            /* Get Started Button on Mobile Header when not authenticated */
            <button
              onClick={onGetStarted ? onGetStarted : () => onNavigate('scanner')}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              Get Started
            </button>
          ) : (
            /* Profile Dropdown Trigger on Mobile Header when authenticated */
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 transition cursor-pointer"
                aria-label="Mobile Profile menu"
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-extrabold text-[9px] flex items-center justify-center shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <span className="text-[11px] font-semibold max-w-[80px] truncate">
                  {user.name}
                </span>
                <ChevronDown className={`w-3 h-3 opacity-70 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 dark:bg-neutral-900/95 shadow-xl border border-neutral-200/80 dark:border-neutral-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl space-y-1">
                  <div className="px-3 py-1.5 space-y-0.5 border-b border-neutral-200/80 dark:border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenSettings?.('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenHistory ? onOpenHistory() : onNavigate('history');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>History</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenSettings?.('database');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-neutral-200/80 dark:border-neutral-800" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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
          )}

          {/* Appearance Toggle directly on Mobile Header */}
          <ThemeToggle />

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full text-neutral-800 dark:text-neutral-200 bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 stroke-[2]" />
            ) : (
              <Menu className="w-4 h-4 stroke-[2]" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden fixed inset-x-3 top-16 mt-2 rounded-3xl bg-white/95 dark:bg-[#141416]/95 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-2xl shadow-2xl p-5 space-y-5 animate-in fade-in slide-in-from-top-3 duration-200 z-50 max-h-[85vh] overflow-y-auto"
        >
          {/* Section 1: Navigation */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase px-3">
              Navigation
            </span>
            <nav className="flex flex-col space-y-1 font-semibold text-sm">
              <button
                onClick={() => handleMobileNav('dashboard')}
                className={`text-left py-2.5 px-3 rounded-xl transition ${
                  activeTab === 'dashboard'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => handleMobileNav('scanner')}
                className={`text-left py-2.5 px-3 rounded-xl transition ${
                  activeTab === 'scanner'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                Scanner
              </button>

              <button
                onClick={() => handleMobileNav('features')}
                className={`text-left py-2.5 px-3 rounded-xl transition ${
                  activeTab === 'features'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                Features
              </button>

              <button
                onClick={() => handleMobileNav('about')}
                className={`text-left py-2.5 px-3 rounded-xl transition ${
                  activeTab === 'about'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                About
              </button>
            </nav>
          </div>

          <div className="border-t border-neutral-200/80 dark:border-neutral-800" />

          {/* Section 2: Account */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase px-3">
              Account
            </span>
            <div className="flex flex-col space-y-1 text-sm font-medium">
              {user && (
                <button
                  onClick={() => {
                    onOpenSettings?.('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <span>Profile</span>
                </button>
              )}

              <button
                onClick={() => {
                  onOpenHistory ? onOpenHistory() : onNavigate('history');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>History</span>
              </button>

              <button
                onClick={() => {
                  onOpenSettings?.('database');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>Settings</span>
              </button>

              {user ? (
                <button
                  onClick={() => {
                    onSignOut?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onGetStarted ? onGetStarted() : onNavigate('scanner');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-semibold"
                >
                  <User className="w-4 h-4 text-neutral-900 dark:text-white" />
                  <span>Sign In / Get Started</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
