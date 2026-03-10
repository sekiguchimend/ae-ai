/**
 * React Hooks for Offline Functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { networkStatus, type NetworkStatus } from './network-status';
import { syncManager, type SyncState } from './sync-manager';

/**
 * Hook to monitor network status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(networkStatus.getStatus());

  useEffect(() => {
    const unsubscribe = networkStatus.addListener({
      onStatusChange: setStatus,
    });

    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook to check if app is online
 */
export function useIsOnline(): boolean {
  const status = useNetworkStatus();
  return status === 'online';
}

/**
 * Hook to monitor sync state
 */
export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(syncManager.getState());

  useEffect(() => {
    const unsubscribe = syncManager.addListener({
      onSyncStateChange: setState,
    });

    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook for sync operations
 */
export function useSync() {
  const state = useSyncState();
  const isOnline = useIsOnline();

  const sync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await syncManager.processQueue();
  }, [isOnline]);

  const fullSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await syncManager.fullSync();
  }, [isOnline]);

  return {
    ...state,
    isOnline,
    sync,
    fullSync,
    canSync: isOnline && state.status !== 'syncing',
  };
}

/**
 * Hook for offline-first data operations
 */
export function useOfflineData<T extends { id: string }>(
  fetchOnline: () => Promise<T[]>,
  getOffline: () => Promise<T[]>,
  saveOffline: (item: T) => Promise<T>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isOnline = useIsOnline();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        const onlineData = await fetchOnline();
        // Cache to offline storage
        for (const item of onlineData) {
          await saveOffline(item);
        }
        setData(onlineData);
      } else {
        const offlineData = await getOffline();
        setData(offlineData);
      }
    } catch (err) {
      // Fallback to offline data on error
      try {
        const offlineData = await getOffline();
        setData(offlineData);
      } catch (offlineErr) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, fetchOnline, getOffline, saveOffline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    isOfflineData: !isOnline,
  };
}
