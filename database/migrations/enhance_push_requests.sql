-- Push Requests Table Enhancement
-- Adds support for message editing and queue management

-- Add new columns for editing
ALTER TABLE push_requests 
ADD COLUMN IF NOT EXISTS edited_message TEXT,
ADD COLUMN IF NOT EXISTS edited_by UUID,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Add processing columns for queue management
ALTER TABLE push_requests
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Update status check to include new statuses
ALTER TABLE push_requests 
DROP CONSTRAINT IF EXISTS push_requests_status_check;

ALTER TABLE push_requests 
ADD CONSTRAINT push_requests_status_check 
CHECK (status IN ('pending', 'approved', 'scheduled', 'processing', 'rejected', 'sent', 'failed'));

-- Index for scheduled pushes (cron job queries)
CREATE INDEX IF NOT EXISTS idx_push_requests_scheduled 
ON push_requests(status, scheduled_at) 
WHERE status = 'scheduled';

-- Index for processing timeout detection
CREATE INDEX IF NOT EXISTS idx_push_requests_processing 
ON push_requests(status, processing_started_at) 
WHERE status = 'processing';

COMMENT ON COLUMN push_requests.edited_message IS 'Admin-edited message (original preserved in message column)';
COMMENT ON COLUMN push_requests.processing_started_at IS 'Timestamp when push processing started (for timeout detection)';
COMMENT ON COLUMN push_requests.retry_count IS 'Number of retry attempts for failed pushes';
