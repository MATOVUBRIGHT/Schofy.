import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
  forceFullSync: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<boolean>;
  enableSync: () => Promise<void>;
  disableSync: () => void;
  isSyncEnabled: boolean;
  isSupabaseConfigured: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const SYNCED_TABLES = [
  'students', 'staff', 'classes', 'subjects',
  'attendance', 'fees', 'payments',
  'announcements', 'exams', 'exam_results',
  'transport_routes', 'transport_assignments'
];

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline, user, schoolId } = useAuth();
  const { addToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(
    localStorage.getItem('schofy_last_sync') 
      ? new Date(localStorage.getItem('schofy_last_sync')!) 
      : null
  );
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(
    localStorage.getItem('schofy_sync_enabled') === 'true'
  );
  const channelRef = useRef<any>(null);

  // Configure sync service with Supabase
  useEffect(() => {
    syncService.disableSync();
    
    if (isSupabaseConfigured && supabase) {
      syncService.configure({ supabaseClient: supabase });
      console.log('✅ Sync service configured with Supabase');
    } else {
      console.warn('⚠️ Supabase not configured - sync disabled');
    }
  }, []);

  // Set user ID when schoolId changes and start sync
  useEffect(() => {
    if (schoolId) {
      syncService.setUserId(schoolId);
      console.log('👤 Sync user ID set to:', schoolId);
      
      // Start sync if enabled
      if (syncEnabled && isOnline) {
        syncService.enableSync();
        syncService.startBackgroundSync();
      }
    }
  }, [schoolId, syncEnabled, isOnline]);

  // Subscribe to Supabase Realtime for all tables
  useEffect(() => {
    if (!user?.id || !supabase || !isSupabaseConfigured || !syncEnabled) return;

    console.log('🔔 Setting up Supabase Realtime subscription...');

    // Create a single channel for all tables
    channelRef.current = supabase.channel(`schofy-sync-${user.id}`);

    // Subscribe to all tables
    SYNCED_TABLES.forEach(table => {
      channelRef.current.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${user.id}`
        },
        async (payload: any) => {
          console.log(`📡 Realtime: ${table} - ${payload.eventType}`);
          
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              await applyRemoteChange(user.id, table, payload.new);
            } else if (payload.eventType === 'DELETE') {
              await applyRemoteChange(user.id, table, payload.old);
            }
            
            // Notify UI to refresh
            window.dispatchEvent(new CustomEvent('schofyDataRefresh', { 
              detail: { table, action: payload.eventType } 
            }));
          } catch (e) {
            console.error(`Realtime apply error for ${table}:`, e);
          }
        }
      );
    });

    channelRef.current.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime channel error');
      }
    });

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, syncEnabled]);

  // Convert snake_case to camelCase
  const toCamel = (str: string) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

  // Apply remote change to local DB
  const applyRemoteChange = async (userId: string, tableName: string, record: any) => {
    try {
      const camelTable = toCamel(tableName);
      const formatted: any = {};
      
      for (const [key, value] of Object.entries(record)) {
        formatted[toCamel(key)] = value;
      }
      
      formatted.userId = userId;
      formatted.syncStatus = 'synced';
      formatted.deviceId = userDBManager.getDeviceId();
      
      await userDBManager.put(userId, camelTable, formatted);
      console.log(`📱 Applied remote change: ${camelTable}`);
    } catch (e) {
      console.error(`Failed to apply remote change for ${tableName}:`, e);
    }
  };

  // Pull ALL data from cloud (for new devices or full sync)
  const forceFullSync = useCallback(async () => {
    if (!user?.id || !supabase || !isSupabaseConfigured) {
      addToast('Cloud sync not configured', 'error');
      return;
    }

    setIsSyncing(true);
    addToast('Starting full sync...', 'info');

    try {
      console.log('📥 Starting FULL pull from cloud...');
      
      for (const table of SYNCED_TABLES) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null);

          if (error) {
            console.error(`Error pulling ${table}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            for (const record of data) {
              await applyRemoteChange(user.id, table, record);
            }
            console.log(`📥 Pulled ${data.length} records from ${table}`);
          }
        } catch (e) {
          console.error(`Failed to pull ${table}:`, e);
        }
      }

      const now = new Date().toISOString();
      localStorage.setItem('schofy_last_sync', now);
      setLastSyncTime(new Date(now));

      // Dispatch full refresh
      window.dispatchEvent(new CustomEvent('schofyDataRefresh', { detail: { type: 'full_sync' } }));
      
      addToast('Full sync completed', 'success');
    } catch (e: any) {
      console.error('Full sync failed:', e);
      addToast('Full sync failed: ' + e.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, addToast]);

  // Load pending count periodically
  const loadPendingCount = useCallback(async () => {
    if (!user?.id || !syncEnabled) {
      setPendingChanges(0);
      return;
    }
    try {
      const items = await userDBManager.getPendingSyncItems(user.id);
      setPendingChanges(items.length);
    } catch (error) {
      console.error('Failed to load pending count:', error);
      setPendingChanges(0);
    }
  }, [user, syncEnabled]);

  useEffect(() => {
    if (!syncEnabled) {
      setPendingChanges(0);
      return;
    }
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, [syncEnabled, loadPendingCount]);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing || !syncEnabled || !user) {
      console.log('⚠️ Sync skipped - offline:', !isOnline, 'syncing:', isSyncing, 'enabled:', syncEnabled);
      if (!syncEnabled) {
        addToast('Enable cloud sync first', 'warning');
      }
      return;
    }

    setIsSyncing(true);
    console.log('📤 Manual sync initiated...');
    
    try {
      await syncService.syncIncremental();
      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('schofy_last_sync', now.toISOString());
      await loadPendingCount();
      
      // Notify all components to refresh
      window.dispatchEvent(new CustomEvent('schofyDataRefresh', { detail: { type: 'manual_sync' } }));
      
      addToast('Data synced successfully', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      addToast('Sync failed - will retry automatically', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, syncEnabled, user, loadPendingCount, isSyncing, addToast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && syncEnabled && user) {
      console.log('🔄 Back online - triggering sync');
      syncNow();
    }
  }, [isOnline]);

  const exportBackup = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const tables = [
        'students', 'staff', 'classes', 'subjects',
        'attendance', 'fees', 'payments',
        'announcements', 'exams', 'exam_results',
        'transport_routes', 'transport_assignments'
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

      window.dispatchEvent(new Event('schofyDataRefresh'));
      addToast('Backup imported successfully', 'success');
      return true;
    } catch (error) {
      console.error('Backup import failed:', error);
      addToast('Failed to import backup', 'error');
      return false;
    }
  }, [user, addToast]);

  const enableSync = useCallback(async () => {
    try {
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
      syncService.enableSync();
      syncService.startBackgroundSync();
      
      // Do initial sync
      await syncNow();
      
      addToast('Cloud sync enabled', 'success');
    } catch (error) {
      console.error('Enable sync error:', error);
      addToast('Failed to enable cloud sync', 'error');
    }
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
      forceFullSync,
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
  const { isOnline, isSyncing, pendingChanges, lastSyncTime, syncNow, forceFullSync, isSyncEnabled } = useSync();

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
    <div className="flex items-center gap-2">
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
      
      <button
        onClick={forceFullSync}
        disabled={isSyncing}
        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        title="Force full sync from cloud"
      >
        <svg className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
}
