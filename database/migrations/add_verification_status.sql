-- Add verification_status to passes table
-- Status: 'pending' (just clicked link), 'verified' (actually used/registered)

ALTER TABLE passes 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Update existing passes: 
-- Apple passes with device registration = verified
-- Passes with stamps > 1 = verified (were actually used)
UPDATE passes 
SET verification_status = 'verified' 
WHERE is_installed_on_ios = true 
   OR is_installed_on_android = true 
   OR (current_state->>'stamps')::int > 1;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_passes_verification_status ON passes(verification_status);

-- Comment on column
COMMENT ON COLUMN passes.verification_status IS 'pending = link clicked but not verified, verified = actually added to wallet and/or used';
