-- Toucheng Living v0.1 Alpha Build004
create table if not exists living_places (
  id text primary key,
  name text not null,
  category text not null,
  subcategory text,
  address text,
  phone text,
  status text not null default 'seed',
  verified boolean not null default false,
  editorial text,
  tags jsonb not null default '[]'::jsonb,
  recommended jsonb not null default '[]'::jsonb,
  hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists living_place_revisions (
  revision_id bigint generated always as identity primary key,
  place_id text not null references living_places(id),
  payload jsonb not null,
  review_status text not null default 'pending',
  created_at timestamptz not null default now()
);
