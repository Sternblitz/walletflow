-- Add phone field to passes table for WhatsApp/SMS marketing
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'passes' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE passes ADD COLUMN customer_phone VARCHAR(50);
    END IF;
END $$;

-- Index for phone-based lookups
CREATE INDEX IF NOT EXISTS idx_passes_phone 
    ON passes(customer_phone) 
    WHERE customer_phone IS NOT NULL;
