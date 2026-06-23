-- Run this in Supabase SQL Editor after creating your project.

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.site_assets (
  asset_key text primary key check (asset_key in ('logo', 'hero')),
  image_path text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  area text not null,
  crew_count text not null,
  work_hours text not null,
  description text not null,
  before_image_path text not null,
  after_image_path text not null,
  published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.site_assets enable row level security;
alter table public.cases enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = auth.jwt() ->> 'email'
  );
$$;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Public can read site assets" on public.site_assets;
create policy "Public can read site assets"
on public.site_assets
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage site assets" on public.site_assets;
create policy "Admins can manage site assets"
on public.site_assets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read published cases" on public.cases;
create policy "Public can read published cases"
on public.cases
for select
to anon, authenticated
using (published = true or public.is_admin());

drop policy if exists "Admins can manage cases" on public.cases;
create policy "Admins can manage cases"
on public.cases
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'aipimoo-images',
  'aipimoo-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read aipimoo images" on storage.objects;
create policy "Public can read aipimoo images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'aipimoo-images');

drop policy if exists "Admins can upload aipimoo images" on storage.objects;
create policy "Admins can upload aipimoo images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'aipimoo-images'
  and public.is_admin()
  and lower((storage.foldername(name))[1]) in ('site-assets', 'cases')
);

drop policy if exists "Admins can update aipimoo images" on storage.objects;
create policy "Admins can update aipimoo images"
on storage.objects
for update
to authenticated
using (bucket_id = 'aipimoo-images' and public.is_admin())
with check (bucket_id = 'aipimoo-images' and public.is_admin());

drop policy if exists "Admins can delete aipimoo images" on storage.objects;
create policy "Admins can delete aipimoo images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'aipimoo-images' and public.is_admin());

-- After creating your Supabase Auth user, run this with your own email:
-- insert into public.admin_users (email) values ('your-email@example.com');
