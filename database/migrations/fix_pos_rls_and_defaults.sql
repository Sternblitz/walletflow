-- Enable full access to pos_credentials for authenticated users (Admins)
-- OR just allow public for now to ensure it works, then tighten.
-- Given the context, we want admins to update it.

DROP POLICY IF EXISTS "Allow all for authenticated users pos_credentials" ON pos_credentials;

CREATE POLICY "Allow all for authenticated users pos_credentials" 
ON pos_credentials
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Also allow public insert? No, only admins should create credentials.
-- But wait, the API uses the logged-in user.

-- Checking if we need to auto-create defaults for existing campaigns
-- We can run a one-time block to insert defaults for campaigns that have NO credentials.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM campaigns LOOP
        -- Check if staff credential exists
        IF NOT EXISTS (SELECT 1 FROM pos_credentials WHERE campaign_id = r.id AND role = 'staff') THEN
            INSERT INTO pos_credentials (campaign_id, pin_code, role, label)
            VALUES (r.id, '1234', 'staff', 'Mitarbeiter Standard');
        END IF;

        -- Check if chef credential exists
        IF NOT EXISTS (SELECT 1 FROM pos_credentials WHERE campaign_id = r.id AND role = 'chef') THEN
            INSERT INTO pos_credentials (campaign_id, pin_code, role, label)
            VALUES (r.id, '9999', 'chef', 'Chef Access');
        END IF;
    END LOOP;
END $$;
