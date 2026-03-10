'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { SkeletonEditor } from '@/components/skeleton';
import { ConstraintEditor, ConstraintPresets } from '@/components/constraints';
import { AnimationPresetList, AnimationPresetForm, PresetImportExport } from '@/components/presets';
import type { Character, Skeleton, Style, AnimationPreset, ConstraintData } from '@ae-ai/types';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [skeleton, setSkeleton] = useState<Skeleton | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [presets, setPresets] = useState<AnimationPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'skeleton' | 'constraints' | 'style' | 'presets'>('skeleton');

  // Constraint editor state
  const [editingConstraintPart, setEditingConstraintPart] = useState<string | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<ConstraintData | undefined>(undefined);

  // Preset editor state
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AnimationPreset | null>(null);

  useEffect(() => {
    fetchCharacterData();
  }, [characterId]);

  const fetchCharacterData = async () => {
    setLoading(true);
    try {
      // Fetch character
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (charError) throw charError;
      setCharacter(charData);

      // Fetch skeleton
      const { data: skelData } = await supabase
        .from('skeletons')
        .select('*')
        .eq('character_id', characterId)
        .single();

      setSkeleton(skelData);

      // Fetch styles
      const { data: styleData } = await supabase
        .from('styles')
        .select('*')
        .eq('character_id', characterId);

      setStyles(styleData || []);

      // Fetch animation presets
      const { data: presetData } = await supabase
        .from('animation_presets')
        .select('*')
        .eq('character_id', characterId);

      setPresets(presetData || []);

    } catch (error) {
      console.error('Failed to fetch character:', error);
      router.push('/characters');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkeleton = async (updatedSkeleton: Skeleton) => {
    try {
      const { error } = await supabase
        .from('skeletons')
        .update({
          layers: updatedSkeleton.layers,
          constraints: updatedSkeleton.constraints,
        })
        .eq('id', updatedSkeleton.id);

      if (error) throw error;
      setSkeleton(updatedSkeleton);
    } catch (error) {
      console.error('Failed to update skeleton:', error);
    }
  };

  const handleSaveConstraint = async (constraint: ConstraintData) => {
    if (!skeleton || !editingConstraintPart) return;

    const updatedSkeleton: Skeleton = {
      ...skeleton,
      constraints: {
        ...skeleton.constraints,
        [editingConstraintPart]: constraint,
      },
    };

    await handleUpdateSkeleton(updatedSkeleton);
    setEditingConstraintPart(null);
    setEditingConstraint(undefined);
  };

  const handleSavePreset = async (presetData: Omit<AnimationPreset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingPreset) {
        const { error } = await supabase
          .from('animation_presets')
          .update(presetData)
          .eq('id', editingPreset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('animation_presets')
          .insert(presetData);
        if (error) throw error;
      }

      await fetchCharacterData();
      setShowPresetForm(false);
      setEditingPreset(null);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      const { error } = await supabase
        .from('animation_presets')
        .delete()
        .eq('id', presetId);
      if (error) throw error;
      await fetchCharacterData();
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  };

  const handleImportPresets = async (importedPresets: Omit<AnimationPreset, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const presetsWithCharacterId = importedPresets.map(p => ({
        ...p,
        character_id: characterId,
      }));

      const { error } = await supabase
        .from('animation_presets')
        .insert(presetsWithCharacterId);
      if (error) throw error;
      await fetchCharacterData();
    } catch (error) {
      console.error('Failed to import presets:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="loading mx-auto mb-4" />
        <p className="text-ae-text-secondary">読み込み中...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="text-center py-12">
        <p className="text-ae-text-secondary">キャラクターが見つかりません</p>
        <Link href="/characters" className="btn-primary mt-4 inline-block">
          一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/characters" className="text-ae-text-secondary hover:text-ae-text">
          ← 戻る
        </Link>
        <h1 className="text-2xl font-bold">{character.name}</h1>
      </div>

      {/* Character Info */}
      <div className="card">
        <div className="flex gap-6">
          <div className="w-32 h-32 bg-ae-dark rounded flex items-center justify-center">
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
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">{character.name}</h2>
            <p className="text-ae-text-secondary">
              {character.description || '説明なし'}
            </p>
            <p className="text-sm text-ae-text-secondary mt-2">
              作成日: {new Date(character.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ae-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('skeleton')}
          className={`px-4 py-2 -mb-px whitespace-nowrap ${
            activeTab === 'skeleton'
              ? 'border-b-2 border-ae-accent text-ae-accent'
              : 'text-ae-text-secondary'
          }`}
        >
          骨格データ
        </button>
        <button
          onClick={() => setActiveTab('constraints')}
          className={`px-4 py-2 -mb-px whitespace-nowrap ${
            activeTab === 'constraints'
              ? 'border-b-2 border-ae-accent text-ae-accent'
              : 'text-ae-text-secondary'
          }`}
        >
          制約条件
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`px-4 py-2 -mb-px whitespace-nowrap ${
            activeTab === 'style'
              ? 'border-b-2 border-ae-accent text-ae-accent'
              : 'text-ae-text-secondary'
          }`}
        >
          スタイル
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2 -mb-px whitespace-nowrap ${
            activeTab === 'presets'
              ? 'border-b-2 border-ae-accent text-ae-accent'
              : 'text-ae-text-secondary'
          }`}
        >
          アニメーション
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'skeleton' && (
        <SkeletonEditor
          skeleton={skeleton}
          onUpdate={handleUpdateSkeleton}
        />
      )}

      {activeTab === 'constraints' && (
        <div className="space-y-4">
          {editingConstraintPart ? (
            <div className="card">
              <ConstraintEditor
                partName={editingConstraintPart}
                constraint={editingConstraint}
                onSave={handleSaveConstraint}
                onCancel={() => {
                  setEditingConstraintPart(null);
                  setEditingConstraint(undefined);
                }}
              />
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="font-semibold mb-4">制約条件の設定</h3>
                {skeleton?.layers && skeleton.layers.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-ae-text-secondary mb-4">
                      部位を選択して制約条件を設定します
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {skeleton.layers.map((layer) => {
                        const hasConstraint = skeleton.constraints?.[layer.name];
                        return (
                          <button
                            key={layer.index}
                            onClick={() => {
                              setEditingConstraintPart(layer.name);
                              setEditingConstraint(skeleton.constraints?.[layer.name]);
                            }}
                            className={`text-left p-3 rounded border transition-colors ${
                              hasConstraint
                                ? 'border-ae-accent bg-ae-accent/10'
                                : 'border-ae-border hover:border-ae-accent'
                            }`}
                          >
                            <p className="font-medium text-sm">{layer.name}</p>
                            <p className="text-xs text-ae-text-secondary">
                              {hasConstraint ? '設定済み' : '未設定'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-ae-text-secondary">
                    骨格データがありません。先に骨格をキャプチャしてください。
                  </p>
                )}
              </div>

              <div className="card">
                <ConstraintPresets
                  onSelectPreset={(constraint) => {
                    if (skeleton?.layers?.[0]) {
                      setEditingConstraintPart(skeleton.layers[0].name);
                      setEditingConstraint(constraint);
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'style' && (
        <div className="card">
          <h3 className="font-semibold mb-4">スタイル</h3>
          {styles.length > 0 ? (
            <div className="space-y-2">
              {styles.map((style) => (
                <div key={style.id} className="bg-ae-dark p-3 rounded">
                  <p className="font-medium">{style.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ae-text-secondary">
              スタイルがまだ登録されていません。
            </p>
          )}
        </div>
      )}

      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">アニメーションプリセット</h3>
            <div className="flex gap-2">
              <PresetImportExport
                presets={presets}
                onImport={handleImportPresets}
              />
              <button
                onClick={() => {
                  setEditingPreset(null);
                  setShowPresetForm(true);
                }}
                className="btn-primary"
              >
                + 新規作成
              </button>
            </div>
          </div>

          {showPresetForm ? (
            <div className="card">
              <AnimationPresetForm
                preset={editingPreset}
                characterId={characterId}
                onSave={handleSavePreset}
                onCancel={() => {
                  setShowPresetForm(false);
                  setEditingPreset(null);
                }}
              />
            </div>
          ) : (
            <div className="card">
              <AnimationPresetList
                presets={presets}
                onSelect={(preset) => {
                  // Could open preview or apply to character
                  console.log('Selected preset:', preset);
                }}
                onEdit={(preset) => {
                  setEditingPreset(preset);
                  setShowPresetForm(true);
                }}
                onDelete={handleDeletePreset}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
