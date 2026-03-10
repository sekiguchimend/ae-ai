'use client';

import { useState } from 'react';
import type { ConstraintData } from '@ae-ai/types';

interface ConstraintPresetsProps {
  onSelectPreset: (constraint: ConstraintData) => void;
}

interface Preset {
  name: string;
  description: string;
  constraint: ConstraintData;
}

const DEFAULT_PRESETS: Preset[] = [
  {
    name: '腕（上腕）',
    description: '肩から肘までの自然な可動範囲',
    constraint: {
      movementLimits: {
        minAngle: -45,
        maxAngle: 180,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeInOut',
      },
    },
  },
  {
    name: '腕（前腕）',
    description: '肘から手首までの可動範囲',
    constraint: {
      movementLimits: {
        minAngle: 0,
        maxAngle: 145,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeOut',
      },
    },
  },
  {
    name: '脚（大腿）',
    description: '股関節からの可動範囲',
    constraint: {
      movementLimits: {
        minAngle: -30,
        maxAngle: 120,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeInOut',
      },
    },
  },
  {
    name: '脚（下腿）',
    description: '膝から足首までの可動範囲',
    constraint: {
      movementLimits: {
        minAngle: 0,
        maxAngle: 140,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeOut',
      },
    },
  },
  {
    name: '頭部',
    description: '首からの自然な頭部回転',
    constraint: {
      movementLimits: {
        minAngle: -45,
        maxAngle: 45,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeInOut',
      },
    },
  },
  {
    name: '胴体',
    description: '体幹の傾き範囲',
    constraint: {
      movementLimits: {
        minAngle: -30,
        maxAngle: 30,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeInOut',
      },
    },
  },
  {
    name: '手首',
    description: '手首の回転範囲',
    constraint: {
      movementLimits: {
        minAngle: -80,
        maxAngle: 80,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeOut',
      },
    },
  },
  {
    name: '指',
    description: '指の曲げ範囲',
    constraint: {
      movementLimits: {
        minAngle: 0,
        maxAngle: 90,
        axis: 'z',
      },
      recommendedEasing: {
        type: 'easeOut',
      },
    },
  },
];

export function ConstraintPresets({ onSelectPreset }: ConstraintPresetsProps) {
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-ae-text-secondary">
        プリセットから選択
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {allPresets.map((preset, index) => (
          <button
            key={index}
            onClick={() => onSelectPreset(preset.constraint)}
            className="text-left p-3 bg-ae-dark rounded hover:bg-ae-surface transition-colors"
          >
            <p className="font-medium text-sm">{preset.name}</p>
            <p className="text-xs text-ae-text-secondary mt-1">
              {preset.description}
            </p>
            <div className="flex gap-2 mt-2 text-xs text-ae-text-secondary">
              <span>
                {preset.constraint.movementLimits?.minAngle}° ~ {preset.constraint.movementLimits?.maxAngle}°
              </span>
              <span className="capitalize">
                {preset.constraint.recommendedEasing?.type}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
