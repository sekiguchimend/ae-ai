'use client';

import { useMemo } from 'react';
import type { CharacterVersion } from '@ae-ai/types';

interface VersionComparisonProps {
  version1: CharacterVersion;
  version2: CharacterVersion;
  onClose: () => void;
}

interface DiffItem {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
}

function getDiff(obj1: Record<string, unknown>, obj2: Record<string, unknown>, path = ''): DiffItem[] {
  const diffs: DiffItem[] = [];
  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    if (val1 === undefined && val2 !== undefined) {
      diffs.push({ path: currentPath, type: 'added', newValue: val2 });
    } else if (val1 !== undefined && val2 === undefined) {
      diffs.push({ path: currentPath, type: 'removed', oldValue: val1 });
    } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          diffs.push({ path: currentPath, type: 'changed', oldValue: val1, newValue: val2 });
        }
      } else {
        diffs.push(...getDiff(val1 as Record<string, unknown>, val2 as Record<string, unknown>, currentPath));
      }
    } else if (val1 !== val2) {
      diffs.push({ path: currentPath, type: 'changed', oldValue: val1, newValue: val2 });
    }
  }

  return diffs;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function VersionComparison({ version1, version2, onClose }: VersionComparisonProps) {
  const diffs = useMemo(() => {
    const snapshot1 = version1.snapshot as Record<string, unknown> || {};
    const snapshot2 = version2.snapshot as Record<string, unknown> || {};
    return getDiff(snapshot1, snapshot2);
  }, [version1, version2]);

  const addedCount = diffs.filter(d => d.type === 'added').length;
  const removedCount = diffs.filter(d => d.type === 'removed').length;
  const changedCount = diffs.filter(d => d.type === 'changed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">バージョン比較</h3>
          <p className="text-sm text-ae-text-secondary">
            v{version1.version_number} と v{version2.version_number} の差分
          </p>
        </div>
        <button onClick={onClose} className="btn-secondary">
          閉じる
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm">{addedCount} 追加</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm">{removedCount} 削除</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm">{changedCount} 変更</span>
        </div>
      </div>

      {/* Version Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-ae-dark p-3 rounded">
          <p className="text-sm font-medium">v{version1.version_number}</p>
          <p className="text-xs text-ae-text-secondary">
            {new Date(version1.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="bg-ae-dark p-3 rounded">
          <p className="text-sm font-medium">v{version2.version_number}</p>
          <p className="text-xs text-ae-text-secondary">
            {new Date(version2.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      {/* Diff List */}
      {diffs.length === 0 ? (
        <div className="text-center py-8 text-ae-text-secondary">
          <p>差分はありません</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-auto">
          {diffs.map((diff, index) => (
            <div
              key={index}
              className={`p-3 rounded border-l-4 ${
                diff.type === 'added'
                  ? 'bg-green-500/10 border-green-500'
                  : diff.type === 'removed'
                  ? 'bg-red-500/10 border-red-500'
                  : 'bg-yellow-500/10 border-yellow-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    diff.type === 'added'
                      ? 'bg-green-500 text-white'
                      : diff.type === 'removed'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  {diff.type === 'added' ? '追加' : diff.type === 'removed' ? '削除' : '変更'}
                </span>
                <span className="text-sm font-mono">{diff.path}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {diff.type !== 'added' && (
                  <div className="bg-ae-dark p-2 rounded">
                    <p className="text-xs text-ae-text-secondary mb-1">以前</p>
                    <pre className="text-xs overflow-auto max-h-20 text-red-400">
                      {formatValue(diff.oldValue)}
                    </pre>
                  </div>
                )}
                {diff.type !== 'removed' && (
                  <div className="bg-ae-dark p-2 rounded">
                    <p className="text-xs text-ae-text-secondary mb-1">現在</p>
                    <pre className="text-xs overflow-auto max-h-20 text-green-400">
                      {formatValue(diff.newValue)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
