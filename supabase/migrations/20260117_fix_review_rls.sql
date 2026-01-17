-- Fix RLS for review tables to allow Anon SELECT (for public dashboards)
ALTER TABLE review_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read review events anon" ON review_funnel_events;
CREATE POLICY "Allow read review events anon" ON review_funnel_events FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow read review feedback anon" ON review_feedback;
CREATE POLICY "Allow read review feedback anon" ON review_feedback FOR SELECT TO anon USING (true);
