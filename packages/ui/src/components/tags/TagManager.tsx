'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tag } from '@ae-ai/types';

interface TagManagerProps {
  characterId: string;
  onUpdate?: () => void;
}

export function TagManager({ characterId, onUpdate }: TagManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [characterTags, setCharacterTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [characterId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      setAllTags(tagsData || []);

      // Fetch character's tags
      const { data: characterTagsData } = await supabase
        .from('character_tags')
        .select('tag_id')
        .eq('character_id', characterId);

      setCharacterTags(characterTagsData?.map((ct) => ct.tag_id) || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = async (tagId: string) => {
    setSaving(true);
    try {
      if (characterTags.includes(tagId)) {
        // Remove tag
        const { error } = await supabase
          .from('character_tags')
          .delete()
          .eq('character_id', characterId)
          .eq('tag_id', tagId);

        if (error) throw error;
        setCharacterTags(characterTags.filter((id) => id !== tagId));
      } else {
        // Add tag
        const { error } = await supabase
          .from('character_tags')
          .insert({ character_id: characterId, tag_id: tagId });

        if (error) throw error;
        setCharacterTags([...characterTags, tagId]);
      }

      onUpdate?.();
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-ae-text-secondary">読み込み中...</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">タグ</span>
        {saving && (
          <span className="text-xs text-ae-text-secondary">保存中...</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isAssigned = characterTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => handleToggleTag(tag.id)}
              disabled={saving}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                isAssigned
                  ? 'bg-ae-accent text-white'
                  : 'bg-ae-dark text-ae-text-secondary hover:text-ae-text'
              }`}
              style={{
                backgroundColor: isAssigned ? (tag.color || undefined) : undefined,
              }}
            >
              {tag.name}
              {isAssigned && ' ✓'}
            </button>
          );
        })}

        {allTags.length === 0 && (
          <p className="text-xs text-ae-text-secondary">
            タグがありません
          </p>
        )}
      </div>
    </div>
  );
}
