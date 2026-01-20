-- Final Security Step: Clear plain text PINs
-- Only run this after confirming login works with hashes!

UPDATE clients 
SET admin_pin = NULL, 
    staff_pin = NULL;

-- Optional: Drop the columns entirely (cleaner)
-- ALTER TABLE clients DROP COLUMN admin_pin;
-- ALTER TABLE clients DROP COLUMN staff_pin;
