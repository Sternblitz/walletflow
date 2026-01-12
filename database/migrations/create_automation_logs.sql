-- Create a table to track automation run attempts (for rate limiting)
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  status text,
  details jsonb
);

-- RLS
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON automation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON automation_logs FOR SELECT USING (true);
