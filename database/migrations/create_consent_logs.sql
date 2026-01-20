-- Migration: Create consent_logs table
-- Purpose: GDPR-compliant consent documentation for wallet pass downloads

CREATE TABLE IF NOT EXISTS consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Consent Flags
    consent_privacy_terms BOOLEAN NOT NULL DEFAULT false,
    consent_benefits_marketing BOOLEAN NOT NULL DEFAULT false,
    
    -- Context
    wallet_platform TEXT CHECK (wallet_platform IN ('apple', 'google')),
    session_token TEXT,
    
    -- Metadata
    user_agent TEXT,
    ip_address TEXT,
    consent_version TEXT DEFAULT '1.0',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consent_logs_campaign_id ON consent_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_client_id ON consent_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at);

-- RLS Policies
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert from API (service role)
CREATE POLICY "Service role can insert consent logs"
    ON consent_logs FOR INSERT
    WITH CHECK (true);

-- Allow select for admins/authenticated users
CREATE POLICY "Authenticated users can view consent logs"
    ON consent_logs FOR SELECT
    USING (auth.role() = 'authenticated');
