'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tag } from '@ae-ai/types';

interface TagFilterProps {
  selectedTags: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('tags').insert({
        name: newTagName.trim(),
        user_id: user.id,
      });

      if (error) throw error;

      setNewTagName('');
      setShowCreateInput(false);
      fetchTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  if (loading) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-ae-text-secondary">タグ読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ae-text-secondary">タグでフィルター</span>
        {selectedTags.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-ae-accent hover:underline"
          >
            クリア
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => handleToggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                isSelected
                  ? 'bg-ae-accent text-white'
                  : 'bg-ae-dark text-ae-text-secondary hover:text-ae-text'
              }`}
              style={{
                backgroundColor: isSelected ? (tag.color || undefined) : undefined,
              }}
            >
              {tag.name}
              {isSelected && ' ✓'}
            </button>
          );
        })}

        {!showCreateInput ? (
          <button
            onClick={() => setShowCreateInput(true)}
            className="px-3 py-1 rounded-full text-sm border border-dashed border-ae-border text-ae-text-secondary hover:border-ae-accent hover:text-ae-accent"
          >
            + 新規タグ
          </button>
        ) : (
          <div className="flex gap-1">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag();
                if (e.key === 'Escape') setShowCreateInput(false);
              }}
              className="input-field text-sm w-32"
              placeholder="タグ名"
              autoFocus
            />
            <button
              onClick={handleCreateTag}
              className="btn-primary text-sm px-2"
            >
              追加
            </button>
            <button
              onClick={() => setShowCreateInput(false)}
              className="btn-secondary text-sm px-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {tags.length === 0 && (
        <p className="text-xs text-ae-text-secondary">
          タグがありません。「+ 新規タグ」で作成できます。
        </p>
      )}
    </div>
  );
}
