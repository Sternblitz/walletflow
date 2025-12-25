-- Push Requests Table for Managed Push System
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS push_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    
    -- The message content
    message TEXT NOT NULL,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,  -- When to send (null = ASAP after approval)
    
    -- Status workflow: pending -> approved/rejected -> sent
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'sent', 'failed')),
    
    -- Agency approval tracking
    approved_by UUID,  -- User ID of agency member who approved
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Sending stats
    sent_at TIMESTAMPTZ,
    recipients_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick filtering by status
CREATE INDEX IF NOT EXISTS idx_push_requests_status 
    ON push_requests(status, created_at DESC);

-- Index for campaign lookup
CREATE INDEX IF NOT EXISTS idx_push_requests_campaign 
    ON push_requests(campaign_id, created_at DESC);

-- RLS Policies
ALTER TABLE push_requests ENABLE ROW LEVEL SECURITY;

-- Allow public insert (from POS system)
CREATE POLICY "Allow public insert push_requests" ON push_requests
    FOR INSERT WITH CHECK (true);

-- Allow public read (for status checking)
CREATE POLICY "Allow public read push_requests" ON push_requests
    FOR SELECT USING (true);

-- Allow update for status changes (agency approval)
CREATE POLICY "Allow update push_requests" ON push_requests
    FOR UPDATE USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_push_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_push_requests_timestamp ON push_requests;
CREATE TRIGGER trigger_update_push_requests_timestamp
    BEFORE UPDATE ON push_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_push_requests_timestamp();
