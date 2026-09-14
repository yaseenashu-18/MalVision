/**
 * MALVISION COOKIE CONSENT MANAGER
 * 
 * Separates essential session cookies from optional tracking cookies.
 * Essential authentication cookies are ALWAYS active and independent of marketing consent.
 */

export interface CookiePreferences {
  necessary: true; // Always true & required
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string;
  hasResponded: boolean;
}

const COOKIE_CONSENT_KEY = 'malvision_cookie_consent';

export const DEFAULT_CONSENT: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: true,
  marketing: false,
  version: '1.0',
  updatedAt: new Date().toISOString(),
  hasResponded: false,
};

export function getCookieConsent(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return DEFAULT_CONSENT;

    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      functional: Boolean(parsed.functional),
      marketing: Boolean(parsed.marketing),
      version: parsed.version || '1.0',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      hasResponded: true,
    };
  } catch (e) {
    console.error('Error reading cookie consent state:', e);
    return DEFAULT_CONSENT;
  }
}

export function saveCookieConsent(preferences: Partial<Omit<CookiePreferences, 'necessary' | 'hasResponded'>>): CookiePreferences {
  const current = getCookieConsent();
  const updated: CookiePreferences = {
    necessary: true,
    analytics: preferences.analytics !== undefined ? preferences.analytics : current.analytics,
    functional: preferences.functional !== undefined ? preferences.functional : current.functional,
    marketing: preferences.marketing !== undefined ? preferences.marketing : current.marketing,
    version: '1.0',
    updatedAt: new Date().toISOString(),
    hasResponded: true,
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('malvision_cookie_consent_updated', { detail: updated }));
    }
  } catch (e) {
    console.error('Error saving cookie consent state:', e);
  }

  return updated;
}

export function acceptAllCookies(): CookiePreferences {
  return saveCookieConsent({
    analytics: true,
    functional: true,
    marketing: false,
  });
}

export function acceptEssentialOnly(): CookiePreferences {
  return saveCookieConsent({
    analytics: false,
    functional: false,
    marketing: false,
  });
}
