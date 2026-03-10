/**
 * IndexedDB Manager for Offline Storage
 * Provides CRUD operations for local data persistence
 */

import type { Character, Skeleton, Style, AnimationPreset } from '@ae-ai/types';

const DB_NAME = 'ae-ai-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  CHARACTERS: 'characters',
  SKELETONS: 'skeletons',
  STYLES: 'styles',
  PRESETS: 'animation_presets',
  PENDING_SYNC: 'pending_sync',
  CACHE: 'cache',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

export interface PendingSyncItem {
  id: string;
  store: StoreName;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });

    return this.initPromise;
  }

  /**
   * Create object stores
   */
  private createStores(db: IDBDatabase): void {
    // Characters store
    if (!db.objectStoreNames.contains(STORES.CHARACTERS)) {
      const characterStore = db.createObjectStore(STORES.CHARACTERS, { keyPath: 'id' });
      characterStore.createIndex('user_id', 'user_id', { unique: false });
      characterStore.createIndex('name', 'name', { unique: false });
      characterStore.createIndex('updated_at', 'updated_at', { unique: false });
    }

    // Skeletons store
    if (!db.objectStoreNames.contains(STORES.SKELETONS)) {
      const skeletonStore = db.createObjectStore(STORES.SKELETONS, { keyPath: 'id' });
      skeletonStore.createIndex('character_id', 'character_id', { unique: true });
    }

    // Styles store
    if (!db.objectStoreNames.contains(STORES.STYLES)) {
      const styleStore = db.createObjectStore(STORES.STYLES, { keyPath: 'id' });
      styleStore.createIndex('character_id', 'character_id', { unique: false });
    }

    // Animation presets store
    if (!db.objectStoreNames.contains(STORES.PRESETS)) {
      const presetStore = db.createObjectStore(STORES.PRESETS, { keyPath: 'id' });
      presetStore.createIndex('character_id', 'character_id', { unique: false });
      presetStore.createIndex('category', 'category', { unique: false });
    }

    // Pending sync queue
    if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
      const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('store', 'store', { unique: false });
    }

    // Generic cache store
    if (!db.objectStoreNames.contains(STORES.CACHE)) {
      const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
      cacheStore.createIndex('expires_at', 'expires_at', { unique: false });
    }
  }

  /**
   * Get database instance
   */
  async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save item to store
   */
  async save<T extends { id: string }>(store: StoreName, item: T): Promise<T> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(new Error(`Failed to save to ${store}`));
    });
  }

  /**
   * Get item by ID
   */
  async get<T>(store: StoreName, id: string): Promise<T | null> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get from ${store}`));
    });
  }

  /**
   * Get all items from store
   */
  async getAll<T>(store: StoreName): Promise<T[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get all from ${store}`));
    });
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    store: StoreName,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const index = objectStore.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get by index from ${store}`));
    });
  }

  /**
   * Delete item by ID
   */
  async delete(store: StoreName, id: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete from ${store}`));
    });
  }

  /**
   * Clear all items from store
   */
  async clear(store: StoreName): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear ${store}`));
    });
  }

  /**
   * Add item to pending sync queue
   */
  async addPendingSync(item: Omit<PendingSyncItem, 'id'>): Promise<PendingSyncItem> {
    const pendingItem: PendingSyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    await this.save(STORES.PENDING_SYNC, pendingItem);
    return pendingItem;
  }

  /**
   * Get all pending sync items
   */
  async getPendingSync(): Promise<PendingSyncItem[]> {
    const items = await this.getAll<PendingSyncItem>(STORES.PENDING_SYNC);
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Remove pending sync item
   */
  async removePendingSync(id: string): Promise<void> {
    await this.delete(STORES.PENDING_SYNC, id);
  }

  /**
   * Count items in store
   */
  async count(store: StoreName): Promise<number> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to count ${store}`));
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBManager();

// Character-specific helpers
export const characterDB = {
  save: (character: Character) => indexedDB.save(STORES.CHARACTERS, character),
  get: (id: string) => indexedDB.get<Character>(STORES.CHARACTERS, id),
  getAll: () => indexedDB.getAll<Character>(STORES.CHARACTERS),
  delete: (id: string) => indexedDB.delete(STORES.CHARACTERS, id),
};

export const skeletonDB = {
  save: (skeleton: Skeleton) => indexedDB.save(STORES.SKELETONS, skeleton),
  get: (id: string) => indexedDB.get<Skeleton>(STORES.SKELETONS, id),
  getByCharacter: (characterId: string) =>
    indexedDB.getByIndex<Skeleton>(STORES.SKELETONS, 'character_id', characterId),
  delete: (id: string) => indexedDB.delete(STORES.SKELETONS, id),
};

export const styleDB = {
  save: (style: Style) => indexedDB.save(STORES.STYLES, style),
  get: (id: string) => indexedDB.get<Style>(STORES.STYLES, id),
  getByCharacter: (characterId: string) =>
    indexedDB.getByIndex<Style[]>(STORES.STYLES, 'character_id', characterId),
  delete: (id: string) => indexedDB.delete(STORES.STYLES, id),
};

export const presetDB = {
  save: (preset: AnimationPreset) => indexedDB.save(STORES.PRESETS, preset),
  get: (id: string) => indexedDB.get<AnimationPreset>(STORES.PRESETS, id),
  getByCharacter: (characterId: string) =>
    indexedDB.getByIndex<AnimationPreset[]>(STORES.PRESETS, 'character_id', characterId),
  delete: (id: string) => indexedDB.delete(STORES.PRESETS, id),
};
