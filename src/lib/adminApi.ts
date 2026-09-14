import { getAuthHeaders } from './authApi';
import type { UserRecord } from './userStore';
import type { ScanResultData } from '../types';

export interface AdminStatsData {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  superAdminUsers: number;
  totalScans: number;
  safeScans: number;
  suspiciousScans: number;
  maliciousScans: number;
  unknownScans: number;
  totalVisionScans: number;
  activeSessions: number;
  totalAuditLogs: number;
  recentUsers: UserRecord[];
  recentScans: ScanResultData[];
  recentAuditLogs: AdminAuditLogData[];
}

export interface AdminAuditLogData {
  id: string;
  adminUserId: string;
  adminUsername: string;
  action: string;
  targetType: 'user' | 'scan' | 'vision' | 'session' | 'security' | 'system';
  targetId?: string;
  details?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
}

export interface AdminSessionData {
  sessionId: string;
  maskedSessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function fetchAdminStats(): Promise<{ success: boolean; stats?: AdminStatsData; error?: string }> {
  try {
    const res = await fetch('/api/admin/stats', {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch admin statistics.' };
    }
    return { success: true, stats: body.stats };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error fetching admin stats.' };
  }
}

export async function fetchAdminUsers(params?: { search?: string; role?: string; status?: string; limit?: number; offset?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/users?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch users list.', total: 0, users: [] };
    }
    return { success: true, total: body.total || 0, users: (body.users || []) as UserRecord[] };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.', total: 0, users: [] };
  }
}

export async function fetchAdminUserDetail(userId: string) {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch user detail.' };
    }
    return {
      success: true,
      user: body.user as UserRecord,
      scanCount: body.scanCount || 0,
      visionCount: body.visionCount || 0,
      sessionCount: body.sessionCount || 0,
      recentScans: body.recentScans || [],
      activeSessions: body.activeSessions || [],
      userAuditLogs: body.userAuditLogs || [],
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function updateAdminUser(
  userId: string,
  updates: { fullName?: string; username?: string; role?: 'user' | 'superadmin'; status?: 'active' | 'disabled' }
) {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to update user account.' };
    }
    return { success: true, user: body.user as UserRecord };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function deleteAdminUser(userId: string) {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to delete user account.' };
    }
    return { success: true, deletedCount: body.deletedCount || 1 };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function fetchAdminScans(params?: { search?: string; status?: string; targetType?: string; userId?: string; limit?: number; offset?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/scans?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch scans.', total: 0, scans: [] };
    }
    return { success: true, total: body.total || 0, scans: (body.scans || []) as ScanResultData[] };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.', total: 0, scans: [] };
  }
}

export async function deleteAdminScan(scanId: string) {
  try {
    const res = await fetch(`/api/admin/scans/${encodeURIComponent(scanId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to delete scan record.' };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function fetchAdminVisionScans(params?: { search?: string; classification?: string; userId?: string; limit?: number; offset?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.classification) query.set('classification', params.classification);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/vision-scans?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch vision scans.', total: 0, items: [] };
    }
    return { success: true, total: body.total || 0, items: body.items || [] };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.', total: 0, items: [] };
  }
}

export async function deleteAdminVisionScan(visionId: string) {
  try {
    const res = await fetch(`/api/admin/vision-scans/${encodeURIComponent(visionId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to delete vision scan record.' };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function fetchAdminSessions(params?: { userId?: string; limit?: number; offset?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/sessions?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch sessions.', total: 0, sessions: [] };
    }
    return { success: true, total: body.total || 0, sessions: (body.sessions || []) as AdminSessionData[] };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.', total: 0, sessions: [] };
  }
}

export async function revokeAdminSession(sessionId: string) {
  try {
    const res = await fetch(`/api/admin/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to revoke session.' };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function revokeAdminUserSessions(userId: string) {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/sessions`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to revoke user sessions.' };
    }
    return { success: true, revokedCount: body.revokedCount || 0 };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.' };
  }
}

export async function fetchAdminAuditLogs(params?: { targetType?: string; action?: string; limit?: number; offset?: number }) {
  try {
    const query = new URLSearchParams();
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      return { success: false, error: body.error || 'Failed to fetch audit logs.', total: 0, logs: [] };
    }
    return { success: true, total: body.total || 0, logs: (body.logs || []) as AdminAuditLogData[] };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error.', total: 0, logs: [] };
  }
}

export async function verifyPasswordHashTool(password: string, hash: string): Promise<{ success: boolean; valid?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/security/verify-password-hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify({ password, hash }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { success: false, error: body.error || 'Hash verification failed.' };
    }
    if (body.error) {
      return { success: false, valid: false, error: body.error };
    }
    return { success: true, valid: Boolean(body.valid) };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error verifying hash.' };
  }
}

/**
 * Data Management: Export dataset to downloadable JSON/CSV file
 */
export function exportDataToFile(data: any, filename: string, format: 'json' | 'csv' = 'json') {
  let content = '';
  let mimeType = 'application/json';

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else {
    // Basic CSV generator
    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
      const header = keys.join(',');
      const rows = data.map((item) =>
        keys
          .map((k) => {
            const val = item[k];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      content = [header, ...rows].join('\n');
    } else {
      content = 'No data available';
    }
    mimeType = 'text/csv';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

