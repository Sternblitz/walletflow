-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. AGENCIES (That's YOU)
-- Linking Supabase Auth Users to their Agency Profile
create table agencies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users not null unique,
  name text not null, -- e.g. "Passify Agency"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CLIENTS (Your B2B Customers)
-- e.g. "Burger King Berlin", "Nano Coffee"
create table clients (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references agencies(id) on delete cascade not null,
  name text not null,
  slug text not null unique, -- for smart links: passify.io/slug
  logo_url text,
  primary_color text default '#000000',
  
  -- The "Chef-PIN" for the Dashboard
  access_pin_hash text, 
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CAMPAIGNS (The Logic)
-- A client can have multiple campaigns (e.g. "Coffee Card" AND "VIP Club")
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  name text not null, -- Internal name e.g. "Summer 2025"
  
  concept text not null check (concept in ('STAMP_CARD', 'STAMP_CARD_V2', 'MEMBER_CARD', 'POINTS_CARD', 'COUPON', 'CUSTOM', 'VIP_CLUB')),
  
  -- STAMP_CARD Config: { "max_stamps": 10, "reward": "Free Coffee" }
  -- VIP_CLUB Config: { "tiers": ["Gold", "Silver"] }
  config jsonb default '{}'::jsonb,
  
  -- Nano Banana Design Assets
  design_assets jsonb default '{}'::jsonb, -- { "hero_image": "...", "background_color": "..." }
  
  -- Apple/Google Tech IDs
  apple_pass_type_id text,
  google_class_id text,
  
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PASSES (The End-User Instances)
create table passes (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  
  -- Anonymous User Tracking
  user_alias_id text not null, -- Random ID generated on first scan
  
  serial_number text not null unique,
  auth_token text not null, -- For Apple/Google updates
  
  -- Dynamic State (Points, Tier, etc)
  current_state jsonb default '{}'::jsonb, 
  
  is_installed_on_ios boolean default false,
  is_installed_on_android boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SCANS (The "Waiter" Action)
create table scans (
  id uuid primary key default uuid_generate_v4(),
  pass_id uuid references passes(id) on delete cascade not null,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Result of the scan
  action_type text not null, -- 'ADD_POINT', 'REDEEM_REWARD', 'CHECK_IN'
  delta_value integer default 0, -- e.g. +1
  
  device_agent text -- User Agent of the scanner (Web App)
);

-- RLS POLICIES (Security)
alter table agencies enable row level security;
alter table clients enable row level security;
alter table campaigns enable row level security;
alter table passes enable row level security;
alter table scans enable row level security;

-- Agency Owners see their own data
create policy "Agency owners view own data" on agencies
  for select using (auth.uid() = owner_id);

create policy "Agency owners manage clients" on clients
  for all using (
    exists (select 1 from agencies where id = clients.agency_id and owner_id = auth.uid())
  );

create policy "Agency owners manage campaigns" on campaigns
  for all using (
    exists (
      select 1 from clients 
      join agencies on clients.agency_id = agencies.id 
      where clients.id = campaigns.client_id and agencies.owner_id = auth.uid()
    )
  );
