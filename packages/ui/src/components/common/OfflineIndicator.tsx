'use client';

import { useNetworkStatus, useSyncState } from '@/lib/offline';

export function OfflineIndicator() {
  const networkStatus = useNetworkStatus();
  const syncState = useSyncState();

  if (networkStatus === 'online' && syncState.status === 'idle' && syncState.pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`rounded-lg shadow-lg p-3 flex items-center gap-3 ${
          networkStatus === 'offline'
            ? 'bg-yellow-500 text-yellow-950'
            : networkStatus === 'slow'
            ? 'bg-orange-500 text-orange-950'
            : syncState.status === 'syncing'
            ? 'bg-blue-500 text-blue-950'
            : syncState.status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-green-950'
        }`}
      >
        {/* Status Icon */}
        <div className="w-6 h-6 flex items-center justify-center">
          {networkStatus === 'offline' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
          )}
          {networkStatus !== 'offline' && syncState.status === 'syncing' && (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {networkStatus !== 'offline' && syncState.status === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {networkStatus === 'slow' && syncState.status !== 'syncing' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Status Text */}
        <div className="text-sm">
          {networkStatus === 'offline' && (
            <div>
              <p className="font-medium">オフライン</p>
              {syncState.pendingCount > 0 && (
                <p className="text-xs opacity-75">
                  {syncState.pendingCount}件の変更が保留中
                </p>
              )}
            </div>
          )}
          {networkStatus === 'slow' && (
            <div>
              <p className="font-medium">接続が不安定</p>
            </div>
          )}
          {networkStatus === 'online' && syncState.status === 'syncing' && (
            <div>
              <p className="font-medium">同期中...</p>
              {syncState.pendingCount > 0 && (
                <p className="text-xs opacity-75">
                  {syncState.pendingCount}件を同期中
                </p>
              )}
            </div>
          )}
          {networkStatus === 'online' && syncState.status === 'error' && (
            <div>
              <p className="font-medium">同期エラー</p>
              <p className="text-xs opacity-75">
                {syncState.errors[0] || '再試行してください'}
              </p>
            </div>
          )}
          {networkStatus === 'online' && syncState.pendingCount > 0 && syncState.status === 'idle' && (
            <div>
              <p className="font-medium">{syncState.pendingCount}件の変更が保留中</p>
            </div>
          )}
        </div>

        {/* Last Sync Time */}
        {syncState.lastSyncAt && networkStatus === 'online' && (
          <div className="text-xs opacity-75 hidden sm:block">
            最終同期: {formatTime(syncState.lastSyncAt)}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'たった今';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分前`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
