-- Run this in your Supabase SQL Editor to fix the "violates check constraint" error.

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_concept_check;

ALTER TABLE campaigns ADD CONSTRAINT campaigns_concept_check 
  CHECK (concept IN ('STAMP_CARD', 'STAMP_CARD_V2', 'MEMBER_CARD', 'POINTS_CARD', 'COUPON', 'CUSTOM', 'VIP_CLUB'));
