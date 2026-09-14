/**
 * MALVISION MULTI-TAB & REAL-TIME SYNCHRONIZATION ENGINE
 * Uses BroadcastChannel with fallback to window storage events.
 */

export type SyncEventType =
  | 'malvision:auth-changed'
  | 'malvision:scan-created'
  | 'malvision:scan-updated'
  | 'malvision:scan-deleted'
  | 'malvision:history-invalidated';

export interface SyncMessagePayload {
  type: SyncEventType;
  userId?: string;
  scanId?: string;
  revokedSessionId?: string;
  timestamp: number;
}

const CHANNEL_NAME = 'malvision_cross_tab_sync';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

/**
 * Broadcasts a synchronization event to all other open tabs in the browser.
 * NEVER contains sensitive data (no passwords, session tokens, or raw credentials).
 */
export function broadcastSyncEvent(type: SyncEventType, payload?: { userId?: string; scanId?: string; revokedSessionId?: string }) {
  const eventData: SyncMessagePayload = {
    type,
    userId: payload?.userId,
    scanId: payload?.scanId,
    revokedSessionId: payload?.revokedSessionId,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel (primary instant cross-tab sync)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(eventData);
    } catch (e) {
      console.warn('BroadcastChannel postMessage notice:', e);
    }
  }

  // 2. Window Custom Event (same tab dispatch)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('malvision_sync_event', { detail: eventData }));

    // 3. Storage event fallback (cross-tab fallback)
    try {
      localStorage.setItem('malvision_last_sync_ping', JSON.stringify(eventData));
    } catch {
      /* ignore storage quota */
    }
  }
}

/**
 * Subscribes to multi-tab synchronization events.
 */
export function subscribeToSyncEvents(callback: (payload: SyncMessagePayload) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Listener for BroadcastChannel
  const handleMessage = (event: MessageEvent<SyncMessagePayload>) => {
    if (event.data && event.data.type) {
      callback(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleMessage);
  }

  // Listener for Window Custom Event (same tab)
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<SyncMessagePayload>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener('malvision_sync_event', handleCustomEvent);

  // Listener for Storage Event (cross tab fallback)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'malvision_last_sync_ping' && e.newValue) {
      try {
        const payload: SyncMessagePayload = JSON.parse(e.newValue);
        callback(payload);
      } catch {
        /* ignore */
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Cleanup handler
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('malvision_sync_event', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
