'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { CreateCharacterModal } from '@/components/characters/CreateCharacterModal';
import type { Character } from '@ae-ai/types';

export default function CharactersPage() {
  const { characters, setCharacters, isLoading, setIsLoading } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data as Character[]);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCharacters = characters
    .filter((char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">キャラクター管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + 新規作成
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="キャラクター名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'created_at' | 'name')}
          className="input-field"
        >
          <option value="created_at">作成日順</option>
          <option value="name">名前順</option>
        </select>
      </div>

      {/* Character Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="loading mx-auto mb-4" />
          <p className="text-ae-text-secondary">読み込み中...</p>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-ae-text-secondary mb-4">
            {searchQuery
              ? '検索結果が見つかりません'
              : 'キャラクターがまだ登録されていません'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              最初のキャラクターを作成
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={fetchCharacters}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCharacterModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchCharacters();
          }}
        />
      )}
    </div>
  );
}
