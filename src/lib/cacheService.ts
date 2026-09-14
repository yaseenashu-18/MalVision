/**
 * Namespaced Client Cache Management Utility
 * Safely removes temporary UI/client cache items without wiping authentication,
 * user accounts, database scan history, or persistent settings.
 */

import { fetchServerScanHistory } from './historyStore';
import { fetchServerVisionHistory } from './visionStore';

export function clearApplicationCache(): boolean {
  try {
    // 1. Target only temporary cache keys in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('malvision_cache_') || key.startsWith('malvision_temp_') || key.endsWith('_preview'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 2. Clear temporary sessionStorage cache items (keeping non-persistent temporary render buffers)
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('malvision_cache_') || key.startsWith('malvision_temp_'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));

    // 3. Clear browser performance resource marks if available
    if (typeof window !== 'undefined' && window.performance && window.performance.clearMarks) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }

    // 4. Safely re-sync database scan history to ensure zero database data loss
    fetchServerScanHistory().catch(() => {});
    fetchServerVisionHistory().catch(() => {});

    return true;
  } catch (e) {
    console.error('Error clearing temporary cache:', e);
    return false;
  }
}
