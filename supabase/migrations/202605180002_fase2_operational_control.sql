-- Supabase Migration: Fase 2 (Security & Logistics / Operational Control)
-- Date: 2026-05-18

-- 1. Buat Tabel Suppliers / Vendor Penyuplai
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing untuk pencarian cepat
create index idx_suppliers_outlet_id on public.suppliers(outlet_id);

-- Hubungkan Trigger updated_at
create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

-- Aktifkan RLS
alter table public.suppliers enable row level security;

-- RLS Policies
create policy "Users can read outlet suppliers"
on public.suppliers for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Users can manage outlet suppliers"
on public.suppliers for all
to authenticated
using (outlet_id = public.current_profile_outlet_id())
with check (outlet_id = public.current_profile_outlet_id());


-- 2. Buat Tabel Cashier Shifts / Laci Kasir & Buka-Tutup Shift
create table public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  cashier_id uuid not null references public.profiles(id) on delete cascade,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  starting_cash integer not null default 0 check (starting_cash >= 0),
  expected_cash integer not null default 0,
  actual_cash integer,
  difference integer,
  status text not null check (status in ('Buka', 'Tutup')) default 'Buka',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexing
create index idx_cashier_shifts_outlet_id on public.cashier_shifts(outlet_id);
create index idx_cashier_shifts_cashier_id on public.cashier_shifts(cashier_id);

-- Hubungkan Trigger updated_at
create trigger cashier_shifts_set_updated_at
before update on public.cashier_shifts
for each row execute function public.set_updated_at();

-- Aktifkan RLS
alter table public.cashier_shifts enable row level security;

-- RLS Policies
create policy "Users can read outlet shifts"
on public.cashier_shifts for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Users can manage outlet shifts"
on public.cashier_shifts for all
to authenticated
using (outlet_id = public.current_profile_outlet_id())
with check (outlet_id = public.current_profile_outlet_id());


-- 3. Tambahkan supplier_id pada tabel pergerakan stok barang dan mutasi bahan baku
alter table public.stock_movements
add column supplier_id uuid references public.suppliers(id) on delete set null;

alter table public.ingredient_movements
add column supplier_id uuid references public.suppliers(id) on delete set null;
