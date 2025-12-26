-- Backfill POS credentials for existing campaigns
-- This is needed because the trigger only handles NEW campaigns

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM campaigns LOOP
    -- Check if Chef credential exists
    IF NOT EXISTS (SELECT 1 FROM pos_credentials WHERE campaign_id = r.id AND role = 'chef') THEN
      INSERT INTO pos_credentials (campaign_id, pin_code, role, label)
      VALUES (r.id, '9999', 'chef', 'Chef');
    END IF;

    -- Check if Staff credential exists
    IF NOT EXISTS (SELECT 1 FROM pos_credentials WHERE campaign_id = r.id AND role = 'staff') THEN
      INSERT INTO pos_credentials (campaign_id, pin_code, role, label)
      VALUES (r.id, '1234', 'staff', 'Kellner 1');
    END IF;
  END LOOP;
END $$;
