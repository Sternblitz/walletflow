-- Allow 'push' as a valid gift_type
-- Created after 'push' gift type caused constraint violations
ALTER TABLE pass_gifts DROP CONSTRAINT IF EXISTS pass_gifts_gift_type_check;

ALTER TABLE pass_gifts ADD CONSTRAINT pass_gifts_gift_type_check 
    CHECK (gift_type IN ('birthday', 'welcome', 'loyalty', 'custom', 'push'));
