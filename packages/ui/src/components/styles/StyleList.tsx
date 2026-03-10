'use client';

import { useState } from 'react';
import type { Style } from '@ae-ai/types';

interface StyleListProps {
  styles: Style[];
  onSelect: (style: Style) => void;
  onEdit: (style: Style) => void;
  onDelete: (styleId: string) => void;
}

export function StyleList({ styles, onSelect, onEdit, onDelete }: StyleListProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (styleId: string) => {
    onDelete(styleId);
    setShowDeleteConfirm(null);
  };

  if (styles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-semibold mb-2">スタイルなし</h3>
        <p className="text-ae-text-secondary">
          スタイルがまだ登録されていません
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {styles.map((style) => {
        const colors = style.properties
          ?.filter((p) => p.type === 'color')
          .slice(0, 5) || [];

        return (
          <div
            key={style.id}
            className="card hover:border-ae-accent transition-colors cursor-pointer"
            onClick={() => onSelect(style)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{style.name}</h3>
                <p className="text-xs text-ae-text-secondary mt-1">
                  {style.properties?.length || 0} プロパティ
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(style);
                  }}
                  className="p-1 hover:bg-ae-dark rounded"
                  title="編集"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(style.id);
                  }}
                  className="p-1 hover:bg-ae-dark rounded"
                  title="削除"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Color Preview */}
            <div className="flex gap-1 mt-3">
              {colors.map((prop, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded border border-ae-border"
                  style={{ backgroundColor: prop.value as string }}
                  title={prop.name}
                />
              ))}
              {colors.length === 0 && (
                <div className="text-xs text-ae-text-secondary">
                  カラーなし
                </div>
              )}
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm === style.id && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card max-w-sm">
                  <h3 className="text-lg font-semibold mb-2">スタイルを削除</h3>
                  <p className="text-ae-text-secondary mb-4">
                    「{style.name}」を削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="btn-secondary flex-1"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleDelete(style.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
