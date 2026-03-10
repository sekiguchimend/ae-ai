'use client';

import { useState, useRef } from 'react';
import type { AnimationPreset } from '@ae-ai/types';

interface PresetImportExportProps {
  presets: AnimationPreset[];
  onImport: (presets: Omit<AnimationPreset, 'id' | 'created_at' | 'updated_at'>[]) => void;
}

export function PresetImportExport({ presets, onImport }: PresetImportExportProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = presets.map(({ id, created_at, updated_at, ...preset }) => preset);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation-presets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('Invalid format: expected an array');
      }

      const validPresets = data.filter((item: unknown) => {
        if (typeof item !== 'object' || item === null) return false;
        const preset = item as Record<string, unknown>;
        return (
          typeof preset.name === 'string' &&
          typeof preset.category === 'string' &&
          typeof preset.duration === 'number'
        );
      });

      if (validPresets.length === 0) {
        throw new Error('No valid presets found in file');
      }

      onImport(validPresets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-sm text-red-400">{error}</span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="btn-secondary text-sm"
      >
        {importing ? 'インポート中...' : '📥 インポート'}
      </button>

      <button
        onClick={handleExport}
        disabled={presets.length === 0}
        className="btn-secondary text-sm"
      >
        📤 エクスポート
      </button>
    </div>
  );
}
