import React, { useState, useEffect } from 'react';
import { 
  X, User, Palette, ShieldCheck, Clock, Sparkles, Sun, Moon, Monitor, Check, 
  LogOut, Trash2, Search, ShieldAlert, ShieldCheck as SafeIcon, ExternalLink,
  Database, RefreshCw, CheckCircle2, AlertCircle, Server, HardDrive, Cpu, KeyRound
} from 'lucide-react';
import { useTheme } from '../lib/themeContext';
import { getScanHistory, removeScanFromHistory, clearScanHistory } from '../lib/historyStore';
import { 
  getMongoConfig, 
  saveMongoConfig, 
  testMongoConnection, 
  getMongoDatabaseStats, 
  DEFAULT_MONGO_URI, 
  DEFAULT_DB_NAME,
  type MongoConfig,
  type MongoDatabaseStats
} from '../lib/mongoService';
import type { ScanResultData } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans';
  user?: { name: string; email: string; avatar?: string; provider?: string } | null;
  onSignOut?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'appearance',
  user,
  onSignOut,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy' | 'database' | 'history' | 'plans'>(initialTab);
  const [historyItems, setHistoryItems] = useState<ScanResultData[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Safe' | 'Suspicious' | 'Malicious'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  // MongoDB State
  const [mongoConfig, setMongoConfigState] = useState<MongoConfig>(getMongoConfig());
  const [mongoUriInput, setMongoUriInput] = useState<string>(getMongoConfig().connectionUri);
  const [mongoDbNameInput, setMongoDbNameInput] = useState<string>(getMongoConfig().dbName);
  const [isTestingMongo, setIsTestingMongo] = useState<boolean>(false);
  const [mongoTestResult, setMongoTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
    details?: { clusterHost: string; dbName: string; appName: string; protocol: string };
  } | null>(null);
  const [mongoStats, setMongoStats] = useState<MongoDatabaseStats>(getMongoDatabaseStats());
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setHistoryItems(getScanHistory());
      const cfg = getMongoConfig();
      setMongoConfigState(cfg);
      setMongoUriInput(cfg.connectionUri);
      setMongoDbNameInput(cfg.dbName);
      setMongoStats(getMongoDatabaseStats());
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeScanFromHistory(id);
    setHistoryItems(updated);
  };

  const handleClearHistory = () => {
    const updated = clearScanHistory();
    setHistoryItems(updated);
  };

  const handleTestMongo = async () => {
    setIsTestingMongo(true);
    setMongoTestResult(null);
    try {
      const res = await testMongoConnection(mongoUriInput);
      setMongoTestResult(res);
    } catch (err) {
      setMongoTestResult({
        success: false,
        message: 'Failed to test database connection.',
        latencyMs: 0
      });
    } finally {
      setIsTestingMongo(false);
    }
  };

  const handleSaveMongoConfig = () => {
    const updated = saveMongoConfig(mongoUriInput, mongoDbNameInput);
    setMongoConfigState(updated);
    setMongoStats(getMongoDatabaseStats());
    setSaveToast('MongoDB database settings saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleResetMongoDefault = () => {
    setMongoUriInput(DEFAULT_MONGO_URI);
    setMongoDbNameInput(DEFAULT_DB_NAME);
    const updated = saveMongoConfig(DEFAULT_MONGO_URI, DEFAULT_DB_NAME);
    setMongoConfigState(updated);
    setMongoStats(getMongoDatabaseStats());
    setSaveToast('Reset to default threat-detection database');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const filteredHistory = historyItems.filter((item) => {
    if (!item || typeof item.target !== 'string') return false;
    const targetStr = (item.target || '').toLowerCase();
    const targetTypeStr = (item.targetType || '').toLowerCase();
    const searchLower = (historySearch || '').toLowerCase();

    const matchesFilter = historyFilter === 'all' || item.status === historyFilter;
    const matchesSearch = targetStr.includes(searchLower) || targetTypeStr.includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#1A1A1D] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row min-h-[520px] transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 bg-neutral-50/70 dark:bg-neutral-900/60 border-r border-neutral-200/80 dark:border-neutral-800 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Settings
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage MalVision preferences
              </p>
            </div>

            {/* Nav Tabs */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-500" />
                <div className="flex items-center space-x-1.5">
                  <span>Database</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Scan History</span>
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>My Plans</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Database className="w-3 h-3" />
              <span>MongoDB Connected</span>
            </div>
            <div>MalVision v1.0.4 • Security Web App</div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[520px]">
          {/* DATABASE TAB */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <span>MongoDB Database Configuration</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Connect your MongoDB Atlas cluster for threat intelligence and scan persistence.
                  </p>
                </div>
              </div>

              {saveToast && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{saveToast}</span>
                </div>
              )}

              {/* Status Header Badge */}
              <div className="p-4 rounded-2xl bg-neutral-900 dark:bg-neutral-800/90 text-white space-y-3 shadow-sm border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-400">
                      MongoDB Atlas Active
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-neutral-800 dark:bg-neutral-700 px-2.5 py-1 rounded-full text-neutral-300">
                    Ping: {mongoConfig.latencyMs}ms
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-medium">Database Name</span>
                    <span className="font-bold text-white truncate block">{mongoConfig.dbName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-medium">Cluster Host</span>
                    <span className="font-bold text-emerald-300 truncate block font-mono text-[11px]">{mongoConfig.clusterHost}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 block uppercase font-medium">Username</span>
                    <span className="font-bold text-white truncate block">{mongoConfig.username}</span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-neutral-500" />
                      <span>MongoDB Connection URI</span>
                    </span>
                    <button 
                      onClick={handleResetMongoDefault} 
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-normal"
                    >
                      Reset Default URI
                    </button>
                  </label>
                  <input
                    type="text"
                    value={mongoUriInput}
                    onChange={(e) => setMongoUriInput(e.target.value)}
                    placeholder="mongodb+srv://user:pass@cluster.mongodb.net/?appName=app"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <p className="text-[10px] text-neutral-400">
                    Configured string: <code className="text-emerald-600 dark:text-emerald-400 font-mono">threat-detection.f39agqr.mongodb.net</code>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
                    <Server className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Database Name</span>
                  </label>
                  <input
                    type="text"
                    value={mongoDbNameInput}
                    onChange={(e) => setMongoDbNameInput(e.target.value)}
                    placeholder="threat-detection"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={handleTestMongo}
                    disabled={isTestingMongo}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    {isTestingMongo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing Cluster Ping...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Test MongoDB Connection</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveMongoConfig}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </button>
                </div>

                {/* Connection Test Output Box */}
                {mongoTestResult && (
                  <div className={`p-3.5 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                    mongoTestResult.success 
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center space-x-2 font-bold">
                      {mongoTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span>{mongoTestResult.message}</span>
                    </div>

                    {mongoTestResult.details && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60 text-[11px]">
                        <div>Protocol: <strong>{mongoTestResult.details.protocol}</strong></div>
                        <div>Latency: <strong>{mongoTestResult.latencyMs} ms</strong></div>
                        <div>Target DB: <strong>{mongoTestResult.details.dbName}</strong></div>
                        <div>App Name: <strong>{mongoTestResult.details.appName}</strong></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Collection Statistics Section */}
              <div className="space-y-3 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Database Collections ({mongoStats.dbName})</span>
                  </h4>
                  <span className="text-[11px] text-neutral-400">Total Docs: <strong>{mongoStats.totalDocuments.toLocaleString()}</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mongoStats.collections.map((col) => (
                    <div 
                      key={col.name}
                      className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">{col.name}</span>
                        <p className="text-[10px] text-neutral-400">Updated: {col.lastUpdated}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">{col.documentCount.toLocaleString()} docs</span>
                        <span className="text-[10px] text-neutral-400">{col.sizeKb} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">User Profile</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage your account information and security profile.</p>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-lg shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user ? getInitials(user.name) : 'MV'
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {user ? user.name : 'MalVision Guest'}
                    </h4>
                    {user?.provider === 'google' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span>Google Verified</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                    {user ? user.email : 'guest@malvision.security'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Display Name</label>
                  <input
                    type="text"
                    readOnly
                    value={user ? user.name : 'MalVision Guest'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={user ? user.email : 'guest@malvision.security'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                {user && (
                  <button
                    onClick={() => {
                      onSignOut?.();
                      onClose();
                    }}
                    className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Appearance & Theme</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Customize how MalVision looks on your screen.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border flex flex-col items-center space-y-3 cursor-pointer transition ${
                    theme === 'light'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">Light</span>
                  {theme === 'light' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border flex flex-col items-center space-y-3 cursor-pointer transition ${
                    theme === 'dark'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">Dark</span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>

                <button
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border flex flex-col items-center space-y-3 cursor-pointer transition ${
                    theme === 'system'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800 ring-2 ring-neutral-900 dark:ring-white'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">System</span>
                  {theme === 'system' && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Privacy & Security</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Control data retention and inspection isolation settings.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">Local-First Sandbox Inspection</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Inspect content safely without storing unencrypted files.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-neutral-900 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">MongoDB Threat Telemetry Sync</h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Sync threat scan hashes to MongoDB Atlas (threat-detection).</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* SCAN HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Scan History</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Review your past inspected files, URLs, and hashes.</p>
                </div>
                {historyItems.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Search and Filter controls */}
              <div className="space-y-3">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search history by name, URL or hash..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'all'
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                    }`}
                  >
                    All ({historyItems.length})
                  </button>

                  <button
                    onClick={() => setHistoryFilter('Safe')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'Safe'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    Safe
                  </button>

                  <button
                    onClick={() => setHistoryFilter('Suspicious')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'Suspicious'
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    Suspicious
                  </button>

                  <button
                    onClick={() => setHistoryFilter('Malicious')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      historyFilter === 'Malicious'
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                    }`}
                  >
                    Malicious
                  </button>
                </div>
              </div>

              {/* History Item Cards */}
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
                  <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">No scan history found</p>
                  <p className="text-[11px] text-neutral-400">Run a scan using the Threat Scanner to see results logged here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHistory.map((item) => {
                    const isExpanded = expandedScanId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setExpandedScanId(isExpanded ? null : item.id)}
                        className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 truncate mr-3">
                            <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                              {item.status === 'Safe' ? (
                                <SafeIcon className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ShieldAlert className={`w-4 h-4 ${item.status === 'Malicious' ? 'text-rose-500' : 'text-amber-500'}`} />
                              )}
                            </div>
                            <div className="truncate">
                              {item.targetType === 'url' || item.target.startsWith('http://') || item.target.startsWith('https://') ? (
                                <a
                                  href={item.target}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 truncate max-w-xs sm:max-w-md group"
                                >
                                  <span className="truncate">{item.target}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70 group-hover:opacity-100 transition" />
                                </a>
                              ) : (
                                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md">
                                  {item.target}
                                </h4>
                              )}
                              <p className="text-[11px] text-neutral-400 flex items-center space-x-1.5 mt-0.5">
                                <span className="uppercase font-semibold text-[10px] text-neutral-500">{item.targetType}</span>
                                <span>•</span>
                                <span>{item.timestamp}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Safe'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : item.status === 'Suspicious'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {item.status}
                            </span>

                            <button
                              onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs space-y-2 animate-in fade-in duration-150">
                            <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                              {item.explanation}
                            </p>
                            {item.recommendedAction && (
                              <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300">
                                <strong>Recommended:</strong> {item.recommendedAction}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MY PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">My Plans & Subscriptions</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">View current tier usage and upgrade options.</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Current Active Tier</span>
                    <h4 className="text-xl font-extrabold">MalVision Pro (MongoDB Atlas Connected)</h4>
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  Unlimited standard file, PDF, link, and hash scanning connected to your custom MongoDB Threat Detection cluster (<code className="font-mono text-emerald-300">threat-detection</code>).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
