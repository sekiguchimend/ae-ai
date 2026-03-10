/**
 * Sync Manager for Offline Data Synchronization
 * Implements optimistic UI updates and background sync
 */

import { supabase } from '@/lib/supabase';
import { indexedDB, STORES, type PendingSyncItem, type StoreName } from './indexed-db';
import { networkStatus } from './network-status';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncAt: number | null;
  errors: string[];
}

export interface SyncListener {
  onSyncStateChange: (state: SyncState) => void;
}

class SyncManager {
  private state: SyncState = {
    status: 'idle',
    pendingCount: 0,
    lastSyncAt: null,
    errors: [],
  };

  private listeners: Set<SyncListener> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 5000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    // Listen to network status changes
    networkStatus.addListener({
      onStatusChange: (status) => {
        if (status === 'online') {
          this.startSync();
        } else if (status === 'offline') {
          this.updateState({ status: 'offline' });
        }
      },
    });

    // Count pending items
    await this.updatePendingCount();

    // Start sync if online
    if (networkStatus.isOnline()) {
      this.startSync();
    }
  }

  private updateState(updates: Partial<SyncState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener.onSyncStateChange(this.state);
    }
  }

  private async updatePendingCount(): Promise<void> {
    const count = await indexedDB.count(STORES.PENDING_SYNC);
    this.updateState({ pendingCount: count });
  }

  /**
   * Add listener for sync state changes
   */
  public addListener(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  public getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Queue an operation for sync
   */
  public async queueOperation<T extends { id: string }>(
    store: StoreName,
    operation: 'create' | 'update' | 'delete',
    data: T
  ): Promise<void> {
    // Save to local IndexedDB first (optimistic update)
    if (operation !== 'delete') {
      await indexedDB.save(store, data);
    } else {
      await indexedDB.delete(store, data.id);
    }

    // Queue for sync
    await indexedDB.addPendingSync({
      store,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    await this.updatePendingCount();

    // Try to sync immediately if online
    if (networkStatus.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Start background sync
   */
  public startSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (networkStatus.isOnline()) {
        this.processQueue();
      }
    }, 30000); // Check every 30 seconds

    // Also process immediately
    this.processQueue();
  }

  /**
   * Stop background sync
   */
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Process pending sync queue
   */
  public async processQueue(): Promise<void> {
    if (this.state.status === 'syncing' || !networkStatus.isOnline()) {
      return;
    }

    const pendingItems = await indexedDB.getPendingSync();

    if (pendingItems.length === 0) {
      this.updateState({ status: 'idle', errors: [] });
      return;
    }

    this.updateState({ status: 'syncing', errors: [] });

    const errors: string[] = [];

    for (const item of pendingItems) {
      try {
        await this.syncItem(item);
        await indexedDB.removePendingSync(item.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${item.operation} on ${item.store}: ${errorMessage}`);

        // Increment retry count
        if (item.retryCount < this.maxRetries) {
          await indexedDB.save(STORES.PENDING_SYNC, {
            ...item,
            retryCount: item.retryCount + 1,
          });
        } else {
          // Max retries reached, remove from queue
          await indexedDB.removePendingSync(item.id);
          errors.push(`Gave up on ${item.operation} after ${this.maxRetries} retries`);
        }
      }
    }

    await this.updatePendingCount();

    this.updateState({
      status: errors.length > 0 ? 'error' : 'idle',
      lastSyncAt: Date.now(),
      errors,
    });
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: PendingSyncItem): Promise<void> {
    const { store, operation, data } = item;

    // Map store names to Supabase table names
    const tableMap: Record<StoreName, string> = {
      [STORES.CHARACTERS]: 'characters',
      [STORES.SKELETONS]: 'skeletons',
      [STORES.STYLES]: 'styles',
      [STORES.PRESETS]: 'animation_presets',
      [STORES.PENDING_SYNC]: '', // Not synced
      [STORES.CACHE]: '', // Not synced
    };

    const tableName = tableMap[store];
    if (!tableName) return;

    switch (operation) {
      case 'create':
        const { error: createError } = await supabase
          .from(tableName)
          .insert(data as Record<string, unknown>);
        if (createError) throw createError;
        break;

      case 'update':
        const { id, ...updateData } = data as { id: string; [key: string]: unknown };
        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', (data as { id: string }).id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  /**
   * Force full sync from server
   */
  public async fullSync(): Promise<void> {
    if (!networkStatus.isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    this.updateState({ status: 'syncing' });

    try {
      // Sync characters
      const { data: characters } = await supabase
        .from('characters')
        .select('*');

      if (characters) {
        await indexedDB.clear(STORES.CHARACTERS);
        for (const char of characters) {
          await indexedDB.save(STORES.CHARACTERS, char);
        }
      }

      // Sync skeletons
      const { data: skeletons } = await supabase
        .from('skeletons')
        .select('*');

      if (skeletons) {
        await indexedDB.clear(STORES.SKELETONS);
        for (const skel of skeletons) {
          await indexedDB.save(STORES.SKELETONS, skel);
        }
      }

      // Sync styles
      const { data: styles } = await supabase
        .from('styles')
        .select('*');

      if (styles) {
        await indexedDB.clear(STORES.STYLES);
        for (const style of styles) {
          await indexedDB.save(STORES.STYLES, style);
        }
      }

      // Sync presets
      const { data: presets } = await supabase
        .from('animation_presets')
        .select('*');

      if (presets) {
        await indexedDB.clear(STORES.PRESETS);
        for (const preset of presets) {
          await indexedDB.save(STORES.PRESETS, preset);
        }
      }

      this.updateState({
        status: 'idle',
        lastSyncAt: Date.now(),
        errors: [],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({
        status: 'error',
        errors: [`Full sync failed: ${errorMessage}`],
      });
      throw error;
    }
  }

  /**
   * Clear all local data
   */
  public async clearLocalData(): Promise<void> {
    await indexedDB.clear(STORES.CHARACTERS);
    await indexedDB.clear(STORES.SKELETONS);
    await indexedDB.clear(STORES.STYLES);
    await indexedDB.clear(STORES.PRESETS);
    await indexedDB.clear(STORES.PENDING_SYNC);
    await indexedDB.clear(STORES.CACHE);
    await this.updatePendingCount();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
