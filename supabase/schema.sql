-- ClubeZN base schema for Supabase/Postgres
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Roles used in app
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('consumer', 'partner', 'admin');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'redemption_status' and n.nspname = 'public'
  ) then
    create type public.redemption_status as enum ('generated', 'used', 'expired');
  end if;
end$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'notification_type' and n.nspname = 'public'
  ) then
    create type public.notification_type as enum ('company_approved', 'offer_approved', 'offer_rejected');
  end if;
end$$;

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text unique,
  phone text unique,
  neighborhood text,
  password text not null,
  role public.user_role not null,
  company_id text,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists blocked boolean not null default false;

create table if not exists public.companies (
  id text primary key,
  name text not null,
  public_name text,
  category text not null,
  neighborhood text not null,
  city text not null,
  state text not null,
  owner_user_id text not null,
  approved boolean not null default false,
  logo_image text,
  cover_image text,
  address_line text,
  bio text,
  instagram text,
  facebook text,
  website text,
  whatsapp text,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id text primary key,
  company_id text not null,
  title text not null,
  description text not null,
  discount_label text not null,
  category text not null,
  neighborhood text not null,
  images text[] not null default '{}',
  approved boolean not null default false,
  rejected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  id text primary key,
  user_id text not null,
  offer_id text not null,
  code text not null unique,
  status public.redemption_status not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.notifications (
  id text primary key,
  user_id text not null,
  company_id text,
  offer_id text,
  type public.notification_type not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Foreign keys after table creation (handles circular refs)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_users_company'
  ) then
    alter table public.users
      add constraint fk_users_company
      foreign key (company_id) references public.companies(id) on delete set null;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_companies_owner_user'
  ) then
    alter table public.companies
      add constraint fk_companies_owner_user
      foreign key (owner_user_id) references public.users(id) on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_offers_company'
  ) then
    alter table public.offers
      add constraint fk_offers_company
      foreign key (company_id) references public.companies(id) on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_redemptions_user'
  ) then
    alter table public.redemptions
      add constraint fk_redemptions_user
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_redemptions_offer'
  ) then
    alter table public.redemptions
      add constraint fk_redemptions_offer
      foreign key (offer_id) references public.offers(id) on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_notifications_user'
  ) then
    alter table public.notifications
      add constraint fk_notifications_user
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_notifications_company'
  ) then
    alter table public.notifications
      add constraint fk_notifications_company
      foreign key (company_id) references public.companies(id) on delete set null;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_notifications_offer'
  ) then
    alter table public.notifications
      add constraint fk_notifications_offer
      foreign key (offer_id) references public.offers(id) on delete set null;
  end if;
end$$;

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_companies_approved on public.companies(approved);
create index if not exists idx_companies_neighborhood on public.companies(neighborhood);
create index if not exists idx_offers_company on public.offers(company_id);
create index if not exists idx_offers_visibility on public.offers(approved, rejected);
create index if not exists idx_offers_category on public.offers(category);
create index if not exists idx_redemptions_offer on public.redemptions(offer_id);
create index if not exists idx_redemptions_user on public.redemptions(user_id);
create index if not exists idx_redemptions_status on public.redemptions(status);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- Row Level Security baseline
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.offers enable row level security;
alter table public.redemptions enable row level security;
alter table public.notifications enable row level security;

-- Public users can see only approved companies and approved offers not rejected.
drop policy if exists "public_read_companies" on public.companies;
create policy "public_read_companies"
on public.companies
for select
to public
using (approved = true);

drop policy if exists "public_read_offers" on public.offers;
create policy "public_read_offers"
on public.offers
for select
to public
using (approved = true and rejected = false);

-- Authenticated owner access patterns.
-- NOTE: this expects app user id to match auth.uid()::text.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
to authenticated
using (id = auth.uid()::text);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid()::text);

drop policy if exists "partners_select_own_company" on public.companies;
create policy "partners_select_own_company"
on public.companies
for select
to authenticated
using (owner_user_id = auth.uid()::text);

drop policy if exists "partners_update_own_company" on public.companies;
create policy "partners_update_own_company"
on public.companies
for update
to authenticated
using (owner_user_id = auth.uid()::text);

drop policy if exists "partners_select_own_offers" on public.offers;
create policy "partners_select_own_offers"
on public.offers
for select
to authenticated
using (
  exists (
    select 1
    from public.companies c
    where c.id = offers.company_id and c.owner_user_id = auth.uid()::text
  )
);

drop policy if exists "partners_insert_own_offers" on public.offers;
create policy "partners_insert_own_offers"
on public.offers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.companies c
    where c.id = offers.company_id and c.owner_user_id = auth.uid()::text
  )
);

drop policy if exists "partners_update_own_offers" on public.offers;
create policy "partners_update_own_offers"
on public.offers
for update
to authenticated
using (
  exists (
    select 1
    from public.companies c
    where c.id = offers.company_id and c.owner_user_id = auth.uid()::text
  )
);

drop policy if exists "users_select_own_redemptions" on public.redemptions;
create policy "users_select_own_redemptions"
on public.redemptions
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "users_insert_own_redemptions" on public.redemptions;
create policy "users_insert_own_redemptions"
on public.redemptions
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "users_select_own_notifications" on public.notifications;
create policy "users_select_own_notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "users_update_own_notifications" on public.notifications;
create policy "users_update_own_notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid()::text);
