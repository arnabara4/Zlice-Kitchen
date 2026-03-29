-- 025_create_delivery_man_table.sql
-- Creates table for delivery boys/men details with support for multiple canteens

create table if not exists delivery_man (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  name text not null,
  phone text not null,
  address text,
  vehicle_type text, -- 'bike', 'scooter', 'bicycle', 'car', etc.
  vehicle_number text,
  id_proof_type text, -- 'aadhar', 'pan', 'driving_license', etc.
  id_proof_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_active boolean default true,
  joined_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Junction table for many-to-many relationship between delivery_man and canteens
create table if not exists delivery_man_canteens (
  id uuid primary key default gen_random_uuid(),
  delivery_man_id uuid references delivery_man(id) on delete cascade,
  canteen_id uuid references canteens(id) on delete cascade,
  assigned_date date default current_date,
  created_at timestamptz default now(),
  unique(delivery_man_id, canteen_id)
);

-- Add indexes for better query performance
create index if not exists delivery_man_user_id_idx on delivery_man(user_id);
create index if not exists delivery_man_phone_idx on delivery_man(phone);
create index if not exists delivery_man_is_active_idx on delivery_man(is_active);
create index if not exists delivery_man_canteens_delivery_man_id_idx on delivery_man_canteens(delivery_man_id);
create index if not exists delivery_man_canteens_canteen_id_idx on delivery_man_canteens(canteen_id);
