-- Add personalization fields to passes table
-- Run this in Supabase SQL Editor

-- Customer name for personalized passes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'passes' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE passes ADD COLUMN customer_name VARCHAR(100);
    END IF;
END $$;

-- Customer birthday for birthday promotions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'passes' AND column_name = 'customer_birthday'
    ) THEN
        ALTER TABLE passes ADD COLUMN customer_birthday DATE;
    END IF;
END $$;

-- Customer email for marketing (optional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'passes' AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE passes ADD COLUMN customer_email VARCHAR(255);
    END IF;
END $$;

-- Wallet type (apple/google) if not already added by create_pos_system.sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'passes' AND column_name = 'wallet_type'
    ) THEN
        ALTER TABLE passes ADD COLUMN wallet_type VARCHAR(20) DEFAULT 'apple';
    END IF;
END $$;

-- Create index for birthday queries (for birthday promotions)
CREATE INDEX IF NOT EXISTS idx_passes_birthday 
    ON passes(customer_birthday);

-- Create index for wallet type stats
CREATE INDEX IF NOT EXISTS idx_passes_wallet_type 
    ON passes(campaign_id, wallet_type);
