-- Allow public INSERT into passes table (anonymous users downloading passes)
CREATE POLICY "Public can create passes" ON passes
FOR INSERT WITH CHECK (true);

-- Allow public SELECT for passes (needed for scanning/updates)
CREATE POLICY "Public can read passes" ON passes
FOR SELECT USING (true);

-- Allow public UPDATE for passes (needed for stamp updates)
CREATE POLICY "Public can update passes" ON passes
FOR UPDATE USING (true);

-- Allow public INSERT into scans table (staff scanning passes)
CREATE POLICY "Public can create scans" ON scans
FOR INSERT WITH CHECK (true);

-- Allow public SELECT for scans (for statistics)
CREATE POLICY "Public can read scans" ON scans
FOR SELECT USING (true);
