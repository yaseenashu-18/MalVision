import type { ScanResultData } from '../types';
import { syncScanToMongoDB, fetchMongoScanHistory, deleteMongoScan, clearMongoScanHistory } from './mongoService';

const GUEST_SESSION_KEY = 'malvision_guest_session_history';

// Helper to safely access guest session history (persists across page reloads & tab navigation)
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

export function getScanHistory(userEmail?: string): ScanResultData[] {
  try {
    // If not signed in (Guest User), return session-persisted guest scans (survives tab switches & reloads)
    if (!userEmail) {
      return getGuestSessionScans();
    }

    // For Signed-In users, fetch user-specific scans from local storage and MongoDB
    const storageKey = `malvision_scan_history_${userEmail}`;
    const mongoScans = fetchMongoScanHistory(userEmail);
    const raw = localStorage.getItem(storageKey);
    
    let localScans: ScanResultData[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localScans = parsed.filter(item => item && typeof item.target === 'string' && typeof item.id === 'string');
      }
    }

    // Merge mongo database scans with local user scans, deduplicating by ID
    const mergedMap = new Map<string, ScanResultData>();
    [...mongoScans, ...localScans].forEach((scan) => {
      if (scan && scan.id) {
        mergedMap.set(scan.id, { ...scan, userEmail });
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
    const scanWithUser: ScanResultData = {
      ...scan,
      userEmail: userEmail || scan.userEmail
    };

    // If guest user, store in sessionStorage (persists through tab switches & page reloads)
    if (!userEmail) {
      const currentGuestScans = getGuestSessionScans();
      const filtered = currentGuestScans.filter(item => item.id !== scanWithUser.id);
      const updated = [scanWithUser, ...filtered];
      saveGuestSessionScans(updated);
      return updated;
    }

    // For Signed-In users, store in user-specific key & sync to MongoDB
    const storageKey = `malvision_scan_history_${userEmail}`;
    const current = getScanHistory(userEmail);
    const filtered = current.filter(item => item.id !== scanWithUser.id);
    const updated = [scanWithUser, ...filtered];
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Sync scan record to MongoDB threat-detection database under userEmail
    try {
      syncScanToMongoDB(scanWithUser, userEmail);
    } catch (err) {
      console.warn('MongoDB sync notice:', err);
    }

    return updated;
  } catch (e) {
    console.error('Error saving scan to history:', e);
    return getScanHistory(userEmail);
  }
}

export function removeScanFromHistory(id: string, userEmail?: string): ScanResultData[] {
  try {
    if (!userEmail) {
      const currentGuestScans = getGuestSessionScans();
      const updated = currentGuestScans.filter(item => item.id !== id);
      saveGuestSessionScans(updated);
      return updated;
    }

    const storageKey = `malvision_scan_history_${userEmail}`;
    const current = getScanHistory(userEmail);
    const updated = current.filter(item => item.id !== id);
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    deleteMongoScan(id, userEmail);
    return updated;
  } catch (e) {
    console.error('Error removing scan from history:', e);
    return getScanHistory(userEmail);
  }
}

export function clearScanHistory(userEmail?: string): ScanResultData[] {
  try {
    if (!userEmail) {
      saveGuestSessionScans([]);
      return [];
    }

    const storageKey = `malvision_scan_history_${userEmail}`;
    localStorage.setItem(storageKey, JSON.stringify([]));
    clearMongoScanHistory(userEmail);
    return [];
  } catch (e) {
    console.error('Error clearing scan history:', e);
    return [];
  }
}
