import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Menu, X, Clock, User, Settings, ShieldAlert } from 'lucide-react';
import malvisionLogoSvg from '../assets/MalVision_logo_pixel_match.svg';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenHistory?: () => void;
  onGetStarted?: () => void;
  onOpenSettings?: (tab?: 'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans') => void;
  user?: { id?: string; name: string; email: string; username?: string; avatar?: string; provider?: string; role?: string } | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onGetStarted,
  user,
  onSignOut,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Passive scroll listener for translucent threshold check
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 15;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-[#0E0E10]/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs py-2.5 px-4 sm:px-8'
          : 'bg-transparent border-b border-transparent py-3 px-4 sm:px-8'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo (Navigates to /#/home and reloads page on click) */}
        <a
          href="/#/home"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '#/home';
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }}
          className="flex items-center focus:outline-none transition-opacity duration-200 hover:opacity-80 cursor-pointer group py-1 shrink-0 select-none"
          aria-label="MalVision Home"
        >
          <img
            src={malvisionLogoSvg}
            alt="MalVision"
            draggable={false}
            className="h-6 sm:h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] pointer-events-none select-none"
          />
        </a>

        {/* Center: Desktop Navigation (>= 768px) plain text links without background highlighting */}
        <nav className="hidden md:flex items-center space-x-2 font-medium">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('scanner')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
              activeTab === 'scanner'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Scanner
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
              activeTab === 'history'
                ? 'text-neutral-900 dark:text-white font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            History
          </button>
        </nav>

        {/* Right Tools (Desktop): Appearance Toggle -> CTA / Profile Dropdown */}
        <div className="hidden md:flex items-center space-x-2.5 sm:space-x-3">
          <ThemeToggle />

          {!user ? (
            <button
              onClick={onGetStarted ? onGetStarted : () => onNavigate('scanner')}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-all duration-200 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
            >
              Get Started
            </button>
          ) : (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-all duration-200 cursor-pointer active:scale-95"
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

              {/* Profile Dropdown Menu with Apple-inspired fade + translateY(-4px -> 0) animation */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-neutral-900/95 shadow-xl border border-neutral-200/80 dark:border-neutral-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl space-y-1">
                  <div className="px-3 py-2 space-y-0.5 border-b border-neutral-200/80 dark:border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {user.username ? `@${user.username}` : user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150 cursor-pointer group bg-transparent"
                  >
                    <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('history');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150 cursor-pointer group bg-transparent"
                  >
                    <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                    <span>History</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('settings');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150 cursor-pointer group bg-transparent"
                  >
                    <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                    <span>Settings</span>
                  </button>

                  {user?.role === 'superadmin' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNavigate('superadmin');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors duration-150 cursor-pointer group bg-transparent"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <span>SuperAdmin</span>
                    </button>
                  )}

                  <div className="border-t border-neutral-200/80 dark:border-neutral-800" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSignOut?.();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors duration-150 cursor-pointer bg-transparent"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Tools (Mobile < 768px) */}
        <div className="flex md:hidden items-center space-x-1.5">
          {!user && (
            <button
              onClick={onGetStarted ? onGetStarted : () => onNavigate('scanner')}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              Get Started
            </button>
          )}

          <ThemeToggle />

          {/* Mobile Hamburger Toggle Button - Clean Outline Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white active:scale-95 active:opacity-60 transition cursor-pointer focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[1.75]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[1.75]" />
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
                onClick={() => handleMobileNav('history')}
                className={`text-left py-2.5 px-3 rounded-xl transition ${
                  activeTab === 'history'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                History
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
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <span>Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate('history');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>History</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate('settings');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>Settings</span>
              </button>

              {user?.role === 'superadmin' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigate('superadmin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition font-bold cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>SuperAdmin System</span>
                </button>
              )}

              {user ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSignOut?.();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onGetStarted ? onGetStarted() : onNavigate('scanner');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-left py-2.5 px-3 rounded-xl text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition font-semibold cursor-pointer"
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
