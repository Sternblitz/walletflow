-- =============================================
-- REVIEW GATE SYSTEM - DATABASE MIGRATIONS
-- =============================================
-- Run these in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ckamzerlxpfbxvqmbhkz/sql

-- =============================================
-- 1. Add google_place_id to campaigns
-- =============================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS google_place_id TEXT;
COMMENT ON COLUMN campaigns.google_place_id IS 'Google Places API place_id for review integration';

-- =============================================
-- 2. Create review_feedback table (internal 1-3 star feedback)
-- =============================================
CREATE TABLE IF NOT EXISTS review_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID REFERENCES passes(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 3),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE review_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert from API (anon/authenticated)
CREATE POLICY "Allow insert review feedback" ON review_feedback
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Policy: Allow read for authenticated users (for admin dashboard)
CREATE POLICY "Allow read review feedback" ON review_feedback
    FOR SELECT TO authenticated
    USING (true);

-- =============================================
-- 3. Create review_funnel_events table (Analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS review_funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID REFERENCES passes(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'popup_shown', 'rating_clicked', 'feedback_submitted', 'google_redirect', 'dismissed'
    rating INTEGER, -- 1-5 when rating_clicked
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_review_events_campaign ON review_funnel_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_review_events_time ON review_funnel_events(created_at);
CREATE INDEX IF NOT EXISTS idx_review_events_pass ON review_funnel_events(pass_id);

-- Enable RLS
ALTER TABLE review_funnel_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert from API
CREATE POLICY "Allow insert review events" ON review_funnel_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Policy: Allow read for authenticated users
CREATE POLICY "Allow read review events" ON review_funnel_events
    FOR SELECT TO authenticated
    USING (true);

-- =============================================
-- DONE! You should see:
-- - campaigns.google_place_id column added
-- - review_feedback table created
-- - review_funnel_events table created
-- =============================================
