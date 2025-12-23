-- Allow public read access (SELECT) to clients so smart links work (anonymous users need to find client by slug)
CREATE POLICY "Public read access to clients" ON clients
FOR SELECT USING (true);

-- Allow public read access (SELECT) to campaigns so smart links work (anonymous users need to see the active campaign)
CREATE POLICY "Public read access to campaigns" ON campaigns
FOR SELECT USING (true);
