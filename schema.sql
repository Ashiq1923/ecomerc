-- =============================================
-- ShopEase E-Commerce Schema for Supabase
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  address     text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup + set is_admin if email contains "admin"
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone, is_admin)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    (new.email ilike '%admin%')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── CATEGORIES ────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  icon        text,
  description text,
  created_at  timestamptz not null default now()
);

-- ── PRODUCTS ──────────────────────────────────
create table if not exists products (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  description  text,
  price        numeric(12,2) not null check (price >= 0),
  sale_price   numeric(12,2) check (sale_price >= 0),
  stock        integer not null default 0,
  category_id  uuid references categories(id) on delete set null,
  image_url    text,
  images       text[],
  is_active    boolean not null default true,
  avg_rating   numeric(3,2) not null default 0,
  review_count integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── BANNERS ───────────────────────────────────
create table if not exists banners (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subtitle    text,
  button_text text default 'Shop Now',
  image_url   text,
  link_url    text,
  bg_color    text default '#1e40af',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── ORDERS ────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete set null,
  customer_name     text not null,
  customer_phone    text not null,
  customer_address  text,
  notes             text,
  items             jsonb not null default '[]',
  total_amount      numeric(12,2) not null default 0,
  status            text not null default 'pending'
                    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at        timestamptz not null default now()
);

-- ── REVIEWS ───────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      numeric(2,1) not null check (rating between 1 and 5),
  comment     text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

-- Auto-update product avg_rating & review_count after review changes
create or replace function update_product_rating()
returns trigger language plpgsql as $$
declare
  v_avg   numeric;
  v_count integer;
  v_pid   uuid;
begin
  v_pid := coalesce(new.product_id, old.product_id);
  select round(avg(rating)::numeric, 2), count(*)
    into v_avg, v_count
    from reviews
   where product_id = v_pid and is_approved = true;
  update products
     set avg_rating   = coalesce(v_avg, 0),
         review_count = coalesce(v_count, 0)
   where id = v_pid;
  return new;
end;
$$;

drop trigger if exists trg_update_rating on reviews;
create trigger trg_update_rating
  after insert or update or delete on reviews
  for each row execute function update_product_rating();

-- ── ROW LEVEL SECURITY ────────────────────────
alter table profiles   enable row level security;
alter table products   enable row level security;
alter table categories enable row level security;
alter table banners    enable row level security;
alter table orders     enable row level security;
alter table reviews    enable row level security;

-- PROFILES
-- Only own-profile policies. "Admin read all profiles" is intentionally omitted
-- because it causes infinite RLS recursion when is_admin = true.
create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- PRODUCTS (public read, admin write)
create policy "Public read active products" on products for select using (is_active = true);
create policy "Admin full products" on products for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- CATEGORIES (public read, admin write)
create policy "Public read categories" on categories for select using (true);
create policy "Admin full categories" on categories for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- BANNERS (public read active, admin write)
create policy "Public read active banners" on banners for select using (is_active = true);
create policy "Admin full banners" on banners for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ORDERS (user reads own, admin reads all)
create policy "Users insert orders" on orders for insert with check (true);
create policy "Users read own orders" on orders for select using (
  user_id = auth.uid() or user_id is null
);
create policy "Admin full orders" on orders for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- REVIEWS (public read approved, auth insert, admin full)
create policy "Public read approved reviews" on reviews for select using (is_approved = true);
create policy "Auth insert review" on reviews for insert with check (auth.uid() = user_id);
create policy "Users update own review" on reviews for update using (auth.uid() = user_id);
create policy "Admin full reviews" on reviews for all using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- ── SAMPLE DATA ───────────────────────────────
insert into categories (name, icon) values
  ('Electronics',  '📱'),
  ('Clothing',     '👕'),
  ('Home & Kitchen','🏠'),
  ('Sports',       '⚽'),
  ('Books',        '📚')
on conflict (name) do nothing;

insert into banners (title, subtitle, button_text, bg_color, sort_order) values
  ('Summer Sale 🔥', 'Up to 50% off on all Electronics', 'Shop Now', '#1e40af', 1),
  ('New Arrivals ✨', 'Check out the latest collection',   'Browse Now', '#7c3aed', 2),
  ('Free Delivery',  'On orders above Rs. 1000',          'Order Now', '#065f46', 3)
on conflict do nothing;

-- Sample products (update category_id after inserting categories)
with cats as (select id, name from categories)
insert into products (name, description, price, sale_price, stock, category_id, image_url)
select * from (values
  ('Wireless Earbuds Pro', 'Premium sound with ANC and 30hr battery', 3999, 2999, 50,
   (select id from cats where name='Electronics'),
   'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80'),
  ('Casual T-Shirt Pack', 'Comfortable cotton, set of 3', 1499, 1199, 100,
   (select id from cats where name='Clothing'),
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'),
  ('Smart Coffee Maker', 'Programmable with auto brew timer', 5999, null, 30,
   (select id from cats where name='Home & Kitchen'),
   'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&q=80'),
  ('Running Shoes X1', 'Lightweight mesh with cushioned sole', 4499, 3499, 45,
   (select id from cats where name='Sports'),
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'),
  ('Bluetooth Speaker', '360° surround sound, waterproof IPX5', 2999, null, 60,
   (select id from cats where name='Electronics'),
   'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80'),
  ('Yoga Mat Premium', 'Non-slip 6mm thick with carry strap', 1799, 1499, 80,
   (select id from cats where name='Sports'),
   'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&q=80')
) as v(name, description, price, sale_price, stock, category_id, image_url)
on conflict do nothing;
