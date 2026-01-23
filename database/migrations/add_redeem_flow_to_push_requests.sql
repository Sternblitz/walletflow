-- Add Redeem Flow columns to push_requests
-- Run this in Supabase SQL Editor

-- ============================================
-- ADD REDEEM FLOW COLUMNS
-- ============================================

-- Enable redeem flow for this push request
ALTER TABLE push_requests ADD COLUMN IF NOT EXISTS 
    redeem_flow_enabled BOOLEAN DEFAULT false;

-- How many hours the redeem offer is valid (NULL = unlimited)
ALTER TABLE push_requests ADD COLUMN IF NOT EXISTS 
    redeem_expires_hours INTEGER;

-- Custom title for the redeem offer (optional)
ALTER TABLE push_requests ADD COLUMN IF NOT EXISTS 
    redeem_title TEXT;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN push_requests.redeem_flow_enabled IS 'If true, creates redeemable offers for all recipients';
COMMENT ON COLUMN push_requests.redeem_expires_hours IS 'Hours until the redeem offer expires (NULL = unlimited)';
COMMENT ON COLUMN push_requests.redeem_title IS 'Optional custom title for the redeem offer';
