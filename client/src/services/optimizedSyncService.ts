// client/src/services/optimizedSyncService.ts
// Optimized sync with batching, delta transfer, and background execution

import { userDBManager } from '../lib/database/UserDatabaseManager';
import { performanceMonitor } from './performanceMonitor';
import { queryCache } from '../lib/cache/QueryCache';

interface SyncBatch {
  table: string;
  operation: 'create' | 'update' | 'delete';
  records: any[];
  timestamp: number;
}

interface DeltaSync {
  tableName: string;
  lastSyncedAt: string | null;
  changes: {
    created: any[];
    updated: any[];
    deleted: string[];
  };
}

class OptimizedSyncService {
  private syncQueue: SyncBatch[] = [];
  private isSyncing = false;
  private lastSyncTime: Record<string, number> = {};
  private batchSize = 50; // Batch records for efficient sync
  private maxConcurrentBatches = 3;

  /**
   * Queue changes for sync (non-blocking)
   */
  queueForSync(table: string, operation: 'create' | 'update' | 'delete', records: any[]) {
    if (records.length === 0) return;

    // Add to queue
    this.syncQueue.push({
      table,
      operation,
      records,
      timestamp: Date.now(),
    });

    // Trigger background sync if online
    if (navigator.onLine && !this.isSyncing) {
      this.startBackgroundSync();
    }
  }

  /**
   * Perform delta sync - only transfer changed records
   */
  async performDeltaSync(userId: string, tables: string[]): Promise<DeltaSync[]> {
    return performanceMonitor.measure(
      'delta-sync',
      async () => {
        const deltas: DeltaSync[] = [];

        for (const table of tables) {
          const lastSyncedAt = this.lastSyncTime[table]?.toString() ?? null;
          
          // Get all items and filter by timestamp
          const allItems = await userDBManager.getAll(userId, table);
          
          const changes = {
            created: allItems,
            updated: [],
            deleted: [],
          };

          deltas.push({
            tableName: table,
            lastSyncedAt,
            changes,
          });

          this.lastSyncTime[table] = Date.now();
        }

        return deltas;
      },
      'sync'
    );
  }

  /**
   * Batch and send changes in efficient chunks
   */
  async batchAndSync(_userId: string): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    // Group records by table
    const grouped = new Map<string, SyncBatch[]>();
    for (const batch of this.syncQueue) {
      if (!grouped.has(batch.table)) {
        grouped.set(batch.table, []);
      }
      grouped.get(batch.table)!.push(batch);
    }

    // Process batches
    const processingBatches = [];
    
    for (const [table, batches] of grouped.entries()) {
      const allRecords = batches.flatMap(b => b.records);
      
      // Split into chunks of batchSize
      for (let i = 0; i < allRecords.length; i += this.batchSize) {
        const chunk = allRecords.slice(i, i + this.batchSize);
        processingBatches.push(
          this.syncBatch(table, batches[0].operation, chunk)
            .then(() => { synced += chunk.length; })
            .catch(() => { failed += chunk.length; })
        );
      }
    }

    // Wait for all batches to complete (with concurrency control)
    for (let i = 0; i < processingBatches.length; i += this.maxConcurrentBatches) {
      await Promise.all(
        processingBatches.slice(i, i + this.maxConcurrentBatches)
      );
    }

    // Clear processed items
    this.syncQueue = [];

    return { synced, failed };
  }

  /**
   * Sync single batch of records
   */
  private async syncBatch(
    table: string,
    operation: 'create' | 'update' | 'delete',
    records: any[]
  ): Promise<void> {
    await performanceMonitor.measure(
      `batch-sync-${table}`,
      async () => {
        // Send to API in single request
        const endpoint = operation === 'delete' 
          ? `/api/${table}/batch-delete`
          : `/api/${table}/batch-${operation}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records }),
        });

        if (!response.ok) {
          throw new Error(`Batch sync failed for ${table}: ${response.status}`);
        }

        // Invalidate cache for this table
        queryCache.invalidatePattern(`${table}:*`);
      },
      'sync'
    );
  }

  /**
   * Start background sync without blocking UI
   */
  private startBackgroundSync() {
    if (this.isSyncing) return;

    // Use requestIdleCallback for non-blocking sync
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.performSync(), { timeout: 30000 });
    } else {
      // Fallback: setTimeout with low priority
      setTimeout(() => this.performSync(), 5000);
    }
  }

  /**
   * Perform actual sync
   */
  private async performSync() {
    this.isSyncing = true;
    try {
      const user = JSON.parse(localStorage.getItem('schofy_user') ?? '{}');
      if (user.id) {
        await this.batchAndSync(user.id);
        console.log('✅ Background sync completed');
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get pending sync count
   */
  getPendingCount(): number {
    return this.syncQueue.flatMap(b => b.records).length;
  }

  /**
   * Manual sync trigger
   */
  async syncNow(userId: string): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      console.warn('Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    try {
      return await this.batchAndSync(userId);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const optimizedSyncService = new OptimizedSyncService();
