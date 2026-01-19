
-- Create scans table if it doesn't exist (for activity tracking)
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pass_id UUID REFERENCES public.passes(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- ADD_STAMP, STAMP_COMPLETE, REDEEM_REWARD, etc.
    delta_value INTEGER DEFAULT 0,
    device_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster timeline lookups
CREATE INDEX IF NOT EXISTS idx_scans_pass_id ON public.scans(pass_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at);

-- Create push_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.push_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pass_id UUID REFERENCES public.passes(id) ON DELETE CASCADE,
    push_request_id UUID REFERENCES public.push_requests(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- sent, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster timeline lookups
CREATE INDEX IF NOT EXISTS idx_push_logs_pass_id ON public.push_logs(pass_id);

-- Enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_logs ENABLE ROW LEVEL SECURITY;

-- Policies for scans
-- Public/POS can insert scans
CREATE POLICY "Public can insert scans" ON public.scans
    FOR INSERT WITH CHECK (true);

-- Admins/POS can view scans for their campaigns
CREATE POLICY "View scans for own campaigns" ON public.scans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = scans.campaign_id
            -- AND (auth logic if needed, simplified for now)
        )
    );

-- Policies for push_logs
CREATE POLICY "Public can view own push logs" ON public.push_logs
    FOR SELECT USING (true); -- Simplified access for demo
