/**
 * Character Context Builder for AI
 * Fetches and formats character data from Supabase for AI context injection
 */

import type { Character, Skeleton, Style, AnimationPreset, ConstraintData } from '@ae-ai/types';

export interface CharacterContext {
  character: Character;
  skeleton?: Skeleton;
  styles?: Style[];
  presets?: AnimationPreset[];
}

export interface FormattedContext {
  summary: string;
  layerStructure: string;
  constraints: string;
  styles: string;
  presets: string;
  full: string;
  tokenEstimate: number;
}

/**
 * Build character context from fetched data
 */
export function buildCharacterContextFromData(data: CharacterContext): FormattedContext {
  const parts: string[] = [];

  // Character summary
  const summary = `Character: ${data.character.name}
Description: ${data.character.description || 'No description'}
Created: ${new Date(data.character.created_at).toISOString().split('T')[0]}`;

  parts.push('## Character Summary');
  parts.push(summary);

  // Layer structure
  let layerStructure = '';
  if (data.skeleton?.layers && data.skeleton.layers.length > 0) {
    layerStructure = formatLayerStructure(data.skeleton.layers);
    parts.push('\n## Layer Structure');
    parts.push(layerStructure);
  }

  // Constraints
  let constraintsStr = '';
  if (data.skeleton?.constraints) {
    constraintsStr = formatConstraints(data.skeleton.constraints);
    parts.push('\n## Movement Constraints');
    parts.push(constraintsStr);
  }

  // Styles
  let stylesStr = '';
  if (data.styles && data.styles.length > 0) {
    stylesStr = formatStyles(data.styles);
    parts.push('\n## Visual Styles');
    parts.push(stylesStr);
  }

  // Animation presets
  let presetsStr = '';
  if (data.presets && data.presets.length > 0) {
    presetsStr = formatPresets(data.presets);
    parts.push('\n## Animation Presets');
    parts.push(presetsStr);
  }

  const full = parts.join('\n');

  return {
    summary,
    layerStructure,
    constraints: constraintsStr,
    styles: stylesStr,
    presets: presetsStr,
    full,
    tokenEstimate: estimateTokens(full),
  };
}

/**
 * Format layer structure for AI context
 */
function formatLayerStructure(layers: Skeleton['layers']): string {
  const lines: string[] = [];

  // Build parent-child relationships
  const layerMap = new Map(layers.map(l => [l.index, l]));
  const rootLayers = layers.filter(l => !l.parentIndex);

  function formatLayer(layer: typeof layers[0], indent = 0): void {
    const prefix = '  '.repeat(indent);
    const pos = layer.physicalParameters.position;
    const rot = layer.physicalParameters.rotation;

    lines.push(
      `${prefix}- ${layer.name} (${layer.type}, index: ${layer.index})`
    );
    lines.push(
      `${prefix}  Position: [${pos?.[0]?.toFixed(1) || 0}, ${pos?.[1]?.toFixed(1) || 0}]`
    );
    lines.push(
      `${prefix}  Rotation: ${typeof rot === 'number' ? rot.toFixed(1) : '0'}°`
    );

    // Find children
    const children = layers.filter(l => l.parentIndex === layer.index);
    for (const child of children) {
      formatLayer(child, indent + 1);
    }
  }

  for (const layer of rootLayers) {
    formatLayer(layer);
  }

  return lines.join('\n');
}

/**
 * Format constraints for AI context
 */
function formatConstraints(constraints: Record<string, ConstraintData>): string {
  const lines: string[] = [];

  for (const [partName, constraint] of Object.entries(constraints)) {
    const limits = constraint.movementLimits;
    const easing = constraint.recommendedEasing;

    lines.push(`- ${partName}:`);
    if (limits) {
      lines.push(`  Rotation range: ${limits.minAngle}° to ${limits.maxAngle}° (${limits.axis}-axis)`);
    }
    if (easing) {
      lines.push(`  Recommended easing: ${easing.type}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format styles for AI context
 */
function formatStyles(styles: Style[]): string {
  return styles.map(style => {
    const colors = style.properties
      ?.filter(p => p.type === 'color')
      .map(p => `${p.name}: ${p.value}`)
      .join(', ');

    return `- ${style.name}: ${colors || 'No colors defined'}`;
  }).join('\n');
}

/**
 * Format animation presets for AI context
 */
function formatPresets(presets: AnimationPreset[]): string {
  return presets.map(preset => {
    const keyframeCount = preset.keyframes?.length || 0;
    return `- ${preset.name} (${preset.category}): ${preset.duration} frames, ${keyframeCount} keyframes${preset.loop ? ', loops' : ''}`;
  }).join('\n');
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English/mixed content
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token limit
 */
export function truncateContext(context: FormattedContext, maxTokens: number): string {
  if (context.tokenEstimate <= maxTokens) {
    return context.full;
  }

  // Priority: summary > constraints > layer structure > presets > styles
  const parts: string[] = [];
  let currentTokens = 0;

  const addPart = (label: string, content: string): boolean => {
    const partTokens = estimateTokens(content);
    if (currentTokens + partTokens > maxTokens) {
      return false;
    }
    parts.push(`## ${label}`);
    parts.push(content);
    currentTokens += partTokens;
    return true;
  };

  addPart('Character Summary', context.summary);

  if (context.constraints) {
    addPart('Movement Constraints', context.constraints);
  }

  if (context.layerStructure) {
    addPart('Layer Structure', context.layerStructure);
  }

  if (context.presets) {
    addPart('Animation Presets', context.presets);
  }

  if (context.styles) {
    addPart('Visual Styles', context.styles);
  }

  return parts.join('\n');
}
