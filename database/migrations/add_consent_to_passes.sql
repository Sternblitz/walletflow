-- Migration: Add marketing consent columns to passes table
-- Purpose: Store opt-in status directly on pass for efficient push filtering
-- Date: 2026-01-20

-- ============================================
-- PHASE 1: Add consent columns to passes
-- ============================================

-- Marketing consent flag (true = opted in, false = declined, null = unknown/legacy)
ALTER TABLE passes ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT NULL;

-- Timestamp when consent was given/declined
ALTER TABLE passes ADD COLUMN IF NOT EXISTS consent_marketing_at TIMESTAMPTZ;

-- Source of consent decision (for analytics)
-- Values: 'popup1_yes', 'popup2_yes', 'popup2_no'  
ALTER TABLE passes ADD COLUMN IF NOT EXISTS consent_source TEXT;

-- Version of consent text shown (for GDPR audit)
ALTER TABLE passes ADD COLUMN IF NOT EXISTS consent_text_version TEXT DEFAULT '1.0';

-- Index for efficient filtering in push queries
CREATE INDEX IF NOT EXISTS idx_passes_consent_marketing ON passes(consent_marketing) WHERE consent_marketing = true;

-- ============================================
-- PHASE 2: Extend consent_logs for audit trail
-- ============================================

-- Link to specific pass (optional, for matching)
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS pass_id UUID REFERENCES passes(id) ON DELETE SET NULL;

-- Source step (popup1_yes, popup2_yes, popup2_no)
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS consent_source TEXT;

-- Hash of exact consent text shown (SHA256)
ALTER TABLE consent_logs ADD COLUMN IF NOT EXISTS consent_text_hash TEXT;

-- Index for pass lookups
CREATE INDEX IF NOT EXISTS idx_consent_logs_pass_id ON consent_logs(pass_id);

-- ============================================
-- PHASE 3: Backfill existing passes (all demo = true)
-- ============================================

UPDATE passes 
SET consent_marketing = true,
    consent_marketing_at = created_at,
    consent_source = 'legacy_backfill',
    consent_text_version = '1.0'
WHERE consent_marketing IS NULL;

-- ============================================
-- Verification query
-- ============================================
-- SELECT consent_marketing, count(*) FROM passes GROUP BY consent_marketing;
