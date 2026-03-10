'use client';

import { useState } from 'react';
import type { CharacterVersion } from '@ae-ai/types';

interface VersionHistoryProps {
  versions: CharacterVersion[];
  currentVersionId?: string;
  onSelect: (version: CharacterVersion) => void;
  onRestore: (version: CharacterVersion) => void;
  onCompare: (version1: CharacterVersion, version2: CharacterVersion) => void;
}

export function VersionHistory({
  versions,
  currentVersionId,
  onSelect,
  onRestore,
  onCompare,
}: VersionHistoryProps) {
  const [selectedForCompare, setSelectedForCompare] = useState<CharacterVersion | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCompareClick = (version: CharacterVersion) => {
    if (selectedForCompare) {
      if (selectedForCompare.id !== version.id) {
        onCompare(selectedForCompare, version);
      }
      setSelectedForCompare(null);
    } else {
      setSelectedForCompare(version);
    }
  };

  const handleRestore = (version: CharacterVersion) => {
    onRestore(version);
    setShowRestoreConfirm(null);
  };

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📜</div>
        <h3 className="text-lg font-semibold mb-2">バージョン履歴なし</h3>
        <p className="text-ae-text-secondary">
          まだバージョンが保存されていません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedForCompare && (
        <div className="bg-ae-accent/10 border border-ae-accent p-3 rounded flex items-center justify-between">
          <div>
            <span className="text-sm">比較対象: </span>
            <span className="font-medium">v{selectedForCompare.version_number}</span>
          </div>
          <button
            onClick={() => setSelectedForCompare(null)}
            className="text-sm text-ae-accent hover:underline"
          >
            キャンセル
          </button>
        </div>
      )}

      <div className="space-y-2">
        {versions.map((version, index) => {
          const isCurrent = version.id === currentVersionId;
          const isSelected = selectedForCompare?.id === version.id;

          return (
            <div
              key={version.id}
              className={`p-4 rounded border transition-colors cursor-pointer ${
                isCurrent
                  ? 'border-ae-accent bg-ae-accent/10'
                  : isSelected
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-ae-border hover:border-ae-accent'
              }`}
              onClick={() => onSelect(version)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ae-dark flex items-center justify-center">
                    <span className="text-sm font-bold">v{version.version_number}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {version.change_description || `バージョン ${version.version_number}`}
                      </h4>
                      {isCurrent && (
                        <span className="text-xs bg-ae-accent text-white px-2 py-0.5 rounded">
                          現在
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ae-text-secondary mt-1">
                      {formatDate(version.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompareClick(version);
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      isSelected
                        ? 'bg-yellow-500 text-white'
                        : 'bg-ae-dark hover:bg-ae-surface'
                    }`}
                  >
                    {isSelected ? '選択中' : '比較'}
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRestoreConfirm(version.id);
                      }}
                      className="text-xs px-2 py-1 rounded bg-ae-dark hover:bg-ae-surface"
                    >
                      復元
                    </button>
                  )}
                </div>
              </div>

              {/* Version Changes Preview */}
              {version.snapshot && (
                <div className="mt-3 pt-3 border-t border-ae-border">
                  <p className="text-xs text-ae-text-secondary">
                    スナップショット: {Object.keys(version.snapshot).length} 項目
                  </p>
                </div>
              )}

              {/* Restore Confirmation */}
              {showRestoreConfirm === version.id && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="card max-w-sm">
                    <h3 className="text-lg font-semibold mb-2">バージョンを復元</h3>
                    <p className="text-ae-text-secondary mb-4">
                      v{version.version_number} に復元しますか？現在の状態は新しいバージョンとして保存されます。
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRestoreConfirm(null)}
                        className="btn-secondary flex-1"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleRestore(version)}
                        className="btn-primary flex-1"
                      >
                        復元
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
