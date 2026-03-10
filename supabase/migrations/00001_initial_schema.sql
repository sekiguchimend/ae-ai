-- ============================================
-- AE AI Extension - Initial Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Characters Table (キャラクター基本情報)
-- ============================================
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_created_at ON characters(created_at DESC);

-- ============================================
-- Skeletons Table (骨格データ - F-2)
-- ============================================
CREATE TABLE IF NOT EXISTS skeletons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Skeleton',
    layers JSONB NOT NULL DEFAULT '[]',
    constraints JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for character lookup
CREATE INDEX idx_skeletons_character_id ON skeletons(character_id);

-- ============================================
-- Styles Table (外見/スタイルデータ - F-2)
-- ============================================
CREATE TABLE IF NOT EXISTS styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Style',
    properties JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for character lookup
CREATE INDEX idx_styles_character_id ON styles(character_id);

-- ============================================
-- Animation Presets Table (アニメーションプリセット - F-2)
-- ============================================
CREATE TYPE animation_category AS ENUM (
    'walk', 'run', 'jump', 'greeting', 'idle', 'gesture', 'custom'
);

CREATE TABLE IF NOT EXISTS animation_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category animation_category NOT NULL DEFAULT 'custom',
    duration INTEGER NOT NULL DEFAULT 30, -- in frames
    frame_rate NUMERIC(5,2) NOT NULL DEFAULT 30.0,
    parts JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for character lookup and category filter
CREATE INDEX idx_animation_presets_character_id ON animation_presets(character_id);
CREATE INDEX idx_animation_presets_category ON animation_presets(category);

-- ============================================
-- Character Versions Table (バージョン管理 - F-2)
-- ============================================
CREATE TYPE versioned_entity_type AS ENUM (
    'skeleton', 'style', 'animation_preset'
);

CREATE TABLE IF NOT EXISTS character_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    entity_type versioned_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    snapshot JSONB NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(character_id, entity_type, entity_id, version_number)
);

-- Index for version queries
CREATE INDEX idx_character_versions_lookup ON character_versions(character_id, entity_type, entity_id);
CREATE INDEX idx_character_versions_created_at ON character_versions(created_at DESC);

-- ============================================
-- Tags Table (メタデータタグ - F-2)
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#808080', -- Hex color
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- Index for user tags
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- ============================================
-- Character Tags Table (多対多リレーション)
-- ============================================
CREATE TABLE IF NOT EXISTS character_tags (
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (character_id, tag_id)
);

-- Index for tag queries
CREATE INDEX idx_character_tags_tag_id ON character_tags(tag_id);

-- ============================================
-- Pending Sync Items Table (オフライン同期 - 非機能要件)
-- ============================================
CREATE TYPE sync_operation AS ENUM ('create', 'update', 'delete');

CREATE TABLE IF NOT EXISTS pending_sync_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation sync_operation NOT NULL,
    data JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user sync items
CREATE INDEX idx_pending_sync_user_id ON pending_sync_items(user_id);

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skeletons_updated_at
    BEFORE UPDATE ON skeletons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_styles_updated_at
    BEFORE UPDATE ON styles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animation_presets_updated_at
    BEFORE UPDATE ON animation_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
