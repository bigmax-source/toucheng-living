create table if not exists living_places (
  id text primary key,
  name text not null,
  category text not null,
  subcategory text,
  address text,
  phone text,
  status text not null default 'seed',
  claimed boolean not null default false,
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
