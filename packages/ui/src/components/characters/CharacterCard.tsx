'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Character } from '@ae-ai/types';

interface CharacterCardProps {
  character: Character;
  onDelete: () => void;
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', character.id);

      if (error) throw error;
      onDelete();
    } catch (error) {
      console.error('Failed to delete character:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="card hover:border-ae-accent transition-colors">
      {/* Thumbnail */}
      <div className="aspect-video bg-ae-dark rounded mb-3 flex items-center justify-center">
        {character.thumbnail_url ? (
          <img
            src={character.thumbnail_url}
            alt={character.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <span className="text-4xl text-ae-text-secondary">
            {character.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <h3 className="font-semibold text-lg mb-1">{character.name}</h3>
      {character.description && (
        <p className="text-ae-text-secondary text-sm mb-2 line-clamp-2">
          {character.description}
        </p>
      )}
      <p className="text-ae-text-secondary text-xs">
        作成日: {formatDate(character.created_at)}
      </p>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Link
          href={`/characters/${character.id}`}
          className="btn-primary flex-1 text-center"
        >
          編集
        </Link>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-secondary px-3"
        >
          削除
        </button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-sm">
            <h3 className="text-lg font-semibold mb-2">キャラクターを削除</h3>
            <p className="text-ae-text-secondary mb-4">
              「{character.name}」を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1"
                disabled={deleting}
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
