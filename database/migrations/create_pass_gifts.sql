-- Pass Gifts System
-- Stores gifts (birthday, loyalty, etc.) for passes
-- Run this in Supabase SQL Editor

-- ============================================
-- PASS GIFTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pass_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID REFERENCES passes(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    
    -- Gift details
    gift_type VARCHAR(30) DEFAULT 'birthday' CHECK (gift_type IN ('birthday', 'welcome', 'loyalty', 'custom')),
    gift_title TEXT NOT NULL,           -- z.B. "Gratis Kaffee"
    gift_description TEXT,              -- Detaillierte Beschreibung
    gift_message TEXT,                  -- Personalisierte Nachricht (was dem Kunden gesendet wurde)
    
    -- Birthday specific
    birthday_date DATE,                 -- Das aktuelle Geburtsdatum (für Anzeige)
    
    -- Redemption tracking
    redeemed_at TIMESTAMPTZ,            -- NULL = noch nicht eingelöst
    redeemed_by TEXT,                   -- Mitarbeiter-Label der eingelöst hat
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ              -- Optional: Ablaufdatum
);

-- ============================================
-- INDEXES
-- ============================================

-- Fast lookup by pass for unredeemed gifts
CREATE INDEX IF NOT EXISTS idx_pass_gifts_pass_unredeemed 
    ON pass_gifts(pass_id) WHERE redeemed_at IS NULL;

-- Fast lookup by campaign
CREATE INDEX IF NOT EXISTS idx_pass_gifts_campaign 
    ON pass_gifts(campaign_id);

-- Lookup by gift type
CREATE INDEX IF NOT EXISTS idx_pass_gifts_type 
    ON pass_gifts(gift_type, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE pass_gifts ENABLE ROW LEVEL SECURITY;

-- Allow public access (POS system and cron job access)
CREATE POLICY "Allow public access pass_gifts" ON pass_gifts
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE pass_gifts IS 'Stores gifts granted to passes (birthday, loyalty rewards, etc.)';
COMMENT ON COLUMN pass_gifts.gift_type IS 'Type of gift: birthday, welcome, loyalty, or custom';
COMMENT ON COLUMN pass_gifts.gift_title IS 'Title of the gift shown to staff (e.g., Gratis Kaffee)';
COMMENT ON COLUMN pass_gifts.gift_message IS 'Message sent to customer via push notification';
COMMENT ON COLUMN pass_gifts.birthday_date IS 'The birthday date this gift was granted for (for display)';
COMMENT ON COLUMN pass_gifts.redeemed_at IS 'Timestamp when gift was redeemed, NULL if pending';
COMMENT ON COLUMN pass_gifts.expires_at IS 'Optional expiration date for the gift';
