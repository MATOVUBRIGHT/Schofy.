import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { syncService } from '../services/sync';
import { userDBManager } from '../lib/database/UserDatabaseManager';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SyncContextType {
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncNow: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<boolean>;
  enableSync: () => Promise<void>;
  disableSync: () => void;
  isSyncEnabled: boolean;
  isSupabaseConfigured: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline, user, schoolId } = useAuth();
  const { addToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(false);

  useEffect(() => {
    syncService.disableSync();
    
    if (isSupabaseConfigured && supabase) {
      syncService.configure({ supabaseClient: supabase });
    }
  }, []);

  useEffect(() => {
    if (schoolId) {
      syncService.setUserId(schoolId);
    }
  }, [schoolId]);

  useEffect(() => {
    if (isOnline && syncEnabled && user && schoolId) {
      syncService.startBackgroundSync();
      loadPendingCount();
    } else {
      syncService.stopBackgroundSync();
    }
  }, [isOnline, syncEnabled, user, schoolId]);

  const loadPendingCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const items = await userDBManager.getPendingSyncItems(user.id);
      setPendingChanges(items.length);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, [loadPendingCount]);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || !syncEnabled || !user) return;

    setIsSyncing(true);
    try {
      await syncService.syncIncremental();
      setLastSyncTime(new Date());
      await loadPendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, syncEnabled, user, loadPendingCount]);

  const exportBackup = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const tables = [
        'students', 'staff', 'classes', 'subjects',
        'attendance', 'fees', 'feeStructures', 'payments',
        'announcements', 'exams', 'examResults'
      ];

      const data: Record<string, any[]> = {};
      
      for (const table of tables) {
        try {
          const tableData = await userDBManager.getAll(user.id, table);
          data[table] = tableData;
        } catch {
          // Table might not exist
        }
      }

      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.id,
        data,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schofy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Backup exported successfully', 'success');
    } catch (error) {
      console.error('Backup export failed:', error);
      addToast('Failed to export backup', 'error');
    }
  }, [user, addToast]);

  const importBackup = useCallback(async (file: File): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (backup.version !== 1) {
        addToast('Unsupported backup version', 'error');
        return false;
      }

      for (const [table, records] of Object.entries(backup.data)) {
        try {
          await userDBManager.clear(user.id, table);
          if (Array.isArray(records)) {
            for (const record of records) {
              await userDBManager.add(user.id, table, record);
            }
          }
        } catch {
          // Table might not exist
        }
      }

      window.dispatchEvent(new Event('dataRefresh'));
      addToast('Backup imported successfully', 'success');
      return true;
    } catch (error) {
      console.error('Backup import failed:', error);
      addToast('Failed to import backup', 'error');
      return false;
    }
  }, [user, addToast]);

  const enableSync = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      addToast('Cloud sync is not configured', 'error');
      return;
    }
    
    if (!user) {
      addToast('Please login to enable cloud sync', 'error');
      return;
    }
    
    localStorage.setItem('schofy_sync_enabled', 'true');
    setSyncEnabled(true);
    syncService.configure({ supabaseClient: supabase });
    syncService.setUserId(user.id);
    syncService.startBackgroundSync();
    await syncNow();
    addToast('Cloud sync enabled', 'success');
  }, [addToast, user, syncNow]);

  const disableSync = useCallback(() => {
    localStorage.setItem('schofy_sync_enabled', 'false');
    setSyncEnabled(false);
    syncService.stopBackgroundSync();
    addToast('Cloud sync disabled', 'info');
  }, [addToast]);

  return (
    <SyncContext.Provider value={{
      isSyncing,
      isOnline,
      lastSyncTime,
      pendingChanges,
      syncNow,
      exportBackup,
      importBackup,
      enableSync,
      disableSync,
      isSyncEnabled: syncEnabled,
      isSupabaseConfigured
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

export function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingChanges, lastSyncTime, syncNow, isSyncEnabled } = useSync();

  if (!isSyncEnabled) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-slate-400';
    if (isSyncing) return 'bg-amber-500 animate-pulse';
    if (pendingChanges > 0) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    return 'Synced';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  return (
    <button
      onClick={syncNow}
      disabled={!isOnline || isSyncing}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      title={`Last sync: ${formatLastSync()}`}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {getStatusText()}
      </span>
    </button>
  );
}
