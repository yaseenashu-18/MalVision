import type { ScanResultData } from '../types';
import { syncScanToMongoDB, fetchMongoScanHistory, deleteMongoScan, clearMongoScanHistory, normalizeEmail } from './mongoService';

const GUEST_SESSION_KEY = 'malvision_guest_session_history';

/**
 * Helper to safely access guest session history (persists across page reloads & tab navigation)
 */
function getGuestSessionScans(): ScanResultData[] {
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading guest session history:', e);
    return [];
  }
}

function saveGuestSessionScans(scans: ScanResultData[]): void {
  try {
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(scans));
  } catch (e) {
    console.error('Error saving guest session history:', e);
  }
}

/**
 * Emits live scan update event for cross-device & multi-tab synchronization
 */
export function notifyLiveScanUpdate(userEmail?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('malvision_scan_updated', { detail: { userEmail } }));
  }
}

export function getScanHistory(userEmail?: string): ScanResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail);

    // If not signed in (Guest User), return session-persisted guest scans
    if (!normEmail) {
      return getGuestSessionScans();
    }

    // For Signed-In users, fetch user-specific scans from MongoDB Atlas threat-detection database
    const mongoScans = fetchMongoScanHistory(normEmail);
    const storageKey = `malvision_scan_history_${normEmail}`;
    const raw = localStorage.getItem(storageKey);
    
    let localScans: ScanResultData[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localScans = parsed.filter(item => item && typeof item.target === 'string' && typeof item.id === 'string');
      }
    }

    // Merge mongo database scans with local user scans, enforcing strict user_id scoping: WHERE user_id = normEmail
    const mergedMap = new Map<string, ScanResultData>();
    [...mongoScans, ...localScans].forEach((scan) => {
      if (scan && scan.id) {
        const scanOwner = normalizeEmail(scan.userEmail) || normEmail;
        if (scanOwner === normEmail) {
          mergedMap.set(scan.id, { ...scan, userEmail: normEmail });
        }
      }
    });

    return Array.from(mergedMap.values());
  } catch (e) {
    console.error('Error reading scan history:', e);
    return userEmail ? [] : getGuestSessionScans();
  }
}

export function saveScanToHistory(scan: ScanResultData, userEmail?: string): ScanResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail || scan.userEmail);
    const scanWithUser: ScanResultData = {
      ...scan,
      userEmail: normEmail
    };

    // If guest user, store in sessionStorage (persists through tab switches & page reloads)
    if (!normEmail) {
      const currentGuestScans = getGuestSessionScans();
      const filtered = currentGuestScans.filter(item => item.id !== scanWithUser.id);
      const updated = [scanWithUser, ...filtered];
      saveGuestSessionScans(updated);
      return updated;
    }

    // For Signed-In users, store in user-specific key & sync to MongoDB Atlas
    const storageKey = `malvision_scan_history_${normEmail}`;
    const current = getScanHistory(normEmail);
    const filtered = current.filter(item => item.id !== scanWithUser.id);
    const updated = [scanWithUser, ...filtered];
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Sync scan record to MongoDB threat-detection database under userEmail
    try {
      syncScanToMongoDB(scanWithUser, normEmail);
    } catch (err) {
      console.warn('MongoDB sync notice:', err);
    }

    notifyLiveScanUpdate(normEmail);
    return updated;
  } catch (e) {
    console.error('Error saving scan to history:', e);
    return getScanHistory(userEmail);
  }
}

export function removeScanFromHistory(id: string, userEmail?: string): ScanResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail);

    if (!normEmail) {
      const currentGuestScans = getGuestSessionScans();
      const updated = currentGuestScans.filter(item => item.id !== id);
      saveGuestSessionScans(updated);
      return updated;
    }

    const storageKey = `malvision_scan_history_${normEmail}`;
    const current = getScanHistory(normEmail);
    const updated = current.filter(item => item.id !== id);
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    deleteMongoScan(id, normEmail);
    notifyLiveScanUpdate(normEmail);
    return updated;
  } catch (e) {
    console.error('Error removing scan from history:', e);
    return getScanHistory(userEmail);
  }
}

export function clearScanHistory(userEmail?: string): ScanResultData[] {
  try {
    const normEmail = normalizeEmail(userEmail);

    if (!normEmail) {
      saveGuestSessionScans([]);
      return [];
    }

    const storageKey = `malvision_scan_history_${normEmail}`;
    localStorage.setItem(storageKey, JSON.stringify([]));
    clearMongoScanHistory(normEmail);
    notifyLiveScanUpdate(normEmail);
    return [];
  } catch (e) {
    console.error('Error clearing scan history:', e);
    return [];
  }
}
