-- 005_create_khata_tables.sql
-- Creates tables for khata (student billing) system

-- Enable uuid-ossp or pgcrypto depending on DB; Supabase typically provides gen_random_uuid()

create table if not exists khata_students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roll_number text not null unique,
  created_at timestamptz default now()
);

create table if not exists khata_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references khata_students(id) on delete cascade,
  entry_date date not null default current_date,
  amount numeric(10,2) not null,
  entry_type text not null default 'daily', -- 'daily' or 'monthly'
  note text,
  created_at timestamptz default now()
);

create index if not exists khata_entries_student_id_idx on khata_entries(student_id);
create index if not exists khata_entries_entry_date_idx on khata_entries(entry_date);
