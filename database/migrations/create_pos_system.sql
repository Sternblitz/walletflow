-- POS Credentials: Chef and Staff PIN codes
-- Run this in Supabase SQL Editor

-- POS Zugänge für Gastronomen
CREATE TABLE IF NOT EXISTS pos_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  pin_code VARCHAR(10) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('chef', 'staff')),
  label VARCHAR(100), -- "Kellner Tom", "Chef Hans"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Index for fast PIN lookup
CREATE INDEX IF NOT EXISTS idx_pos_credentials_campaign_pin 
  ON pos_credentials(campaign_id, pin_code);

-- Stempel-Events für Statistiken
CREATE TABLE IF NOT EXISTS stamp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID REFERENCES passes(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('stamp', 'redeem', 'reset', 'bonus')),
  stamps_before INTEGER DEFAULT 0,
  stamps_after INTEGER DEFAULT 0,
  pos_credential_id UUID REFERENCES pos_credentials(id),
  note VARCHAR(255), -- "Doppelstempel Aktion"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for statistics queries
CREATE INDEX IF NOT EXISTS idx_stamp_events_campaign_date 
  ON stamp_events(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stamp_events_pass 
  ON stamp_events(pass_id);

-- Add wallet_type to passes table if not exists
-- This tracks Apple vs Google wallet
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passes' AND column_name = 'wallet_type'
  ) THEN
    ALTER TABLE passes ADD COLUMN wallet_type VARCHAR(20) DEFAULT 'apple';
  END IF;
END $$;

-- RLS Policies
ALTER TABLE pos_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_events ENABLE ROW LEVEL SECURITY;

-- Allow public read for pos_credentials (needed for PIN login)
CREATE POLICY "Allow public read pos_credentials" ON pos_credentials
  FOR SELECT USING (true);

-- Allow public insert/update for stamp_events (from POS system)
CREATE POLICY "Allow public insert stamp_events" ON stamp_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read stamp_events" ON stamp_events
  FOR SELECT USING (true);

-- Create default POS credentials when campaign is created
-- Chef PIN: 9999, Staff PIN: 1234 (can be changed later)
CREATE OR REPLACE FUNCTION create_default_pos_credentials()
RETURNS TRIGGER AS $$
BEGIN
  -- Chef credential
  INSERT INTO pos_credentials (campaign_id, pin_code, role, label)
  VALUES (NEW.id, '9999', 'chef', 'Chef');
  
  -- Staff credential
  INSERT INTO pos_credentials (campaign_id, pin_code, role, label)
  VALUES (NEW.id, '1234', 'staff', 'Kellner 1');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create POS credentials
DROP TRIGGER IF EXISTS trigger_create_pos_credentials ON campaigns;
CREATE TRIGGER trigger_create_pos_credentials
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pos_credentials();
