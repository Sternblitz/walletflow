-- Add PIN codes to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS admin_pin TEXT DEFAULT '1234',
ADD COLUMN IF NOT EXISTS staff_pin TEXT DEFAULT '0000';

-- Comment on columns
COMMENT ON COLUMN clients.admin_pin IS 'PIN for dashboard access (full control)';
COMMENT ON COLUMN clients.staff_pin IS 'PIN for POS scanner access only';
