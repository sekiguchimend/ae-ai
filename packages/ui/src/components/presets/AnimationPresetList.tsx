'use client';

import { useState } from 'react';
import type { AnimationPreset } from '@ae-ai/types';

interface AnimationPresetListProps {
  presets: AnimationPreset[];
  onSelect: (preset: AnimationPreset) => void;
  onEdit: (preset: AnimationPreset) => void;
  onDelete: (presetId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  walk: '歩行',
  run: '走行',
  jump: 'ジャンプ',
  greeting: '挨拶',
  idle: '待機',
  attack: '攻撃',
  custom: 'カスタム',
};

const CATEGORY_ICONS: Record<string, string> = {
  walk: '🚶',
  run: '🏃',
  jump: '⬆️',
  greeting: '👋',
  idle: '🧍',
  attack: '⚔️',
  custom: '✨',
};

export function AnimationPresetList({ presets, onSelect, onEdit, onDelete }: AnimationPresetListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const categories = [...new Set(presets.map(p => p.category))];

  const filteredPresets = selectedCategory
    ? presets.filter(p => p.category === selectedCategory)
    : presets;

  const handleDelete = (presetId: string) => {
    onDelete(presetId);
    setShowDeleteConfirm(null);
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎬</div>
        <h3 className="text-lg font-semibold mb-2">プリセットなし</h3>
        <p className="text-ae-text-secondary">
          アニメーションプリセットがまだ登録されていません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded text-sm ${
            selectedCategory === null
              ? 'bg-ae-accent text-white'
              : 'bg-ae-dark text-ae-text-secondary hover:text-ae-text'
          }`}
        >
          すべて ({presets.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded text-sm ${
              selectedCategory === cat
                ? 'bg-ae-accent text-white'
                : 'bg-ae-dark text-ae-text-secondary hover:text-ae-text'
            }`}
          >
            {CATEGORY_ICONS[cat] || '📁'} {CATEGORY_LABELS[cat] || cat} (
            {presets.filter(p => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="card hover:border-ae-accent transition-colors cursor-pointer"
            onClick={() => onSelect(preset)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {CATEGORY_ICONS[preset.category] || '📁'}
                </span>
                <div>
                  <h3 className="font-semibold">{preset.name}</h3>
                  <p className="text-xs text-ae-text-secondary">
                    {CATEGORY_LABELS[preset.category] || preset.category}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(preset);
                  }}
                  className="p-1 hover:bg-ae-dark rounded"
                  title="編集"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(preset.id);
                  }}
                  className="p-1 hover:bg-ae-dark rounded"
                  title="削除"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-ae-text-secondary">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{preset.duration} frames</span>
              </div>
              <div className="flex justify-between">
                <span>Loop:</span>
                <span>{preset.loop ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm === preset.id && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card max-w-sm">
                  <h3 className="text-lg font-semibold mb-2">プリセットを削除</h3>
                  <p className="text-ae-text-secondary mb-4">
                    「{preset.name}」を削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="btn-secondary flex-1"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
