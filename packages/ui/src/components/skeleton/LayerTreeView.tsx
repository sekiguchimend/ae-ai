'use client';

import { useState } from 'react';
import type { LayerData } from '@ae-ai/types';

interface LayerTreeViewProps {
  layers: LayerData[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
}

interface LayerNodeProps {
  layer: LayerData;
  allLayers: LayerData[];
  depth: number;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
}

function LayerNode({ layer, allLayers, depth, selectedLayerId, onSelectLayer }: LayerNodeProps) {
  const [expanded, setExpanded] = useState(true);

  // Find child layers
  const children = allLayers.filter(l => l.parentIndex === layer.index);
  const hasChildren = children.length > 0;

  const isSelected = selectedLayerId === layer.name;

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'shape':
        return '◇';
      case 'null':
        return '○';
      case 'footage':
        return '▣';
      case 'text':
        return 'T';
      case 'camera':
        return '📷';
      case 'light':
        return '💡';
      default:
        return '□';
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded hover:bg-ae-dark ${
          isSelected ? 'bg-ae-accent/20 border-l-2 border-ae-accent' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectLayer(layer.name)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-ae-text-secondary hover:text-ae-text"
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-ae-text-secondary text-sm">
          {getLayerIcon(layer.type)}
        </span>
        <span className={`text-sm truncate ${isSelected ? 'text-ae-accent' : ''}`}>
          {layer.name}
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <LayerNode
              key={child.index}
              layer={child}
              allLayers={allLayers}
              depth={depth + 1}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayerTreeView({ layers, selectedLayerId, onSelectLayer }: LayerTreeViewProps) {
  // Find root layers (no parent)
  const rootLayers = layers.filter(l => l.parentIndex === null || l.parentIndex === undefined);

  if (layers.length === 0) {
    return (
      <div className="text-center py-8 text-ae-text-secondary">
        <p>レイヤーデータがありません</p>
        <p className="text-sm mt-2">
          After EffectsのCEPパネルから<br />
          骨格データをキャプチャしてください
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[400px]">
      {rootLayers.map((layer) => (
        <LayerNode
          key={layer.index}
          layer={layer}
          allLayers={layers}
          depth={0}
          selectedLayerId={selectedLayerId}
          onSelectLayer={onSelectLayer}
        />
      ))}
    </div>
  );
}
