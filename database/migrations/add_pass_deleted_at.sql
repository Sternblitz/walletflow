-- Add deleted_at timestamp to passes table
-- This tracks when a pass was removed from Apple Wallet

ALTER TABLE passes 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient querying of deleted passes
CREATE INDEX IF NOT EXISTS idx_passes_deleted_at ON passes(deleted_at) WHERE deleted_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN passes.deleted_at IS 'Timestamp when the pass was removed from the wallet (Apple only - Google does not send deletion signals)';
