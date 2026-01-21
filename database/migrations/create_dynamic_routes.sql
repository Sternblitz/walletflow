-- Migration: Create dynamic_routes table for permanent QR codes
-- This allows printed QR codes to remain valid while changing their redirect target

CREATE TABLE IF NOT EXISTS dynamic_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL UNIQUE,  -- e.g. "ABC12345"
    target_slug TEXT NOT NULL,        -- e.g. "burgerhaus-nnlu29"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by code (most common operation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dynamic_routes_code ON dynamic_routes(code);

-- Index for finding routes by client
CREATE INDEX IF NOT EXISTS idx_dynamic_routes_client ON dynamic_routes(client_id);

-- Enable RLS
ALTER TABLE dynamic_routes ENABLE ROW LEVEL SECURITY;

-- Public read policy (needed for redirect to work)
DROP POLICY IF EXISTS "Public read for redirect" ON dynamic_routes;
CREATE POLICY "Public read for redirect" ON dynamic_routes 
    FOR SELECT USING (true);

-- Agency management policy
DROP POLICY IF EXISTS "Agency can manage own routes" ON dynamic_routes;
CREATE POLICY "Agency can manage own routes" ON dynamic_routes 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN agencies a ON c.agency_id = a.id
            WHERE c.id = dynamic_routes.client_id
            AND a.owner_id = auth.uid()
        )
    );

-- Insert policy for service role / agency
DROP POLICY IF EXISTS "Agency can insert routes" ON dynamic_routes;
CREATE POLICY "Agency can insert routes" ON dynamic_routes 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients c
            JOIN agencies a ON c.agency_id = a.id
            WHERE c.id = client_id
            AND a.owner_id = auth.uid()
        )
    );
