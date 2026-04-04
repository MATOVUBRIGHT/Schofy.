import { userDBManager } from '../lib/database/UserDatabaseManager';
import { SupabaseClient } from '@supabase/supabase-js';

class SyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SYNC_INTERVAL = 60000;
  private supabase: SupabaseClient | null = null;
  private currentUserId: string | null = null;
  private syncEnabled = false;

  configure(options: { supabaseClient?: SupabaseClient }) {
    if (options.supabaseClient) {
      this.supabase = options.supabaseClient;
    }
  }

  enableSync() {
    this.syncEnabled = true;
  }

  disableSync() {
    this.syncEnabled = false;
    this.stopBackgroundSync();
  }

  isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  setUserId(userId: string) {
    this.currentUserId = userId;
    localStorage.setItem('schofy_current_user_id', userId);
  }

  getUserId(): string | null {
    if (this.currentUserId) return this.currentUserId;
    return localStorage.getItem('schofy_current_user_id');
  }

  startBackgroundSync() {
    if (!this.syncEnabled || this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.currentUserId) {
        this.syncIncremental();
      }
    }, this.SYNC_INTERVAL);

    if (this.currentUserId && navigator.onLine) {
      this.syncIncremental();
    }
  }

  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncIncremental(): Promise<void> {
    if (!this.syncEnabled) return;
    
    const userId = this.getUserId();
    if (!userId || !this.supabase) return;

    try {
      await this.pushPendingChanges(userId);
      await this.pullRemoteChanges(userId);
      localStorage.setItem('lastSyncTime', new Date().toISOString());
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async pushPendingChanges(userId: string): Promise<void> {
    if (!this.supabase || !this.syncEnabled) return;

    const pendingItems = await userDBManager.getPendingSyncItems(userId);

    for (const item of pendingItems) {
      try {
        const tableName = this.camelToSnake(item.table);
        const dataWithUser = {
          ...item.data,
          user_id: userId,
        };

        if (item.operation === 'delete') {
          await this.supabase
            .from(tableName)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.recordId)
            .eq('user_id', userId);
        } else {
          await this.supabase
            .from(tableName)
            .upsert(dataWithUser);
        }

        await userDBManager.markSynced(userId, item.id);
      } catch (error) {
        console.error('Failed to push item:', item, error);
      }
    }
  }

  async pullRemoteChanges(userId: string): Promise<void> {
    if (!this.supabase || !this.syncEnabled) return;

    const lastSync = localStorage.getItem('lastSyncTime') || '1970-01-01T00:00:00Z';

    const tables = [
      'students', 'staff', 'classes', 'subjects',
      'attendance', 'fees', 'fee_structures', 'payments',
      'announcements', 'exams', 'exam_results'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .eq('deleted_at', null)
          .gt('updated_at', lastSync);

        if (!error && data && data.length > 0) {
          await this.applyRemoteChanges(userId, table, data);
        }
      } catch (error) {
        console.error(`Failed to pull ${table}:`, error);
      }
    }
  }

  private async applyRemoteChanges(userId: string, tableName: string, records: any[]): Promise<void> {
    const camelTable = this.snakeToCamel(tableName);

    for (const record of records) {
      const formattedRecord = this.formatRecordForLocal(record);
      formattedRecord.userId = userId;
      formattedRecord.syncStatus = 'synced';
      formattedRecord.deviceId = userDBManager.getDeviceId();
      
      await userDBManager.put(userId, camelTable, formattedRecord);
    }
  }

  private formatRecordForLocal(record: any): any {
    const formatted: any = {};
    for (const [key, value] of Object.entries(record)) {
      formatted[this.snakeToCamel(key)] = value;
    }
    return formatted;
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

export const syncService = new SyncService();
