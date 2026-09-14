import type { ScanResultData } from '../types';
import { broadcastSyncEvent } from './syncChannel';
import { getActiveSession } from './userStore';

const GUEST_SESSION_KEY = 'malvision_guest_session_history';
let activeUserScansCache: ScanResultData[] | null = null;

/**
 * Safely formats Date & Time string for display across History Page & Modals
 * Example output: "Sep 15, 2026, 12:28 AM"
 */
export function formatScanDateTime(rawTimestamp?: string, createdAt?: string): string {
  const val = createdAt || rawTimestamp;
  if (!val) return 'Just now';

  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return val;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const session = getActiveSession();
  if (session) {
    if (session.id) {
      headers['x-malvision-user-id'] = session.id;
      headers['Authorization'] = `Bearer ${session.id}`;
    }
    if (session.email) {
      headers['x-malvision-user-email'] = session.email;
    }
  }
  return headers;
}

function getLocalUserScans(userAccountKey?: string): ScanResultData[] {
  try {
    const key = userAccountKey ? `malvision_scans_${userAccountKey.toLowerCase().trim()}` : GUEST_SESSION_KEY;
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalUserScans(scans: ScanResultData[], userAccountKey?: string): void {
  try {
    const key = userAccountKey ? `malvision_scans_${userAccountKey.toLowerCase().trim()}` : GUEST_SESSION_KEY;
    const raw = JSON.stringify(scans);
    localStorage.setItem(key, raw);
    sessionStorage.setItem(key, raw);
  } catch {
    /* ignore */
  }
}

/**
 * Async fetch of server-authoritative scan history for the authenticated user from MongoDB Atlas
 */
export async function fetchServerScanHistory(): Promise<ScanResultData[]> {
  const session = getActiveSession();
  const userAccountKey = session?.email || session?.id || 'guest';

  try {
    const res = await fetch('/api/scans', {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.scans)) {
        // Merge remote MongoDB scans with local cache (deduplicate by scan ID)
        const local = getLocalUserScans(userAccountKey);
        const map = new Map<string, ScanResultData>();
        
        // Put local first, then overwrite with server docs
        local.forEach((s) => map.set(s.id, s));
        data.scans.forEach((s: ScanResultData) => map.set(s.id, s));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime()
        );

        activeUserScansCache = merged;
        saveLocalUserScans(merged, userAccountKey);
        return merged;
      }
    }
  } catch (e) {
    console.warn('Scan history server query notice:', e);
  }

  const localScans = getLocalUserScans(userAccountKey);
  activeUserScansCache = localScans;
  return localScans;
}

/**
 * Returns scan history synchronously (from cache or local database)
 */
export function getScanHistory(userEmail?: string): ScanResultData[] {
  if (activeUserScansCache && activeUserScansCache.length > 0) {
    return activeUserScansCache;
  }
  const session = getActiveSession();
  const key = userEmail || session?.email || session?.id;
  const local = getLocalUserScans(key);
  if (local.length > 0) {
    activeUserScansCache = local;
    return local;
  }
  return [];
}

/**
 * Saves a new scan to MongoDB Atlas database & local history cache
 */
export async function saveScanToHistory(scan: ScanResultData, userEmail?: string): Promise<ScanResultData[]> {
  try {
    const scanId = scan.id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const scanRecord: ScanResultData = {
      ...scan,
      id: scanId,
      createdAt: scan.createdAt || now,
    };

    const session = getActiveSession();
    const userAccountKey = userEmail || session?.email || session?.id || 'guest';

    // 1. Immediately save to local database for instant UI response
    const currentLocal = getLocalUserScans(userAccountKey);
    const filteredLocal = currentLocal.filter((item) => item.id !== scanRecord.id);
    const updatedLocal = [scanRecord, ...filteredLocal];
    saveLocalUserScans(updatedLocal, userAccountKey);
    activeUserScansCache = updatedLocal;

    // 2. Post scan to MongoDB Atlas API
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify(scanRecord),
      });

      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          fetchServerScanHistory();
        }
      }
    } catch (err) {
      console.warn('MongoDB Atlas scan save notice (saved locally):', err);
    }

    broadcastSyncEvent('malvision:scan-created', { scanId });
    return updatedLocal;
  } catch (e) {
    console.error('Error saving scan:', e);
    return getScanHistory(userEmail);
  }
}

/**
 * Removes a scan record from MongoDB Atlas database & local storage
 */
export async function removeScanFromHistory(id: string, userEmail?: string): Promise<ScanResultData[]> {
  try {
    const session = getActiveSession();
    const userAccountKey = userEmail || session?.email || session?.id || 'guest';

    // 1. Immediately remove from local storage
    const currentLocal = getLocalUserScans(userAccountKey);
    const updatedLocal = currentLocal.filter((item) => item.id !== id);
    saveLocalUserScans(updatedLocal, userAccountKey);
    activeUserScansCache = updatedLocal;

    // 2. Delete from MongoDB Atlas
    try {
      await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch {
      /* ignore */
    }

    broadcastSyncEvent('malvision:scan-deleted', { scanId: id });
    return updatedLocal;
  } catch (e) {
    console.error('Error removing scan:', e);
    return getScanHistory(userEmail);
  }
}

/**
 * Clears scan history
 */
export async function clearScanHistory(userEmail?: string): Promise<ScanResultData[]> {
  try {
    const session = getActiveSession();
    const userAccountKey = userEmail || session?.email || session?.id || 'guest';

    saveLocalUserScans([], userAccountKey);
    activeUserScansCache = [];

    try {
      await fetch('/api/scans', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch {
      /* ignore */
    }

    broadcastSyncEvent('malvision:scan-deleted');
    return [];
  } catch (e) {
    console.error('Error clearing scan history:', e);
    return [];
  }
}

/**
 * Clears in-memory history cache on logout to prevent account data leaks
 */
export function clearActiveUserScansCache() {
  activeUserScansCache = null;
}
