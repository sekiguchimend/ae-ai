'use client';

import { useState, useEffect } from 'react';
import type { LayerData, PhysicalParameters, ConstraintData } from '@ae-ai/types';

interface LayerPropertiesPanelProps {
  layer: LayerData | null;
  constraints?: ConstraintData;
  onUpdateConstraints?: (constraints: ConstraintData) => void;
}

interface Vector2InputProps {
  label: string;
  value: [number, number];
  onChange?: (value: [number, number]) => void;
  readOnly?: boolean;
}

interface Vector3InputProps {
  label: string;
  value: [number, number, number];
  onChange?: (value: [number, number, number]) => void;
  readOnly?: boolean;
}

function Vector2Input({ label, value, onChange, readOnly = true }: Vector2InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-ae-text-secondary">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-ae-text-secondary mr-1">X</span>
          <input
            type="number"
            value={value[0].toFixed(1)}
            onChange={(e) => onChange?.([parseFloat(e.target.value), value[1]])}
            className="input-field w-full text-sm"
            readOnly={readOnly}
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-ae-text-secondary mr-1">Y</span>
          <input
            type="number"
            value={value[1].toFixed(1)}
            onChange={(e) => onChange?.([value[0], parseFloat(e.target.value)])}
            className="input-field w-full text-sm"
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

function Vector3Input({ label, value, onChange, readOnly = true }: Vector3InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-ae-text-secondary">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-xs text-ae-text-secondary mr-1">X</span>
          <input
            type="number"
            value={value[0].toFixed(1)}
            onChange={(e) => onChange?.([parseFloat(e.target.value), value[1], value[2]])}
            className="input-field w-full text-sm"
            readOnly={readOnly}
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-ae-text-secondary mr-1">Y</span>
          <input
            type="number"
            value={value[1].toFixed(1)}
            onChange={(e) => onChange?.([value[0], parseFloat(e.target.value), value[2]])}
            className="input-field w-full text-sm"
            readOnly={readOnly}
          />
        </div>
        <div className="flex-1">
          <span className="text-xs text-ae-text-secondary mr-1">Z</span>
          <input
            type="number"
            value={value[2].toFixed(1)}
            onChange={(e) => onChange?.([value[0], value[1], parseFloat(e.target.value)])}
            className="input-field w-full text-sm"
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

export function LayerPropertiesPanel({ layer, constraints, onUpdateConstraints }: LayerPropertiesPanelProps) {
  if (!layer) {
    return (
      <div className="text-center py-8 text-ae-text-secondary">
        <p>レイヤーを選択してください</p>
      </div>
    );
  }

  const params = layer.physicalParameters;

  return (
    <div className="space-y-4">
      {/* Layer Info */}
      <div className="border-b border-ae-border pb-3">
        <h3 className="font-semibold text-lg">{layer.name}</h3>
        <div className="flex gap-2 mt-1">
          <span className="text-xs bg-ae-dark px-2 py-0.5 rounded">
            {layer.type}
          </span>
          <span className="text-xs text-ae-text-secondary">
            Index: {layer.index}
          </span>
        </div>
      </div>

      {/* Transform Properties */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-ae-text-secondary">Transform</h4>

        {params.position && (
          <Vector3Input
            label="Position"
            value={params.position as [number, number, number]}
          />
        )}

        {params.anchorPoint && (
          <Vector2Input
            label="Anchor Point"
            value={params.anchorPoint as [number, number]}
          />
        )}

        {params.scale && (
          <Vector2Input
            label="Scale (%)"
            value={params.scale as [number, number]}
          />
        )}

        <div className="space-y-1">
          <label className="text-xs text-ae-text-secondary">Rotation</label>
          <input
            type="number"
            value={params.rotation?.toFixed(1) ?? 0}
            className="input-field w-full text-sm"
            readOnly
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-ae-text-secondary">Opacity (%)</label>
          <input
            type="number"
            value={params.opacity?.toFixed(1) ?? 100}
            className="input-field w-full text-sm"
            readOnly
          />
        </div>
      </div>

      {/* Constraints Section */}
      {constraints && (
        <div className="space-y-3 border-t border-ae-border pt-3">
          <h4 className="text-sm font-medium text-ae-text-secondary">Constraints</h4>

          {constraints.movementLimits && (
            <div className="bg-ae-dark p-2 rounded">
              <p className="text-xs text-ae-text-secondary mb-1">Movement Limits</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-ae-text-secondary">Min: </span>
                  {constraints.movementLimits.minAngle}°
                </div>
                <div>
                  <span className="text-ae-text-secondary">Max: </span>
                  {constraints.movementLimits.maxAngle}°
                </div>
                <div className="col-span-2">
                  <span className="text-ae-text-secondary">Axis: </span>
                  {constraints.movementLimits.axis}
                </div>
              </div>
            </div>
          )}

          {constraints.recommendedEasing && (
            <div className="bg-ae-dark p-2 rounded">
              <p className="text-xs text-ae-text-secondary mb-1">Recommended Easing</p>
              <p className="text-sm capitalize">{constraints.recommendedEasing.type}</p>
            </div>
          )}
        </div>
      )}

      {/* Parent Info */}
      {layer.parentIndex && (
        <div className="border-t border-ae-border pt-3">
          <p className="text-sm text-ae-text-secondary">
            Parent Index: {layer.parentIndex}
          </p>
        </div>
      )}
    </div>
  );
}
