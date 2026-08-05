-- Toucheng Living Beta v0.1 schema scaffold
create extension if not exists pgcrypto;

create type public.place_status as enum ('pending','published','rejected','archived');
create type public.revision_status as enum ('pending','approved','rejected');

create table public.living_places (
  id uuid primary key default gen_random_uuid(),
  public_slug text unique,
  category text not null,
  name text not null,
  address text not null,
  public_phone text,
  summary text,
  facebook_url text,
  instagram_url text,
  website_url text,
  hours jsonb not null default '[]'::jsonb,
  hours_note text,
  photo_urls jsonb not null default '[]'::jsonb,
  status public.place_status not null default 'pending',
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.place_maintainers (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.living_places(id) on delete cascade,
  contact_name text not null,
  contact_phone text not null,
  email text,
  submitter_role text not null,
  edit_token_hash text not null,
  token_created_at timestamptz not null default now(),
  token_revoked_at timestamptz
);

create table public.place_revisions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.living_places(id) on delete cascade,
  payload jsonb not null,
  status public.revision_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text
);

alter table public.living_places enable row level security;
alter table public.place_maintainers enable row level security;
alter table public.place_revisions enable row level security;

create policy "published places are public" on public.living_places for select using (status='published');
-- Insert/update should be routed through Edge Functions using service role.
