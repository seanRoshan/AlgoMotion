-- AlgoMotion initial database schema
-- Migration: 001_initial_schema
-- Spec reference: Section 8.2 (Database Schema)

-- ═══════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL DEFAULT 'Untitled Project',
    description TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT,
    is_public   BOOLEAN NOT NULL DEFAULT false,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL DEFAULT 'Scene 1',
    scene_order INTEGER NOT NULL DEFAULT 0,
    data        JSONB NOT NULL DEFAULT '{}'::jsonb,
    code_source JSONB,
    duration    REAL NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    category       TEXT NOT NULL DEFAULT 'other',
    difficulty     TEXT NOT NULL DEFAULT 'beginner',
    thumbnail_url  TEXT,
    scene_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags           TEXT[] NOT NULL DEFAULT '{}',
    usage_count    INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects (created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);

-- Scenes indexes
CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes (project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_order ON scenes (project_id, scene_order);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates (category);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON templates (usage_count DESC);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS: Auto-update updated_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_scenes_updated_at
    BEFORE UPDATE ON scenes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- ─── Projects policies ─────────────────────────────────

-- Users can read their own projects
CREATE POLICY projects_select_own ON projects
    FOR SELECT USING (auth.uid() = user_id);

-- Public projects are viewable by anyone (authenticated)
CREATE POLICY projects_select_public ON projects
    FOR SELECT USING (is_public = true);

-- Users can insert their own projects
CREATE POLICY projects_insert_own ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY projects_update_own ON projects
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY projects_delete_own ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- ─── Scenes policies (inherit from project ownership) ──

-- Users can read scenes of their own projects or public projects
CREATE POLICY scenes_select ON scenes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scenes.project_id
            AND (projects.user_id = auth.uid() OR projects.is_public = true)
        )
    );

-- Users can insert scenes into their own projects
CREATE POLICY scenes_insert ON scenes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scenes.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can update scenes of their own projects
CREATE POLICY scenes_update ON scenes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scenes.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can delete scenes of their own projects
CREATE POLICY scenes_delete ON scenes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = scenes.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ─── Templates policies ────────────────────────────────

-- All authenticated users can read templates
CREATE POLICY templates_select_all ON templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════

-- Note: Storage buckets and policies should be created via
-- the Supabase Dashboard or CLI, as SQL for storage varies.
-- The following are the bucket specifications:
--
-- 1. project-assets (private)
--    - Purpose: Project thumbnails, user uploads
--    - Policy: Users can upload/read files in their own path (user_id/*)
--
-- 2. exported-media (private)
--    - Purpose: Exported videos, GIFs, PNGs
--    - Policy: Users can upload/read files in their own path (user_id/*)
--
-- 3. template-assets (public)
--    - Purpose: Template thumbnails and previews
--    - Policy: Public read access, admin write only
