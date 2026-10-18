-- ============================================================
-- Migration: 20261015010000_add_location_type
-- 1. Location: add "type" column with default 'BATCHING_PLANT'
-- 2. Safe idempotent indexing and existing data classification
-- ============================================================

-- ─── 1. AlterTable ─────────────────────────────────────────────
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'BATCHING_PLANT';

-- ─── 2. CreateIndex ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Location_type_idx" ON "Location"("type");

-- ─── 3. Classify Existing Data ─────────────────────────────────
-- Set Head Office type
UPDATE "Location" 
SET "type" = 'HEAD_OFFICE' 
WHERE LOWER("name") LIKE '%head office%' OR LOWER("name") LIKE '%kantor pusat%';

-- Set Stone Crusher type if any existing branch name matches
UPDATE "Location" 
SET "type" = 'STONE_CRUSHER' 
WHERE LOWER("name") LIKE '%crusher%' OR LOWER("name") LIKE '%quarry%';
