'use client';

import { useState } from 'react';
import type { Style, StyleProperty } from '@ae-ai/types';

interface StyleEditorProps {
  style: Style | null;
  onSave: (style: Omit<Style, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  characterId: string;
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-ae-text-secondary">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-ae-border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field flex-1 text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

const DEFAULT_PROPERTIES: StyleProperty[] = [
  { name: 'primaryColor', type: 'color', value: '#3B82F6' },
  { name: 'secondaryColor', type: 'color', value: '#10B981' },
  { name: 'accentColor', type: 'color', value: '#F59E0B' },
  { name: 'backgroundColor', type: 'color', value: '#1F2937' },
  { name: 'outlineColor', type: 'color', value: '#000000' },
  { name: 'outlineWidth', type: 'number', value: 2 },
  { name: 'shadowColor', type: 'color', value: '#000000' },
  { name: 'shadowOpacity', type: 'number', value: 0.5 },
  { name: 'shadowDistance', type: 'number', value: 5 },
  { name: 'shadowAngle', type: 'number', value: 135 },
];

export function StyleEditor({ style, onSave, onCancel, characterId }: StyleEditorProps) {
  const [name, setName] = useState(style?.name || '');
  const [properties, setProperties] = useState<StyleProperty[]>(
    style?.properties || DEFAULT_PROPERTIES
  );
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!style;

  const handlePropertyChange = (index: number, value: string | number) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], value };
    setProperties(updated);
  };

  const handleAddProperty = () => {
    setProperties([
      ...properties,
      { name: '', type: 'color', value: '#000000' },
    ]);
  };

  const handleRemoveProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('スタイル名を入力してください');
      return;
    }

    onSave({
      character_id: characterId,
      name: name.trim(),
      properties,
    });
  };

  // Preview colors from properties
  const previewColors = properties
    .filter((p) => p.type === 'color')
    .slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-ae-border pb-3">
        <h3 className="font-semibold text-lg">
          {isEdit ? 'スタイルを編集' : '新規スタイル作成'}
        </h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* Style Name */}
      <div>
        <label className="block text-sm mb-1">
          スタイル名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field w-full"
          placeholder="例: デフォルトスタイル"
          maxLength={100}
        />
      </div>

      {/* Preview */}
      <div className="bg-ae-dark p-4 rounded">
        <p className="text-xs text-ae-text-secondary mb-2">プレビュー</p>
        <div className="flex gap-2 items-center justify-center py-4">
          {previewColors.map((prop, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full border-2 border-white/20"
              style={{ backgroundColor: prop.value as string }}
              title={prop.name}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <div
            className="w-24 h-24 rounded-lg relative"
            style={{
              backgroundColor: properties.find(p => p.name === 'backgroundColor')?.value as string || '#1F2937',
              boxShadow: `${
                Math.cos((properties.find(p => p.name === 'shadowAngle')?.value as number || 135) * Math.PI / 180) *
                (properties.find(p => p.name === 'shadowDistance')?.value as number || 5)
              }px ${
                Math.sin((properties.find(p => p.name === 'shadowAngle')?.value as number || 135) * Math.PI / 180) *
                (properties.find(p => p.name === 'shadowDistance')?.value as number || 5)
              }px 10px rgba(0,0,0,${properties.find(p => p.name === 'shadowOpacity')?.value || 0.5})`,
              border: `${properties.find(p => p.name === 'outlineWidth')?.value || 2}px solid ${
                properties.find(p => p.name === 'outlineColor')?.value || '#000000'
              }`,
            }}
          >
            <div
              className="absolute inset-2 rounded"
              style={{
                background: `linear-gradient(135deg, ${
                  properties.find(p => p.name === 'primaryColor')?.value || '#3B82F6'
                } 0%, ${
                  properties.find(p => p.name === 'secondaryColor')?.value || '#10B981'
                } 100%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">プロパティ</h4>
          <button
            type="button"
            onClick={handleAddProperty}
            className="text-sm text-ae-accent hover:underline"
          >
            + プロパティを追加
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-auto">
          {properties.map((prop, index) => (
            <div key={index} className="bg-ae-dark p-3 rounded flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-ae-text-secondary">名前</label>
                <input
                  type="text"
                  value={prop.name}
                  onChange={(e) => {
                    const updated = [...properties];
                    updated[index] = { ...updated[index], name: e.target.value };
                    setProperties(updated);
                  }}
                  className="input-field w-full text-sm"
                  placeholder="propertyName"
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-ae-text-secondary">タイプ</label>
                <select
                  value={prop.type}
                  onChange={(e) => {
                    const updated = [...properties];
                    const newType = e.target.value as 'color' | 'number' | 'string';
                    updated[index] = {
                      ...updated[index],
                      type: newType,
                      value: newType === 'color' ? '#000000' : newType === 'number' ? 0 : '',
                    };
                    setProperties(updated);
                  }}
                  className="input-field w-full text-sm"
                >
                  <option value="color">Color</option>
                  <option value="number">Number</option>
                  <option value="string">String</option>
                </select>
              </div>
              <div className="flex-1">
                {prop.type === 'color' ? (
                  <ColorPicker
                    label="値"
                    value={prop.value as string}
                    onChange={(v) => handlePropertyChange(index, v)}
                  />
                ) : (
                  <div>
                    <label className="text-xs text-ae-text-secondary">値</label>
                    <input
                      type={prop.type === 'number' ? 'number' : 'text'}
                      value={prop.value}
                      onChange={(e) =>
                        handlePropertyChange(
                          index,
                          prop.type === 'number' ? parseFloat(e.target.value) : e.target.value
                        )
                      }
                      className="input-field w-full text-sm"
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProperty(index)}
                className="text-red-400 hover:text-red-300 pb-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-ae-border">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          キャンセル
        </button>
        <button type="submit" className="btn-primary flex-1">
          {isEdit ? '更新' : '作成'}
        </button>
      </div>
    </form>
  );
}
