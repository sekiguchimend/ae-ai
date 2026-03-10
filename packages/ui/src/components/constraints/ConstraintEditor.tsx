'use client';

import { useState, useEffect } from 'react';
import type { ConstraintData, MovementLimit, EasingConfig } from '@ae-ai/types';

interface ConstraintEditorProps {
  partName: string;
  constraint?: ConstraintData;
  onSave: (constraint: ConstraintData) => void;
  onCancel: () => void;
}

const EASING_TYPES = [
  { value: 'linear', label: 'Linear' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In-Out' },
  { value: 'bezier', label: 'Custom Bezier' },
] as const;

const AXIS_OPTIONS = [
  { value: 'x', label: 'X軸' },
  { value: 'y', label: 'Y軸' },
  { value: 'z', label: 'Z軸' },
] as const;

export function ConstraintEditor({ partName, constraint, onSave, onCancel }: ConstraintEditorProps) {
  const [minAngle, setMinAngle] = useState(constraint?.movementLimits?.minAngle ?? -180);
  const [maxAngle, setMaxAngle] = useState(constraint?.movementLimits?.maxAngle ?? 180);
  const [axis, setAxis] = useState<'x' | 'y' | 'z'>(constraint?.movementLimits?.axis ?? 'z');
  const [easingType, setEasingType] = useState<string>(constraint?.recommendedEasing?.type ?? 'easeInOut');
  const [bezierPoints, setBezierPoints] = useState<[number, number, number, number]>(
    constraint?.recommendedEasing?.bezierPoints ?? [0.42, 0, 0.58, 1]
  );

  const handleSave = () => {
    const newConstraint: ConstraintData = {
      movementLimits: {
        minAngle,
        maxAngle,
        axis,
      },
      recommendedEasing: {
        type: easingType as EasingConfig['type'],
        bezierPoints: easingType === 'bezier' ? bezierPoints : undefined,
      },
    };

    onSave(newConstraint);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-ae-border pb-3">
        <h3 className="font-semibold text-lg">制約条件の設定</h3>
        <p className="text-sm text-ae-text-secondary mt-1">
          部位: <span className="text-ae-accent">{partName}</span>
        </p>
      </div>

      {/* Movement Limits */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">可動限界値</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ae-text-secondary mb-1">
              最小角度 (°)
            </label>
            <input
              type="number"
              value={minAngle}
              onChange={(e) => setMinAngle(parseFloat(e.target.value))}
              min={-360}
              max={360}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-ae-text-secondary mb-1">
              最大角度 (°)
            </label>
            <input
              type="number"
              value={maxAngle}
              onChange={(e) => setMaxAngle(parseFloat(e.target.value))}
              min={-360}
              max={360}
              className="input-field w-full"
            />
          </div>
        </div>

        {/* Angle Preview */}
        <div className="bg-ae-dark p-4 rounded">
          <div className="relative w-32 h-32 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="2" />

              {/* Allowed range arc */}
              <path
                d={describeArc(50, 50, 40, minAngle, maxAngle)}
                fill="none"
                stroke="#00A3FF"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.5"
              />

              {/* Center point */}
              <circle cx="50" cy="50" r="3" fill="#E0E0E0" />

              {/* Min angle line */}
              <line
                x1="50"
                y1="50"
                x2={50 + 40 * Math.cos((minAngle - 90) * Math.PI / 180)}
                y2={50 + 40 * Math.sin((minAngle - 90) * Math.PI / 180)}
                stroke="#FF6B6B"
                strokeWidth="2"
              />

              {/* Max angle line */}
              <line
                x1="50"
                y1="50"
                x2={50 + 40 * Math.cos((maxAngle - 90) * Math.PI / 180)}
                y2={50 + 40 * Math.sin((maxAngle - 90) * Math.PI / 180)}
                stroke="#4ECB71"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <span className="text-red-400">Min: {minAngle}°</span>
            <span className="text-green-400">Max: {maxAngle}°</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-ae-text-secondary mb-1">
            回転軸
          </label>
          <div className="flex gap-2">
            {AXIS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAxis(opt.value)}
                className={`px-4 py-2 rounded text-sm ${
                  axis === opt.value
                    ? 'bg-ae-accent text-white'
                    : 'bg-ae-dark text-ae-text-secondary hover:text-ae-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Easing Settings */}
      <div className="space-y-4 border-t border-ae-border pt-4">
        <h4 className="text-sm font-medium">推奨Easing</h4>

        <div>
          <label className="block text-xs text-ae-text-secondary mb-1">
            イージングタイプ
          </label>
          <select
            value={easingType}
            onChange={(e) => setEasingType(e.target.value)}
            className="input-field w-full"
          >
            {EASING_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {easingType === 'bezier' && (
          <div className="space-y-3">
            <label className="block text-xs text-ae-text-secondary">
              ベジェ曲線制御点
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['X1', 'Y1', 'X2', 'Y2'].map((label, i) => (
                <div key={label}>
                  <label className="block text-xs text-ae-text-secondary mb-1">
                    {label}
                  </label>
                  <input
                    type="number"
                    value={bezierPoints[i]}
                    onChange={(e) => {
                      const newPoints = [...bezierPoints] as [number, number, number, number];
                      newPoints[i] = parseFloat(e.target.value);
                      setBezierPoints(newPoints);
                    }}
                    min={0}
                    max={1}
                    step={0.01}
                    className="input-field w-full text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Bezier Preview */}
            <div className="bg-ae-dark p-4 rounded">
              <svg viewBox="0 0 100 100" className="w-full h-24">
                <path
                  d={`M 0,100 C ${bezierPoints[0] * 100},${100 - bezierPoints[1] * 100} ${bezierPoints[2] * 100},${100 - bezierPoints[3] * 100} 100,0`}
                  fill="none"
                  stroke="#00A3FF"
                  strokeWidth="2"
                />
                {/* Control points */}
                <circle cx={bezierPoints[0] * 100} cy={100 - bezierPoints[1] * 100} r="3" fill="#FF6B6B" />
                <circle cx={bezierPoints[2] * 100} cy={100 - bezierPoints[3] * 100} r="3" fill="#4ECB71" />
                {/* Control lines */}
                <line x1="0" y1="100" x2={bezierPoints[0] * 100} y2={100 - bezierPoints[1] * 100} stroke="#FF6B6B" strokeWidth="1" opacity="0.5" />
                <line x1="100" y1="0" x2={bezierPoints[2] * 100} y2={100 - bezierPoints[3] * 100} stroke="#4ECB71" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
          </div>
        )}

        {/* Easing Preview */}
        <div className="bg-ae-dark p-3 rounded">
          <p className="text-xs text-ae-text-secondary mb-2">プレビュー</p>
          <div className="h-2 bg-ae-surface rounded overflow-hidden">
            <div
              className="h-full bg-ae-accent transition-all duration-1000"
              style={{
                width: '100%',
                animationTimingFunction: getEasingCSS(easingType, bezierPoints),
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-ae-border">
        <button onClick={onCancel} className="btn-secondary flex-1">
          キャンセル
        </button>
        <button onClick={handleSave} className="btn-primary flex-1">
          保存
        </button>
      </div>
    </div>
  );
}

// Helper function to create SVG arc path
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle - 90);
  const end = polarToCartesian(x, y, radius, startAngle - 90);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
}

function getEasingCSS(type: string, bezierPoints: [number, number, number, number]): string {
  switch (type) {
    case 'linear':
      return 'linear';
    case 'easeIn':
      return 'ease-in';
    case 'easeOut':
      return 'ease-out';
    case 'easeInOut':
      return 'ease-in-out';
    case 'bezier':
      return `cubic-bezier(${bezierPoints.join(',')})`;
    default:
      return 'ease';
  }
}
