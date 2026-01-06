-- Add installation flags to passes table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passes' AND column_name = 'is_installed_on_ios'
  ) THEN
    ALTER TABLE passes ADD COLUMN is_installed_on_ios BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passes' AND column_name = 'is_installed_on_android'
  ) THEN
    ALTER TABLE passes ADD COLUMN is_installed_on_android BOOLEAN DEFAULT false;
  END IF;

    IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passes' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE passes ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
  END IF;

    IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passes' AND column_name = 'serial_number'
  ) THEN
    ALTER TABLE passes ADD COLUMN serial_number VARCHAR(100);
  END IF;
END $$;
