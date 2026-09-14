/**
 * MALVISION GLOBAL TOAST NOTIFICATION ENGINE
 * Handles top-right floating notifications with smooth slide-in / slide-out animations.
 */

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
  exiting?: boolean;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string) {
  // Mark as exiting for smooth slide-out animation
  toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t));
  notifyListeners();

  // Remove after slide-out transition
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 250);
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3500): string {
  if (!message || !message.trim()) return '';

  const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newToast: ToastItem = {
    id,
    message: message.trim(),
    type,
    duration,
    exiting: false,
  };

  // Limit max concurrent toasts to 3 for clean top-right stacking
  if (toasts.length >= 3) {
    toasts = toasts.slice(1);
  }

  toasts = [...toasts, newToast];
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}
