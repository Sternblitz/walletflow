-- Device registrations for Apple Pass updates
-- This table stores the relationship between devices and passes

CREATE TABLE IF NOT EXISTS device_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_library_identifier TEXT NOT NULL,
    pass_type_identifier TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    push_token TEXT,
    pass_id UUID REFERENCES passes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Unique constraint: one registration per device+pass combo
    UNIQUE(device_library_identifier, serial_number)
);

-- Enable RLS
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public access (iOS devices don't authenticate with Supabase)
CREATE POLICY "Public can manage device registrations" ON device_registrations
FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_registrations_device ON device_registrations(device_library_identifier);
CREATE INDEX IF NOT EXISTS idx_device_registrations_serial ON device_registrations(serial_number);
