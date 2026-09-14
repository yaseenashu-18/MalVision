import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  Eye,
  KeyRound,
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Trash2,
  Ban,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
  Database,
  Radio,
  Key,
  X,
  Download,
  BarChart2,
  PieChart,
  HardDrive,
  FileSpreadsheet,
  Server,
  Zap,
  Sparkles,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUserDetail,
  updateAdminUser,
  deleteAdminUser,
  fetchAdminScans,
  deleteAdminScan,
  fetchAdminVisionScans,
  deleteAdminVisionScan,
  fetchAdminSessions,
  revokeAdminSession,
  revokeAdminUserSessions,
  fetchAdminAuditLogs,
  verifyPasswordHashTool,
  exportDataToFile,
  type AdminStatsData,
  type AdminAuditLogData,
  type AdminSessionData,
} from '../lib/adminApi';
import type { UserRecord } from '../lib/userStore';
import type { ScanResultData } from '../types';

interface SuperAdminPageProps {
  onNavigate: (page: string) => void;
  currentUser?: { id?: string; name: string; email: string; username?: string; role?: string } | null;
}

type AdminTab = 'analytics' | 'users' | 'scans' | 'vision' | 'sessions' | 'database' | 'security';

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // User Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: UserRecord;
    scanCount: number;
    visionCount: number;
    sessionCount: number;
    recentScans: ScanResultData[];
    activeSessions: AdminSessionData[];
    userAuditLogs: AdminAuditLogData[];
  } | null>(null);
  const [_loadingUserDetail, setLoadingUserDetail] = useState<boolean>(false);
  const [detailActiveTab, setDetailActiveTab] = useState<'profile' | 'scans' | 'sessions' | 'security'>('profile');

  // Scans State
  const [scans, setScans] = useState<ScanResultData[]>([]);
  const [scansTotal, setScansTotal] = useState<number>(0);
  const [scanSearch, setScanSearch] = useState<string>('');
  const [scanStatusFilter, setScanStatusFilter] = useState<string>('');
  const [scanTypeFilter, _setScanTypeFilter] = useState<string>('');
  const [loadingScans, setLoadingScans] = useState<boolean>(false);

  // Vision Scans State
  const [visionScans, setVisionScans] = useState<any[]>([]);
  const [visionTotal, setVisionTotal] = useState<number>(0);
  const [visionFilter, setVisionFilter] = useState<string>('');
  const [loadingVision, setLoadingVision] = useState<boolean>(false);

  // Sessions State
  const [sessions, setSessions] = useState<AdminSessionData[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState<number>(0);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogData[]>([]);
  const [auditTotal, setAuditTotal] = useState<number>(0);
  const [auditTargetFilter, setAuditTargetFilter] = useState<string>('');
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  // PBKDF2 Hash Verifier Tool State
  const [verifierPassword, setVerifierPassword] = useState<string>('');
  const [verifierHash, setVerifierHash] = useState<string>('');
  const [verifierResult, setVerifierResult] = useState<{ checked: boolean; valid?: boolean; error?: string } | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Export State
  const [exportingFormat, setExportingFormat] = useState<'json' | 'csv'>('json');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'delete_user' | 'disable_user' | 'enable_user' | 'change_role' | 'delete_scan' | 'delete_vision' | 'revoke_session' | 'revoke_all_sessions' | 'database_backup';
    targetId: string;
    payload?: any;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'delete_user',
    targetId: '',
  });

  const displayNotice = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 6000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Load Dashboard Stats
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const res = await fetchAdminStats();
    if (res.success && res.stats) {
      setStats(res.stats);
    } else if (res.error) {
      displayNotice(res.error, true);
    }
    setLoadingStats(false);
  }, []);

  // Load Users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const res = await fetchAdminUsers({
      search: userSearch,
      role: userRoleFilter,
      status: userStatusFilter,
      limit: 100,
    });
    if (res.success) {
      setUsers(res.users);
      setUsersTotal(res.total);
    } else {
      displayNotice(res.error || 'Failed to load users', true);
    }
    setLoadingUsers(false);
  }, [userSearch, userRoleFilter, userStatusFilter]);

  // Load Scans
  const loadScans = useCallback(async () => {
    setLoadingScans(true);
    const res = await fetchAdminScans({
      search: scanSearch,
      status: scanStatusFilter,
      targetType: scanTypeFilter,
      limit: 100,
    });
    if (res.success) {
      setScans(res.scans);
      setScansTotal(res.total);
    } else {
      displayNotice(res.error || 'Failed to load scans', true);
    }
    setLoadingScans(false);
  }, [scanSearch, scanStatusFilter, scanTypeFilter]);

  // Load Vision Scans
  const loadVisionScans = useCallback(async () => {
    setLoadingVision(true);
    const res = await fetchAdminVisionScans({
      classification: visionFilter,
      limit: 100,
    });
    if (res.success) {
      setVisionScans(res.items);
      setVisionTotal(res.total);
    } else {
      displayNotice(res.error || 'Failed to load vision scans', true);
    }
    setLoadingVision(false);
  }, [visionFilter]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    const res = await fetchAdminSessions({ limit: 100 });
    if (res.success) {
      setSessions(res.sessions);
      setSessionsTotal(res.total);
    } else {
      displayNotice(res.error || 'Failed to load sessions', true);
    }
    setLoadingSessions(false);
  }, []);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    const res = await fetchAdminAuditLogs({ targetType: auditTargetFilter, limit: 100 });
    if (res.success) {
      setAuditLogs(res.logs);
      setAuditTotal(res.total);
    } else {
      displayNotice(res.error || 'Failed to load audit logs', true);
    }
    setLoadingAudit(false);
  }, [auditTargetFilter]);

  // Trigger load when tab changes
  useEffect(() => {
    if (activeTab === 'analytics') loadStats();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'scans') loadScans();
    if (activeTab === 'vision') loadVisionScans();
    if (activeTab === 'sessions') loadSessions();
    if (activeTab === 'database') {
      loadStats();
      loadUsers();
      loadScans();
    }
    if (activeTab === 'security') {
      loadAuditLogs();
    }
  }, [activeTab, loadStats, loadUsers, loadScans, loadVisionScans, loadSessions, loadAuditLogs]);

  // Inspect User Detail
  const handleViewUserDetail = async (userId: string) => {
    setLoadingUserDetail(true);
    const res = await fetchAdminUserDetail(userId);
    if (res.success && res.user) {
      setSelectedUserDetail({
        user: res.user,
        scanCount: res.scanCount,
        visionCount: res.visionCount,
        sessionCount: res.sessionCount,
        recentScans: res.recentScans,
        activeSessions: res.activeSessions,
        userAuditLogs: res.userAuditLogs,
      });
      setDetailActiveTab('profile');
    } else {
      displayNotice(res.error || 'Failed to view user detail.', true);
    }
    setLoadingUserDetail(false);
  };

  // Export Collection Dataset
  const handleExportDataset = (collection: 'users' | 'scans' | 'vision' | 'audit') => {
    const timestamp = new Date().toISOString().split('T')[0];
    if (collection === 'users') {
      exportDataToFile(users, `malvision_users_${timestamp}.${exportingFormat}`, exportingFormat);
      displayNotice(`Exported ${users.length} user records (${exportingFormat.toUpperCase()})`);
    } else if (collection === 'scans') {
      exportDataToFile(scans, `malvision_threat_scans_${timestamp}.${exportingFormat}`, exportingFormat);
      displayNotice(`Exported ${scans.length} scan records (${exportingFormat.toUpperCase()})`);
    } else if (collection === 'vision') {
      exportDataToFile(visionScans, `malvision_vision_scans_${timestamp}.${exportingFormat}`, exportingFormat);
      displayNotice(`Exported ${visionScans.length} vision records (${exportingFormat.toUpperCase()})`);
    } else if (collection === 'audit') {
      exportDataToFile(auditLogs, `malvision_audit_logs_${timestamp}.${exportingFormat}`, exportingFormat);
      displayNotice(`Exported ${auditLogs.length} audit log entries (${exportingFormat.toUpperCase()})`);
    }
  };

  // Full Database Snapshot Generator
  const handleFullBackupSnapshot = async () => {
    displayNotice('Generating full system database snapshot...');
    const timestamp = new Date().toISOString();
    const snapshotPayload = {
      system: 'MalVision Super Admin Data Management System',
      exportedAt: timestamp,
      database: 'threat-detection',
      stats: stats,
      users: users,
      scans: scans,
      visionScans: visionScans,
      sessions: sessions,
      auditLogs: auditLogs,
    };
    exportDataToFile(snapshotPayload, `malvision_full_database_snapshot_${timestamp.split('T')[0]}.json`, 'json');
    displayNotice('Full system database snapshot downloaded successfully!');
  };

  // Perform Confirmed Action
  const executeConfirmedAction = async () => {
    const { actionType, targetId, payload } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    if (actionType === 'disable_user') {
      const res = await updateAdminUser(targetId, { status: 'disabled' });
      if (res.success) {
        displayNotice('User account disabled successfully.');
        loadUsers();
        if (selectedUserDetail?.user.id === targetId) handleViewUserDetail(targetId);
      } else {
        displayNotice(res.error || 'Failed to disable user.', true);
      }
    } else if (actionType === 'enable_user') {
      const res = await updateAdminUser(targetId, { status: 'active' });
      if (res.success) {
        displayNotice('User account enabled successfully.');
        loadUsers();
        if (selectedUserDetail?.user.id === targetId) handleViewUserDetail(targetId);
      } else {
        displayNotice(res.error || 'Failed to enable user.', true);
      }
    } else if (actionType === 'change_role') {
      const newRole = payload?.newRole;
      const res = await updateAdminUser(targetId, { role: newRole });
      if (res.success) {
        displayNotice(`User role updated to ${newRole}.`);
        loadUsers();
        if (selectedUserDetail?.user.id === targetId) handleViewUserDetail(targetId);
      } else {
        displayNotice(res.error || 'Failed to update user role.', true);
      }
    } else if (actionType === 'delete_user') {
      const res = await deleteAdminUser(targetId);
      if (res.success) {
        displayNotice('User account and associated records deleted.');
        if (selectedUserDetail?.user.id === targetId) setSelectedUserDetail(null);
        loadUsers();
      } else {
        displayNotice(res.error || 'Failed to delete user.', true);
      }
    } else if (actionType === 'delete_scan') {
      const res = await deleteAdminScan(targetId);
      if (res.success) {
        displayNotice('Scan record deleted.');
        loadScans();
      } else {
        displayNotice(res.error || 'Failed to delete scan record.', true);
      }
    } else if (actionType === 'delete_vision') {
      const res = await deleteAdminVisionScan(targetId);
      if (res.success) {
        displayNotice('Vision scan record deleted.');
        loadVisionScans();
      } else {
        displayNotice(res.error || 'Failed to delete vision scan record.', true);
      }
    } else if (actionType === 'revoke_session') {
      const res = await revokeAdminSession(targetId);
      if (res.success) {
        displayNotice('Session revoked successfully.');
        loadSessions();
        if (selectedUserDetail) handleViewUserDetail(selectedUserDetail.user.id);
      } else {
        displayNotice(res.error || 'Failed to revoke session.', true);
      }
    } else if (actionType === 'revoke_all_sessions') {
      const res = await revokeAdminUserSessions(targetId);
      if (res.success) {
        displayNotice(`Revoked ${res.revokedCount} session(s) for user.`);
        loadSessions();
        if (selectedUserDetail?.user.id === targetId) handleViewUserDetail(targetId);
      } else {
        displayNotice(res.error || 'Failed to revoke user sessions.', true);
      }
    } else if (actionType === 'database_backup') {
      await handleFullBackupSnapshot();
    }
  };

  // PBKDF2 Hash Verifier Execution
  const handleVerifyHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierPassword || !verifierHash) {
      displayNotice('Please enter both candidate password and PBKDF2 hash.', true);
      return;
    }
    setVerifying(true);
    setVerifierResult(null);
    const res = await verifyPasswordHashTool(verifierPassword, verifierHash);
    if (res.success && typeof res.valid === 'boolean') {
      setVerifierResult({ checked: true, valid: res.valid });
    } else {
      setVerifierResult({ checked: true, valid: false, error: res.error || 'Invalid hash format or parameters.' });
    }
    setVerifying(false);
  };

  // Derived Analytics Computations
  const totalScansAll = (stats?.totalScans || 0) + (stats?.totalVisionScans || 0);
  const maliciousCount = (stats?.maliciousScans || 0);
  const suspiciousCount = (stats?.suspiciousScans || 0);
  const safeCount = (stats?.safeScans || 0);
  const threatPercentage = totalScansAll > 0 ? Math.round(((maliciousCount + suspiciousCount) / totalScansAll) * 100) : 0;
  const safePercentage = totalScansAll > 0 ? Math.round((safeCount / totalScansAll) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col font-sans pt-16 select-none">
      {/* Top Glassmorphic Header */}
      <header className="border-b border-neutral-800/80 bg-[#0d0d10]/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-16 z-40 shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center space-x-2">
                <span>MALVISION SUPER ADMIN</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </h1>
              <span className="px-2.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full uppercase tracking-wider">
                Control & Analytics Engine
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Authenticated Admin: <span className="text-neutral-200 font-mono font-bold">{currentUser?.username || 'yaseenashu1874'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>MongoDB Atlas:</span>
            <span className="text-emerald-400 font-bold">Connected</span>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'analytics') loadStats();
              if (activeTab === 'users') loadUsers();
              if (activeTab === 'scans') loadScans();
              if (activeTab === 'vision') loadVisionScans();
              if (activeTab === 'sessions') loadSessions();
              if (activeTab === 'database') loadStats();
              if (activeTab === 'security') loadAuditLogs();
            }}
            className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center space-x-2 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh Sync</span>
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-1.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 text-xs font-black flex items-center space-x-2 transition cursor-pointer shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to App</span>
          </button>
        </div>
      </header>

      {/* Main Administrative Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-neutral-800/80 bg-[#0b0b0e] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Intelligence & Analytics
            </div>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analytics & Metrics</span>
            </button>

            <div className="pt-3 px-3 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Data & System Control
            </div>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('scans')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'scans'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Threat Scans</span>
            </button>

            <button
              onClick={() => setActiveTab('vision')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'vision'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Vision Scans</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Active Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Data Management</span>
            </button>

            <div className="pt-3 px-3 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Security & Audit
            </div>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security & Audit</span>
            </button>
          </div>

          {/* Database Live Telemetry */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2.5 text-xs shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-neutral-200 font-bold">
                <Database className="w-4 h-4 text-amber-400" />
                <span>MongoDB Atlas</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">~12ms</span>
            </div>
            <div className="space-y-1 text-[11px] text-neutral-400">
              <p>Cluster: <span className="text-neutral-200 font-mono">threat-detection</span></p>
              <p>Collections: <span className="text-neutral-200 font-mono">5 active</span></p>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-semibold pt-1 border-t border-neutral-800/80">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Authoritative Real-Time Data</span>
            </div>
          </div>
        </aside>

        {/* View Content Area */}
        <main className="flex-1 bg-[#070709] p-6 overflow-y-auto max-w-7xl">
          {/* Global Notice Alerts */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between animate-in fade-in shadow-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in shadow-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="p-1 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: ADVANCED ANALYTICS & SYSTEM METRICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-amber-400" />
                    <span>Executive Analytics & Intelligence</span>
                  </h2>
                  <p className="text-xs text-neutral-400">Comprehensive system telemetry, threat trends, and usage metrics</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleExportDataset('scans')}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export Analytics</span>
                  </button>
                </div>
              </div>

              {loadingStats ? (
                <div className="py-24 text-center text-neutral-400 text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Aggregating MongoDB Atlas metrics...</p>
                </div>
              ) : (
                <>
                  {/* Grid Key Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800/80 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                        <span>Total User Accounts</span>
                        <Users className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
                      <div className="flex items-center space-x-2 text-[11px] text-neutral-400 pt-1">
                        <span className="text-emerald-400 font-bold">{stats?.activeUsers || 0} Active</span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">{stats?.disabledUsers || 0} Disabled</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800/80 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                        <span>Total Threat Scans</span>
                        <FileText className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{stats?.totalScans || 0}</div>
                      <div className="flex items-center space-x-2 text-[11px] text-neutral-400 pt-1">
                        <span className="text-emerald-400 font-bold">{stats?.safeScans || 0} Safe</span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">{stats?.maliciousScans || 0} Malicious</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800/80 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                        <span>Vision Intelligence</span>
                        <Eye className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{stats?.totalVisionScans || 0}</div>
                      <p className="text-[11px] text-neutral-400 pt-1">Multimodal vision threat records</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800/80 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
                        <span>Active Server Sessions</span>
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-3xl font-black text-white">{stats?.activeSessions || 0}</div>
                      <p className="text-[11px] text-neutral-400 pt-1">Validated MongoDB TTL sessions</p>
                    </div>
                  </div>

                  {/* Threat Risk & Ratio Analytics Visualizers */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visualizer 1: System Threat Breakdown */}
                    <div className="p-6 rounded-2xl bg-[#121215] border border-neutral-800/80 space-y-4 shadow-lg lg:col-span-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                          <PieChart className="w-4 h-4 text-amber-400" />
                          <span>System Threat Verdict Distribution</span>
                        </h3>
                        <span className="text-xs text-neutral-400 font-mono">Total: {totalScansAll} scans</span>
                      </div>

                      {/* Visual Bar Spectrum */}
                      <div className="space-y-2">
                        <div className="h-4 w-full rounded-full bg-neutral-900 overflow-hidden flex">
                          <div
                            style={{ width: `${safePercentage}%` }}
                            className="h-full bg-emerald-500 transition-all duration-500"
                            title={`Safe: ${safePercentage}%`}
                          />
                          <div
                            style={{ width: `${totalScansAll > 0 ? Math.round(((stats?.suspiciousScans || 0) / totalScansAll) * 100) : 0}%` }}
                            className="h-full bg-amber-500 transition-all duration-500"
                            title="Suspicious"
                          />
                          <div
                            style={{ width: `${totalScansAll > 0 ? Math.round(((stats?.maliciousScans || 0) / totalScansAll) * 100) : 0}%` }}
                            className="h-full bg-rose-500 transition-all duration-500"
                            title="Malicious"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2 text-xs">
                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-400">Safe Scans</span>
                            <div className="text-lg font-black text-white">{stats?.safeScans || 0}</div>
                            <p className="text-[10px] text-emerald-400">{safePercentage}% of total</p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-400">Suspicious</span>
                            <div className="text-lg font-black text-white">{stats?.suspiciousScans || 0}</div>
                            <p className="text-[10px] text-amber-400">
                              {totalScansAll > 0 ? Math.round(((stats?.suspiciousScans || 0) / totalScansAll) * 100) : 0}% of total
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-rose-400">Malicious</span>
                            <div className="text-lg font-black text-white">{stats?.maliciousScans || 0}</div>
                            <p className="text-[10px] text-rose-400">
                              {totalScansAll > 0 ? Math.round(((stats?.maliciousScans || 0) / totalScansAll) * 100) : 0}% of total
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visualizer 2: Risk Index Meter */}
                    <div className="p-6 rounded-2xl bg-[#121215] border border-neutral-800/80 space-y-4 shadow-lg flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Aggregate Threat Index</span>
                        </h3>
                        <p className="text-xs text-neutral-400">Overall risk ratio across all analyzed payloads</p>
                      </div>

                      <div className="text-center py-4 space-y-2">
                        <div className="text-5xl font-black text-white tracking-tight">{threatPercentage}%</div>
                        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                          {threatPercentage > 40 ? 'High Threat Concentration' : threatPercentage > 15 ? 'Moderate Risk Level' : 'Low Threat Level'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                        <div className="flex justify-between font-bold text-neutral-200">
                          <span>Super Admin Authority:</span>
                          <span className="text-emerald-400">Enforced</span>
                        </div>
                        <p>All data metrics aggregated live from MongoDB Atlas `threat-detection` database.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: USER ACCOUNTS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">User Accounts Directory ({usersTotal})</h2>
                  <p className="text-xs text-neutral-400">Authoritative user account control, role elevation, and access management</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search username or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="user">Role: User</option>
                    <option value="superadmin">Role: SuperAdmin</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Status: Active</option>
                    <option value="disabled">Status: Disabled</option>
                  </select>

                  <button
                    onClick={() => handleExportDataset('users')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="py-20 text-center text-neutral-400 text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Loading user directory from MongoDB Atlas...</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-[#121215]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">User</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Provider</th>
                          <th className="p-3.5">Created</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {users.length > 0 ? (
                          users.map((u) => (
                            <tr key={u.id} className="hover:bg-neutral-800/40 transition">
                              <td className="p-3.5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-amber-400">
                                    {u.username ? u.username[0].toUpperCase() : 'U'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white flex items-center space-x-2">
                                      <span>{u.username}</span>
                                      {u.fullName && <span className="text-neutral-400 font-normal">({u.fullName})</span>}
                                    </div>
                                    <div className="text-[11px] text-neutral-400">{u.normalizedEmail}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                    u.role === 'superadmin'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                  }`}
                                >
                                  {u.role || 'user'}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                    u.status === 'disabled'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {u.status || 'active'}
                                </span>
                              </td>

                              <td className="p-3.5 text-neutral-400 uppercase font-mono text-[10px]">
                                {u.provider || 'local'}
                              </td>

                              <td className="p-3.5 text-neutral-400 text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleViewUserDetail(u.id)}
                                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Details</span>
                                  </button>

                                  {u.status === 'disabled' ? (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Enable User Account',
                                          message: `Are you sure you want to re-enable user "@${u.username}"?`,
                                          actionType: 'enable_user',
                                          targetId: u.id,
                                        })
                                      }
                                      className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 cursor-pointer"
                                      title="Re-enable Account"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setConfirmModal({
                                          isOpen: true,
                                          title: 'Disable User Account',
                                          message: `Are you sure you want to disable user "@${u.username}"? They will be logged out and blocked from signing in.`,
                                          actionType: 'disable_user',
                                          targetId: u.id,
                                        })
                                      }
                                      className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-400 border border-amber-800/60 cursor-pointer"
                                      title="Disable Account"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() =>
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Delete User Account',
                                        message: `PERMANENT ACTION: Delete user "@${u.username}" along with their sessions, scan records, and vision scans?`,
                                        actionType: 'delete_user',
                                        targetId: u.id,
                                      })
                                    }
                                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 cursor-pointer"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-neutral-400 text-xs">
                              No matching user records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCANS DATABASE */}
          {activeTab === 'scans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Threat Scans Database ({scansTotal})</h2>
                  <p className="text-xs text-neutral-400">All threat analysis records stored across system</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search scan target or ID..."
                      value={scanSearch}
                      onChange={(e) => setScanSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
                    />
                  </div>

                  <select
                    value={scanStatusFilter}
                    onChange={(e) => setScanStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="safe">Status: Safe</option>
                    <option value="suspicious">Status: Suspicious</option>
                    <option value="malicious">Status: Malicious</option>
                  </select>

                  <button
                    onClick={() => handleExportDataset('scans')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {loadingScans ? (
                <div className="py-20 text-center text-neutral-400 text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Loading threat scans from MongoDB...</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-[#121215]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Scan Target / ID</th>
                          <th className="p-3.5">Type</th>
                          <th className="p-3.5">Verdict</th>
                          <th className="p-3.5">Owner User</th>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {scans.length > 0 ? (
                          scans.map((s) => (
                            <tr key={s.id} className="hover:bg-neutral-800/40 transition">
                              <td className="p-3.5">
                                <div className="font-bold text-white max-w-xs truncate">{s.target || s.id}</div>
                                <div className="text-[10px] font-mono text-neutral-500 truncate">{s.id}</div>
                              </td>

                              <td className="p-3.5 font-mono text-[10px] uppercase text-neutral-400">
                                {s.targetType || 'file'}
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                    s.status === 'Safe'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : s.status === 'Suspicious'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : s.status === 'Malicious'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-neutral-800 text-neutral-400'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>

                              <td className="p-3.5 font-mono text-[11px] text-neutral-300">
                                {s.userEmail ? s.userEmail : 'Anonymous'}
                              </td>

                              <td className="p-3.5 text-neutral-400 text-[11px]">
                                {new Date(s.timestamp).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Delete Scan Record',
                                      message: `Delete scan record "${s.target || s.id}" permanently from MongoDB?`,
                                      actionType: 'delete_scan',
                                      targetId: s.id,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-neutral-400 text-xs">
                              No threat scan records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VISION SCANS DATABASE */}
          {activeTab === 'vision' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Vision Threat Intelligence ({visionTotal})</h2>
                  <p className="text-xs text-neutral-400">Multimodal AI visual security analysis history</p>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={visionFilter}
                    onChange={(e) => setVisionFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="">All Classifications</option>
                    <option value="BENIGN">Benign</option>
                    <option value="SUSPICIOUS">Suspicious</option>
                    <option value="MALICIOUS">Malicious</option>
                  </select>

                  <button
                    onClick={() => handleExportDataset('vision')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {loadingVision ? (
                <div className="py-20 text-center text-neutral-400 text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Loading vision scans from MongoDB...</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-[#121215]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Record ID</th>
                          <th className="p-3.5">Threat Classification</th>
                          <th className="p-3.5">Risk Score</th>
                          <th className="p-3.5">Owner User</th>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {visionScans.length > 0 ? (
                          visionScans.map((v) => (
                            <tr key={v.id} className="hover:bg-neutral-800/40 transition">
                              <td className="p-3.5 font-mono text-[11px] text-white">
                                {v.id}
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                                    v.threatClassification === 'BENIGN'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : v.threatClassification === 'SUSPICIOUS'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {v.threatClassification || 'BENIGN'}
                                </span>
                              </td>

                              <td className="p-3.5 font-bold text-white">
                                {v.riskScore !== undefined ? `${v.riskScore}/100` : 'N/A'}
                              </td>

                              <td className="p-3.5 font-mono text-[11px] text-neutral-300">
                                {v.userId ? v.userId.substring(0, 12) + '...' : 'Anonymous'}
                              </td>

                              <td className="p-3.5 text-neutral-400 text-[11px]">
                                {new Date(v.timestamp).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Delete Vision Record',
                                      message: `Delete vision scan record "${v.id}" permanently?`,
                                      actionType: 'delete_vision',
                                      targetId: v.id,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 cursor-pointer"
                                  title="Delete Vision Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-neutral-400 text-xs">
                              No vision scan records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVE SESSIONS MONITOR */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Active Server Sessions ({sessionsTotal})</h2>
                  <p className="text-xs text-neutral-400">Authenticated user session tokens validated via MongoDB TTL</p>
                </div>
              </div>

              {loadingSessions ? (
                <div className="py-20 text-center text-neutral-400 text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Loading active sessions...</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-[#121215]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Session ID (Redacted)</th>
                          <th className="p-3.5">User ID</th>
                          <th className="p-3.5">IP Address</th>
                          <th className="p-3.5">Created</th>
                          <th className="p-3.5">Expires</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {sessions.length > 0 ? (
                          sessions.map((s) => (
                            <tr key={s.sessionId} className="hover:bg-neutral-800/40 transition">
                              <td className="p-3.5 font-mono text-[11px] text-amber-300 font-bold">
                                {s.maskedSessionId}
                              </td>

                              <td className="p-3.5 font-mono text-[11px] text-neutral-300">
                                {s.userId}
                              </td>

                              <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                                {s.ipAddress || '127.0.0.1'}
                              </td>

                              <td className="p-3.5 text-neutral-400 text-[11px]">
                                {new Date(s.createdAt).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-neutral-400 text-[11px]">
                                {new Date(s.expiresAt).toLocaleString()}
                              </td>

                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Revoke Session Token',
                                      message: `Revoke active session token "${s.maskedSessionId}" immediately?`,
                                      actionType: 'revoke_session',
                                      targetId: s.sessionId,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-semibold cursor-pointer"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-neutral-400 text-xs">
                              No active server sessions found in MongoDB.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DATA MANAGEMENT, EXPORT & BACKUP SNAPSHOT */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <HardDrive className="w-5 h-5 text-amber-400" />
                    <span>Data Management & Backup Suite</span>
                  </h2>
                  <p className="text-xs text-neutral-400">Live MongoDB collection inspector, JSON/CSV exports, and disaster recovery snapshot generator</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                    <button
                      onClick={() => setExportingFormat('json')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        exportingFormat === 'json' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setExportingFormat('csv')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        exportingFormat === 'csv' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400'
                      }`}
                    >
                      CSV
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        title: 'Generate Full System Snapshot',
                        message: 'Download complete system dataset snapshot (Users, Scans, Vision, Sessions & Audit Logs) as a single JSON file?',
                        actionType: 'database_backup',
                        targetId: 'snapshot',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Full Backup Snapshot</span>
                  </button>
                </div>
              </div>

              {/* Collections Grid Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Collection 1: Users */}
                <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>users</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{usersTotal} docs</span>
                  </div>
                  <p className="text-xs text-neutral-400">Stores user profiles, roles, PBKDF2 hash digests, and status.</p>
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Collection ID: db.users</span>
                    <button
                      onClick={() => handleExportDataset('users')}
                      className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export {exportingFormat.toUpperCase()}</span>
                    </button>
                  </div>
                </div>

                {/* Collection 2: Scans */}
                <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>scans</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{scansTotal} docs</span>
                  </div>
                  <p className="text-xs text-neutral-400">Stores threat intelligence analysis results, indicators, and risk scores.</p>
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Collection ID: db.scans</span>
                    <button
                      onClick={() => handleExportDataset('scans')}
                      className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export {exportingFormat.toUpperCase()}</span>
                    </button>
                  </div>
                </div>

                {/* Collection 3: Vision Scans */}
                <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>vision_scans</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{visionTotal} docs</span>
                  </div>
                  <p className="text-xs text-neutral-400">Multimodal AI visual threat detection scans and prompt analysis.</p>
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Collection ID: db.vision_scans</span>
                    <button
                      onClick={() => handleExportDataset('vision')}
                      className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export {exportingFormat.toUpperCase()}</span>
                    </button>
                  </div>
                </div>

                {/* Collection 4: Sessions */}
                <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>sessions</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{sessionsTotal} docs</span>
                  </div>
                  <p className="text-xs text-neutral-400">Native MongoDB BSON Date TTL index sessions for active user tokens.</p>
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Collection ID: db.sessions</span>
                    <span className="text-[11px] text-emerald-400 font-bold">TTL Auto-Expire</span>
                  </div>
                </div>

                {/* Collection 5: Audit Logs */}
                <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>admin_audit_logs</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{auditTotal} docs</span>
                  </div>
                  <p className="text-xs text-neutral-400">Append-only administrative operations log for compliance & security.</p>
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono">Collection ID: db.admin_audit_logs</span>
                    <button
                      onClick={() => handleExportDataset('audit')}
                      className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export {exportingFormat.toUpperCase()}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & AUDIT CENTER */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Security Command & Audit Center</span>
                  </h2>
                  <p className="text-xs text-neutral-400">Append-only administrative operations stream & PBKDF2 hash verifier</p>
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={auditTargetFilter}
                    onChange={(e) => setAuditTargetFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="">All Audit Targets</option>
                    <option value="user">Target: User</option>
                    <option value="scan">Target: Scan</option>
                    <option value="vision">Target: Vision</option>
                    <option value="session">Target: Session</option>
                    <option value="security">Target: Security</option>
                  </select>

                  <button
                    onClick={() => handleExportDataset('audit')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export Logs</span>
                  </button>
                </div>
              </div>

              {/* PBKDF2 Hash Verifier Utility */}
              <div className="p-6 rounded-2xl bg-[#121215] border border-neutral-800 space-y-4 shadow-lg">
                <div className="flex items-center space-x-2 text-sm font-bold text-white">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>PBKDF2-SHA256 Hash Verifier Tool (Zero-Log Compliance)</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Verify if a candidate password derives a target PBKDF2-SHA256 password hash using constant-time comparison without logging key bytes.
                </p>

                <form onSubmit={handleVerifyHash} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  <input
                    type="password"
                    required
                    placeholder="Candidate password..."
                    value={verifierPassword}
                    onChange={(e) => setVerifierPassword(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Target hash string..."
                    value={verifierHash}
                    onChange={(e) => setVerifierHash(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Verify</span>
                  </button>
                </form>

                {verifierResult && verifierResult.checked && (
                  <div className="pt-2 animate-in fade-in">
                    {verifierResult.valid ? (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold">MATCH CONFIRMED: Candidate password correctly derives the PBKDF2 hash.</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-bold">NO MATCH: {verifierResult.error || 'Password does not match hash.'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Audit Stream Table */}
              {loadingAudit ? (
                <div className="py-20 text-center text-neutral-400 text-xs space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                  <p>Loading audit logs stream...</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-[#121215]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5">Admin Username</th>
                          <th className="p-3.5">Action</th>
                          <th className="p-3.5">Target Type / ID</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                        {auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-neutral-800/40 transition">
                              <td className="p-3.5 text-neutral-400">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>

                              <td className="p-3.5 font-bold text-amber-300">
                                {log.adminUsername}
                              </td>

                              <td className="p-3.5 font-bold text-white">
                                {log.action}
                              </td>

                              <td className="p-3.5 text-neutral-300">
                                {log.targetType} {log.targetId ? `(${log.targetId.substring(0, 10)}...)` : ''}
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                    log.success
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {log.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                              </td>

                              <td className="p-3.5 text-neutral-400">
                                {log.ip || '127.0.0.1'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-neutral-400 text-xs font-sans">
                              No audit log records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* USER DETAIL MODAL / DRAWER */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] bg-[#121215] border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-amber-400 text-base">
                  {selectedUserDetail.user.username ? selectedUserDetail.user.username[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>@{selectedUserDetail.user.username}</span>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        selectedUserDetail.user.role === 'superadmin' ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {selectedUserDetail.user.role}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">{selectedUserDetail.user.normalizedEmail}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2 border-b border-neutral-800 py-3 shrink-0 text-xs">
              <button
                onClick={() => setDetailActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  detailActiveTab === 'profile' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Profile & Telemetry
              </button>
              <button
                onClick={() => setDetailActiveTab('scans')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  detailActiveTab === 'scans' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Scans ({selectedUserDetail.scanCount})
              </button>
              <button
                onClick={() => setDetailActiveTab('sessions')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  detailActiveTab === 'sessions' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Sessions ({selectedUserDetail.sessionCount})
              </button>
              <button
                onClick={() => setDetailActiveTab('security')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  detailActiveTab === 'security' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Security & Role
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {detailActiveTab === 'profile' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-semibold text-[10px] uppercase">User ID</span>
                    <div className="font-mono text-white text-xs">{selectedUserDetail.user.id}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-semibold text-[10px] uppercase">Full Name</span>
                    <div className="text-white text-xs">{selectedUserDetail.user.fullName || 'Not specified'}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-semibold text-[10px] uppercase">Provider</span>
                    <div className="text-white text-xs uppercase font-mono">{selectedUserDetail.user.provider || 'local'}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <span className="text-neutral-500 font-semibold text-[10px] uppercase">Account Created</span>
                    <div className="text-white text-xs">{new Date(selectedUserDetail.user.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {detailActiveTab === 'scans' && (
                <div className="space-y-2">
                  {selectedUserDetail.recentScans.length > 0 ? (
                    selectedUserDetail.recentScans.map((s) => (
                      <div key={s.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{s.target || s.id}</div>
                          <div className="text-[10px] text-neutral-400">{new Date(s.timestamp).toLocaleString()}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            s.status === 'Safe' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 py-4 text-center">No scan history found for user.</p>
                  )}
                </div>
              )}

              {detailActiveTab === 'sessions' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'Revoke All User Sessions',
                          message: `Revoke all ${selectedUserDetail.sessionCount} active session token(s) for user "@${selectedUserDetail.user.username}"?`,
                          actionType: 'revoke_all_sessions',
                          targetId: selectedUserDetail.user.id,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800 text-xs font-bold hover:bg-rose-900 transition cursor-pointer"
                    >
                      Revoke All User Sessions
                    </button>
                  </div>

                  {selectedUserDetail.activeSessions.length > 0 ? (
                    selectedUserDetail.activeSessions.map((s) => (
                      <div key={s.sessionId} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="font-mono text-amber-300 font-bold">{s.maskedSessionId}</div>
                          <div className="text-[10px] text-neutral-400">Expires: {new Date(s.expiresAt).toLocaleString()}</div>
                        </div>
                        <button
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: 'Revoke Session Token',
                              message: `Revoke session "${s.maskedSessionId}"?`,
                              actionType: 'revoke_session',
                              targetId: s.sessionId,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 py-4 text-center">No active sessions found for user.</p>
                  )}
                </div>
              )}

              {detailActiveTab === 'security' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                    <h4 className="font-bold text-white">Administrative Role Management</h4>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            title: 'Change User Role',
                            message: `Promote "@${selectedUserDetail.user.username}" to SuperAdmin authority?`,
                            actionType: 'change_role',
                            targetId: selectedUserDetail.user.id,
                            payload: { newRole: 'superadmin' },
                          })
                        }
                        disabled={selectedUserDetail.user.role === 'superadmin'}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer disabled:opacity-40"
                      >
                        Set Role: SuperAdmin
                      </button>

                      <button
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            title: 'Demote User Role',
                            message: `Demote "@${selectedUserDetail.user.username}" from SuperAdmin to standard User?`,
                            actionType: 'change_role',
                            targetId: selectedUserDetail.user.id,
                            payload: { newRole: 'user' },
                          })
                        }
                        disabled={selectedUserDetail.user.role === 'user'}
                        className="px-3.5 py-2 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-bold hover:bg-neutral-700 transition cursor-pointer disabled:opacity-40"
                      >
                        Set Role: User
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141417] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{confirmModal.title}</span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">{confirmModal.message}</p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-lg"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
