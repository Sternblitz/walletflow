-- NFC Chips Table for NFC-based stamp collection
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS nfc_chips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    
    -- Unique chip identifier (encoded in NFC tag URL)
    chip_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Location label for identification
    location_label VARCHAR(100),  -- e.g., "Tisch 5", "Theke", "Eingang"
    
    -- Stats
    scans_count INTEGER DEFAULT 0,
    last_scan_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast chip lookup
CREATE INDEX IF NOT EXISTS idx_nfc_chips_code 
    ON nfc_chips(chip_code);

-- Index for campaign chips
CREATE INDEX IF NOT EXISTS idx_nfc_chips_campaign 
    ON nfc_chips(campaign_id);

-- RLS Policies
ALTER TABLE nfc_chips ENABLE ROW LEVEL SECURITY;

-- Allow public read (for chip lookup)
CREATE POLICY "Allow public read nfc_chips" ON nfc_chips
    FOR SELECT USING (true);

-- Allow update for scan count
CREATE POLICY "Allow public update nfc_chips" ON nfc_chips
    FOR UPDATE USING (true);

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_nfc_scan(chip_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE nfc_chips 
    SET 
        scans_count = scans_count + 1,
        last_scan_at = NOW()
    WHERE id = chip_id;
END;
$$ LANGUAGE plpgsql;
