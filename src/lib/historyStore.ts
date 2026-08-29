import type { ScanResultData } from '../types';
import { syncScanToMongoDB, fetchMongoScanHistory, deleteMongoScan, clearMongoScanHistory } from './mongoService';

// Transient memory storage for guest user sessions (cleared on page reload / session end)
let transientGuestScans: ScanResultData[] = [];

export function getScanHistory(userEmail?: string): ScanResultData[] {
  try {
    // If not signed in (Guest User), return only transient guest session scans
    if (!userEmail) {
      return transientGuestScans;
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
    return userEmail ? [] : transientGuestScans;
  }
}

export function saveScanToHistory(scan: ScanResultData, userEmail?: string): ScanResultData[] {
  try {
    const scanWithUser: ScanResultData = {
      ...scan,
      userEmail: userEmail || scan.userEmail
    };

    // If guest user, store in transient session memory only
    if (!userEmail) {
      transientGuestScans = [scanWithUser, ...transientGuestScans.filter(item => item.id !== scanWithUser.id)];
      return transientGuestScans;
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
      transientGuestScans = transientGuestScans.filter(item => item.id !== id);
      return transientGuestScans;
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
      transientGuestScans = [];
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
