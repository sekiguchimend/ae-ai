'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CreateCharacterModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCharacterModal({ onClose, onCreated }: CreateCharacterModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('キャラクター名を入力してください');
      return;
    }

    if (name.length > 100) {
      setError('キャラクター名は100文字以内で入力してください');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('ログインが必要です');
        return;
      }

      const { error: insertError } = await supabase.from('characters').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
      });

      if (insertError) throw insertError;

      onCreated();
    } catch (err) {
      console.error('Failed to create character:', err);
      setError('キャラクターの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">新規キャラクター作成</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              キャラクター名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="例: キャラクターA"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm mb-1">
              説明（任意）
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              placeholder="キャラクターの説明..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
