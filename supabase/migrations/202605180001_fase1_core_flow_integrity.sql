-- Supabase Migration: Fase 1 (Core Flow Integrity)
-- Date: 2026-05-18

-- 1. Tambahkan Harga Beli (HPP) untuk Produk Retail
alter table public.products
add column cost_price integer not null default 0 check (cost_price >= 0);

-- 2. Buat Tabel Customers / Pelanggan untuk Membership & Loyalty Poin
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, phone)
);

-- Tambahkan Index untuk Pencarian Outlet Pelanggan yang Cepat
create index idx_customers_outlet_id on public.customers(outlet_id);

-- Hubungkan Trigger updated_at
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- Aktifkan Row Level Security (RLS)
alter table public.customers enable row level security;

-- Definisikan Kebijakan RLS (Security Policies)
create policy "Users can read outlet customers"
on public.customers for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet customers"
on public.customers for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Cashiers can update customer points"
on public.customers for update
to authenticated
using (outlet_id = public.current_profile_outlet_id())
with check (outlet_id = public.current_profile_outlet_id());

-- 3. Hubungkan Pelanggan ke Transaksi (customer_id)
alter table public.transactions
add column customer_id uuid references public.customers(id) on delete set null;
