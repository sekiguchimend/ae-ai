-- ============================================
-- AE AI Extension - Row Level Security Policies
-- (非機能要件: Supabase RLS)
-- ============================================

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE skeletons ENABLE ROW LEVEL SECURITY;
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE animation_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_sync_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Characters Policies
-- ============================================

-- SELECT: Users can only read their own characters
CREATE POLICY "Users can view own characters"
    ON characters FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Users can only create characters for themselves
CREATE POLICY "Users can create own characters"
    ON characters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own characters
CREATE POLICY "Users can update own characters"
    ON characters FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own characters
CREATE POLICY "Users can delete own characters"
    ON characters FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Skeletons Policies
-- ============================================

-- SELECT: Users can view skeletons of their own characters
CREATE POLICY "Users can view own skeletons"
    ON skeletons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = skeletons.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- INSERT: Users can create skeletons for their own characters
CREATE POLICY "Users can create own skeletons"
    ON skeletons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = skeletons.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- UPDATE: Users can update skeletons of their own characters
CREATE POLICY "Users can update own skeletons"
    ON skeletons FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = skeletons.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- DELETE: Users can delete skeletons of their own characters
CREATE POLICY "Users can delete own skeletons"
    ON skeletons FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = skeletons.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- ============================================
-- Styles Policies
-- ============================================

CREATE POLICY "Users can view own styles"
    ON styles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = styles.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own styles"
    ON styles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = styles.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own styles"
    ON styles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = styles.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own styles"
    ON styles FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = styles.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- ============================================
-- Animation Presets Policies
-- ============================================

CREATE POLICY "Users can view own animation_presets"
    ON animation_presets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = animation_presets.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own animation_presets"
    ON animation_presets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = animation_presets.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own animation_presets"
    ON animation_presets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = animation_presets.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own animation_presets"
    ON animation_presets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = animation_presets.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- ============================================
-- Character Versions Policies
-- ============================================

CREATE POLICY "Users can view own character_versions"
    ON character_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = character_versions.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own character_versions"
    ON character_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = character_versions.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- Versions are immutable - no UPDATE policy
-- DELETE is allowed for cleanup
CREATE POLICY "Users can delete own character_versions"
    ON character_versions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = character_versions.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- ============================================
-- Tags Policies
-- ============================================

CREATE POLICY "Users can view own tags"
    ON tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
    ON tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
    ON tags FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
    ON tags FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Character Tags Policies
-- ============================================

CREATE POLICY "Users can view own character_tags"
    ON character_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = character_tags.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own character_tags"
    ON character_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = character_tags.character_id
            AND characters.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own character_tags"
    ON character_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM characters
            WHERE characters.id = character_tags.character_id
            AND characters.user_id = auth.uid()
        )
    );

-- ============================================
-- Pending Sync Items Policies
-- ============================================

CREATE POLICY "Users can view own pending_sync_items"
    ON pending_sync_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pending_sync_items"
    ON pending_sync_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending_sync_items"
    ON pending_sync_items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending_sync_items"
    ON pending_sync_items FOR DELETE
    USING (auth.uid() = user_id);
