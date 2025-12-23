-- Run this in your Supabase SQL Editor to fix the "Empty or invalid json" error on campaign insert.
-- This updates the RLS policy to properly support INSERT operations.

-- Drop existing policy and recreate with proper WITH CHECK clause
DROP POLICY IF EXISTS "Agency owners manage campaigns" ON campaigns;

-- Recreate with both USING (for SELECT/UPDATE/DELETE) and WITH CHECK (for INSERT/UPDATE)
CREATE POLICY "Agency owners manage campaigns" ON campaigns
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM clients 
        JOIN agencies ON clients.agency_id = agencies.id 
        WHERE clients.id = campaigns.client_id AND agencies.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM clients 
        JOIN agencies ON clients.agency_id = agencies.id 
        WHERE clients.id = campaigns.client_id AND agencies.owner_id = auth.uid()
    )
);
