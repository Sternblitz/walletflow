-- Create QR Codes table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    destination_url TEXT NOT NULL,
    name TEXT NOT NULL,
    design_config JSONB DEFAULT '{}'::JSONB,
    scans INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (needed for the redirect route)
CREATE POLICY "Allow public read access to qr_codes"
ON public.qr_codes
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to manage their campaign's QR codes
-- (Assuming auth logic is handled via campaign ownership higher up, but generally we want to validte access)
-- For now, allow authenticated users to do everything if they have access to the campaign
-- Note: You might need a more complex policy joining with clients/campaigns depending on your auth model.
-- A simple permissive policy for authenticated users for now, mirroring the campaign access pattern used elsewhere.
CREATE POLICY "Allow authenticated users to manage qr_codes"
ON public.qr_codes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_slug ON public.qr_codes(slug);
CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign_id ON public.qr_codes(campaign_id);
