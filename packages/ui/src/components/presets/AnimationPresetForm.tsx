'use client';

import { useState, useEffect } from 'react';
import type { AnimationPreset, KeyframeData } from '@ae-ai/types';

interface AnimationPresetFormProps {
  preset?: AnimationPreset | null;
  characterId: string;
  onSave: (preset: Omit<AnimationPreset, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: 'walk', label: '歩行' },
  { value: 'run', label: '走行' },
  { value: 'jump', label: 'ジャンプ' },
  { value: 'greeting', label: '挨拶' },
  { value: 'idle', label: '待機' },
  { value: 'attack', label: '攻撃' },
  { value: 'custom', label: 'カスタム' },
];

export function AnimationPresetForm({ preset, characterId, onSave, onCancel }: AnimationPresetFormProps) {
  const [name, setName] = useState(preset?.name || '');
  const [category, setCategory] = useState(preset?.category || 'custom');
  const [duration, setDuration] = useState(preset?.duration || 30);
  const [loop, setLoop] = useState(preset?.loop ?? false);
  const [keyframes, setKeyframes] = useState<KeyframeData[]>(preset?.keyframes || []);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!preset;

  const handleAddKeyframe = () => {
    const newKeyframe: KeyframeData = {
      time: keyframes.length > 0 ? keyframes[keyframes.length - 1].time + 5 : 0,
      property: 'rotation',
      value: 0,
      easing: {
        type: 'easeInOut',
      },
    };
    setKeyframes([...keyframes, newKeyframe]);
  };

  const handleUpdateKeyframe = (index: number, updates: Partial<KeyframeData>) => {
    const updated = [...keyframes];
    updated[index] = { ...updated[index], ...updates };
    setKeyframes(updated);
  };

  const handleRemoveKeyframe = (index: number) => {
    setKeyframes(keyframes.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('プリセット名を入力してください');
      return;
    }

    if (duration <= 0) {
      setError('Duration は1以上を指定してください');
      return;
    }

    onSave({
      character_id: characterId,
      name: name.trim(),
      category,
      duration,
      loop,
      keyframes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-ae-border pb-3">
        <h3 className="font-semibold text-lg">
          {isEdit ? 'プリセットを編集' : '新規プリセット作成'}
        </h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">
            プリセット名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field w-full"
            placeholder="例: 歩行サイクル"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field w-full"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Duration (frames)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="input-field w-full"
              min={1}
              max={9999}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">ループ再生</span>
            </label>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">キーフレーム</h4>
          <button
            type="button"
            onClick={handleAddKeyframe}
            className="text-sm text-ae-accent hover:underline"
          >
            + キーフレームを追加
          </button>
        </div>

        {keyframes.length === 0 ? (
          <div className="bg-ae-dark p-4 rounded text-center text-ae-text-secondary text-sm">
            キーフレームがありません
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto">
            {keyframes.map((kf, index) => (
              <div key={index} className="bg-ae-dark p-3 rounded flex items-center gap-3">
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-ae-text-secondary">Time</label>
                    <input
                      type="number"
                      value={kf.time}
                      onChange={(e) =>
                        handleUpdateKeyframe(index, { time: parseInt(e.target.value) })
                      }
                      className="input-field w-full text-sm"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ae-text-secondary">Property</label>
                    <select
                      value={kf.property}
                      onChange={(e) =>
                        handleUpdateKeyframe(index, { property: e.target.value as KeyframeData['property'] })
                      }
                      className="input-field w-full text-sm"
                    >
                      <option value="position">Position</option>
                      <option value="rotation">Rotation</option>
                      <option value="scale">Scale</option>
                      <option value="opacity">Opacity</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-ae-text-secondary">Value</label>
                    <input
                      type="number"
                      value={typeof kf.value === 'number' ? kf.value : 0}
                      onChange={(e) =>
                        handleUpdateKeyframe(index, { value: parseFloat(e.target.value) })
                      }
                      className="input-field w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ae-text-secondary">Easing</label>
                    <select
                      value={kf.easing?.type || 'linear'}
                      onChange={(e) =>
                        handleUpdateKeyframe(index, {
                          easing: { type: e.target.value as 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bezier' },
                        })
                      }
                      className="input-field w-full text-sm"
                    >
                      <option value="linear">Linear</option>
                      <option value="easeIn">Ease In</option>
                      <option value="easeOut">Ease Out</option>
                      <option value="easeInOut">Ease In-Out</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyframe(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-ae-border">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          キャンセル
        </button>
        <button type="submit" className="btn-primary flex-1">
          {isEdit ? '更新' : '作成'}
        </button>
      </div>
    </form>
  );
}
