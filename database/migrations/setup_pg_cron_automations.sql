-- =============================================
-- SUPABASE pg_cron SETUP FOR AUTOMATIONS
-- =============================================
-- 
-- This migration sets up pg_cron to automatically
-- execute automation rules every 30 minutes.
--
-- Run this in Supabase SQL Editor AFTER deploying
-- the Edge Function.
-- =============================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Step 2: Create the cron job
-- Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- Replace YOUR_SERVICE_ROLE_KEY with your service role key

-- First, remove existing job if it exists (for re-running)
SELECT cron.unschedule('execute-automations-job') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'execute-automations-job'
);

-- Schedule the automation execution every 30 minutes
SELECT cron.schedule(
    'execute-automations-job',  -- Job name
    '*/30 * * * *',              -- Every 30 minutes
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/execute-automations',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- Step 3: Verify the job was created
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job 
WHERE jobname = 'execute-automations-job';

-- =============================================
-- INSTRUCTIONS:
-- =============================================
-- 
-- 1. Go to Supabase Dashboard > Project Settings > API
-- 2. Copy your:
--    - Project URL (e.g., https://abc123.supabase.co)
--    - service_role key (the secret one, NOT anon)
--
-- 3. Replace in the SQL above:
--    - YOUR_PROJECT_REF = your project ID (e.g., abc123)
--    - YOUR_SERVICE_ROLE_KEY = your service role key
--
-- 4. Run this SQL in the SQL Editor
--
-- 5. To check job runs:
--    SELECT * FROM cron.job_run_details 
--    ORDER BY start_time DESC LIMIT 10;
--
-- =============================================
