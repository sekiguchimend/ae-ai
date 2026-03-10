// ============================================
// AE AI Extension - Type Definitions
// ============================================

// ============================================
// User & Authentication
// ============================================

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Character Types (F-1, F-2)
// ============================================

export interface Character {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Layer & Skeleton Types (F-1: レイヤー構造の解析)
// ============================================

export type LayerType = 'shape' | 'null' | 'footage' | 'text' | 'camera' | 'light' | 'adjustment';

export interface LayerInfo {
  id: number;
  name: string;
  type: LayerType;
  parent_id: number | null;
  index: number;
}

export interface PhysicalParameters {
  position: [number, number] | [number, number, number];
  anchor_point: [number, number] | [number, number, number];
  scale: [number, number] | [number, number, number];
  rotation: number | [number, number, number]; // 2D rotation or 3D [x, y, z]
  opacity: number; // 0-100
}

export interface LayerData extends LayerInfo {
  parameters: PhysicalParameters;
  children: LayerData[];
}

// ============================================
// Constraint Types (F-1: 制約条件の手動設定)
// ============================================

export type RotationAxis = 'x' | 'y' | 'z';

export interface RotationConstraint {
  axis: RotationAxis;
  min_angle: number;
  max_angle: number;
}

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier';

export interface BezierCurve {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EasingConfig {
  type: EasingType;
  bezier?: BezierCurve;
}

export interface PartConstraint {
  part_name: string;
  rotation_constraints: RotationConstraint[];
  recommended_easing: EasingConfig;
}

// ============================================
// Skeleton Types (F-2: 骨格データ)
// ============================================

export interface Skeleton {
  id: string;
  character_id: string;
  name: string;
  layers: LayerData[];
  constraints: PartConstraint[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Style Types (F-2: 外見/スタイルデータ)
// ============================================

export interface ColorValue {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface StyleProperty {
  property_name: string;
  value: string | number | ColorValue;
}

export interface Style {
  id: string;
  character_id: string;
  name: string;
  properties: StyleProperty[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Animation Preset Types (F-2: アニメーションプリセット)
// ============================================

export type AnimationCategory = 'walk' | 'run' | 'jump' | 'greeting' | 'idle' | 'gesture' | 'custom';

export interface KeyframeValue {
  time: number; // in frames or seconds
  value: number | number[];
  easing?: EasingConfig;
}

export interface PropertyAnimation {
  property: keyof PhysicalParameters;
  keyframes: KeyframeValue[];
}

export interface PartAnimation {
  part_name: string;
  animations: PropertyAnimation[];
}

export interface AnimationPreset {
  id: string;
  character_id: string;
  name: string;
  category: AnimationCategory;
  duration: number; // in frames
  frame_rate: number;
  parts: PartAnimation[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Version Control Types (F-2: バージョン管理)
// ============================================

export type VersionedEntityType = 'skeleton' | 'style' | 'animation_preset';

export interface CharacterVersion {
  id: string;
  character_id: string;
  version_number: number;
  entity_type: VersionedEntityType;
  entity_id: string;
  snapshot: Record<string, unknown>;
  created_at: string;
  message?: string;
}

// ============================================
// Tag Types (F-2: 検索・フィルタリング)
// ============================================

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface CharacterTag {
  character_id: string;
  tag_id: string;
}

// ============================================
// AI Orchestration Types (F-3)
// ============================================

export type AIProvider = 'openai' | 'claude';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  provider: AIProvider;
  model: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GeneratedJSX {
  code: string;
  is_valid: boolean;
  validation_errors?: string[];
}

// ============================================
// JSX Execution Types
// ============================================

export interface JSXExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// ============================================
// Sync & Offline Types (非機能要件)
// ============================================

export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

export interface PendingSyncItem {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  created_at: string;
  retry_count: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
