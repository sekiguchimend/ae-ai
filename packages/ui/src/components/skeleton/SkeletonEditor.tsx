'use client';

import { useState, useMemo } from 'react';
import { LayerTreeView } from './LayerTreeView';
import { LayerPropertiesPanel } from './LayerPropertiesPanel';
import type { Skeleton, LayerData, ConstraintData } from '@ae-ai/types';

interface SkeletonEditorProps {
  skeleton: Skeleton | null;
  onUpdate?: (skeleton: Skeleton) => void;
}

export function SkeletonEditor({ skeleton, onUpdate }: SkeletonEditorProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const layers = skeleton?.layers || [];

  const selectedLayer = useMemo(() => {
    if (!selectedLayerId) return null;
    return layers.find(l => l.name === selectedLayerId) || null;
  }, [selectedLayerId, layers]);

  const layerConstraints = useMemo(() => {
    if (!selectedLayer || !skeleton?.constraints) return undefined;
    return skeleton.constraints[selectedLayer.name];
  }, [selectedLayer, skeleton?.constraints]);

  const handleUpdateConstraints = (constraints: ConstraintData) => {
    if (!skeleton || !selectedLayer || !onUpdate) return;

    const updatedSkeleton: Skeleton = {
      ...skeleton,
      constraints: {
        ...skeleton.constraints,
        [selectedLayer.name]: constraints,
      },
    };

    onUpdate(updatedSkeleton);
  };

  if (!skeleton) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">🦴</div>
        <h3 className="text-lg font-semibold mb-2">骨格データなし</h3>
        <p className="text-ae-text-secondary mb-4">
          After EffectsのCEPパネルから<br />
          キャラクターの骨格をキャプチャしてください
        </p>
        <div className="text-sm text-ae-text-secondary bg-ae-dark p-4 rounded max-w-md mx-auto">
          <p className="font-medium mb-2">手順:</p>
          <ol className="text-left list-decimal list-inside space-y-1">
            <li>After Effectsでキャラクターを開く</li>
            <li>骨格となるレイヤーを選択</li>
            <li>CEPパネルの「キャプチャ」ボタンをクリック</li>
            <li>このページを更新</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Layer Tree */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">レイヤー構造</h3>
            <span className="text-sm text-ae-text-secondary">
              {layers.length} レイヤー
            </span>
          </div>
          <LayerTreeView
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
          />
        </div>

        {/* Layer Statistics */}
        <div className="card mt-4">
          <h3 className="font-semibold mb-3">統計</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-ae-dark p-3 rounded">
              <p className="text-2xl font-bold">{layers.length}</p>
              <p className="text-xs text-ae-text-secondary">総レイヤー数</p>
            </div>
            <div className="bg-ae-dark p-3 rounded">
              <p className="text-2xl font-bold">
                {layers.filter(l => l.type === 'shape').length}
              </p>
              <p className="text-xs text-ae-text-secondary">シェイプレイヤー</p>
            </div>
            <div className="bg-ae-dark p-3 rounded">
              <p className="text-2xl font-bold">
                {layers.filter(l => l.type === 'null').length}
              </p>
              <p className="text-xs text-ae-text-secondary">ヌルレイヤー</p>
            </div>
            <div className="bg-ae-dark p-3 rounded">
              <p className="text-2xl font-bold">
                {Object.keys(skeleton.constraints || {}).length}
              </p>
              <p className="text-xs text-ae-text-secondary">制約設定数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="lg:col-span-1">
        <div className="card sticky top-4">
          <h3 className="font-semibold mb-4">プロパティ</h3>
          <LayerPropertiesPanel
            layer={selectedLayer}
            constraints={layerConstraints}
            onUpdateConstraints={handleUpdateConstraints}
          />
        </div>
      </div>
    </div>
  );
}
