create extension if not exists pgcrypto;

do $$
begin
  create type public.business_type as enum ('FnB', 'Retail');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_role as enum ('Owner', 'Kasir');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.staff_shift as enum ('Pagi', 'Sore');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.record_status as enum ('Aktif', 'Nonaktif');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.draft_status as enum ('Aktif', 'Draft');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.expense_status as enum ('Tercatat', 'Draft');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_method as enum ('Tunai', 'QRIS', 'Transfer', 'Kas outlet');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transaction_status as enum ('Selesai', 'Void', 'Refund');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stock_movement_type as enum ('Penjualan', 'Stok masuk', 'Penyesuaian', 'Stok opname');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_status as enum ('Aktif', 'Trial', 'Past due', 'Batal');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type public.business_type not null default 'FnB',
  whatsapp text,
  timezone text not null default 'Asia/Makassar',
  currency text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.app_users(id) on delete cascade,
  outlet_id uuid references public.outlets(id) on delete set null,
  name text not null,
  email text not null,
  role public.user_role not null default 'Owner',
  whatsapp text,
  shift public.staff_shift,
  status public.record_status not null default 'Aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  monthly_price integer not null check (monthly_price >= 0),
  product_limit integer,
  staff_limit integer,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.outlet_subscriptions (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status public.subscription_status not null default 'Aktif',
  started_at timestamptz not null default now(),
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  price integer not null check (price >= 0),
  cost_price integer not null default 0 check (cost_price >= 0),
  stock numeric(12, 3) not null default 0 check (stock >= 0),
  tag text not null default 'Reguler',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  unit text not null,
  stock numeric(12, 3) not null default 0 check (stock >= 0),
  min_stock numeric(12, 3) not null default 0 check (min_stock >= 0),
  cost_per_unit integer not null default 0 check (cost_per_unit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table if not exists public.product_recipes (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  qty numeric(12, 3) not null check (qty > 0),
  created_at timestamptz not null default now(),
  primary key (product_id, ingredient_id)
);

create table if not exists public.promos (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  code text not null,
  type text not null,
  target text not null,
  value text not null,
  period text not null,
  status public.draft_status not null default 'Aktif',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, code)
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  role public.user_role not null default 'Kasir',
  phone text not null,
  shift public.staff_shift not null default 'Pagi',
  status public.record_status not null default 'Aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role = 'Kasir')
);

create table if not exists public.customers (
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

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  title text not null,
  category text not null,
  amount integer not null check (amount > 0),
  expense_date date not null,
  payment_method public.payment_method not null,
  note text not null default '',
  status public.expense_status not null default 'Tercatat',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  invoice_no text not null,
  cashier_id uuid references public.profiles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  promo_id uuid references public.promos(id) on delete set null,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  payment_method public.payment_method not null,
  cash_received integer check (cash_received is null or cash_received >= 0),
  cash_change integer check (cash_change is null or cash_change >= 0),
  status public.transaction_status not null default 'Selesai',
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (outlet_id, invoice_no),
  check (payment_method in ('Tunai', 'QRIS'))
);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  category_name text,
  unit_price integer not null check (unit_price >= 0),
  qty numeric(12, 3) not null check (qty > 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  product_name text not null,
  category_name text,
  type public.stock_movement_type not null,
  qty_change numeric(12, 3) not null,
  previous_stock numeric(12, 3) not null check (previous_stock >= 0),
  next_stock numeric(12, 3) not null check (next_stock >= 0),
  note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredient_movements (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  ingredient_name text not null,
  qty_change numeric(12, 3) not null,
  previous_stock numeric(12, 3) not null check (previous_stock >= 0),
  next_stock numeric(12, 3) not null check (next_stock >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.cashier_shifts (
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

create index if not exists idx_profiles_outlet_id on public.profiles(outlet_id);
create index if not exists idx_products_outlet_id on public.products(outlet_id);
create index if not exists idx_ingredients_outlet_id on public.ingredients(outlet_id);
create index if not exists idx_customers_outlet_id on public.customers(outlet_id);
create index if not exists idx_suppliers_outlet_id on public.suppliers(outlet_id);
create index if not exists idx_transactions_outlet_completed_at on public.transactions(outlet_id, completed_at desc);
create index if not exists idx_transaction_items_transaction_id on public.transaction_items(transaction_id);
create index if not exists idx_stock_movements_outlet_created_at on public.stock_movements(outlet_id, created_at desc);
create index if not exists idx_expenses_outlet_expense_date on public.expenses(outlet_id, expense_date desc);
create index if not exists idx_cashier_shifts_outlet_id on public.cashier_shifts(outlet_id);
create index if not exists idx_cashier_shifts_cashier_id on public.cashier_shifts(cashier_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.ensure_app_user_profile(
  input_user_id uuid,
  input_email text,
  input_metadata jsonb default '{}'::jsonb
)
returns table (profile_id uuid, outlet_id uuid)
language plpgsql
as $$
declare
  resolved_profile_id uuid;
  resolved_outlet_id uuid;
  new_outlet_id uuid;
  outlet_name text;
begin
  select p.id, p.outlet_id
  into resolved_profile_id, resolved_outlet_id
  from public.profiles as p
  where p.id = input_user_id;

  if resolved_profile_id is not null and resolved_outlet_id is not null then
    return query select resolved_profile_id, resolved_outlet_id;
    return;
  end if;

  outlet_name := nullif(trim(coalesce(input_metadata->>'outlet', '')), '');

  if outlet_name is null then
    outlet_name := 'Outlet Mava Demo';
  end if;

  insert into public.outlets (name, business_type, whatsapp)
  values (
    outlet_name,
    coalesce(nullif(input_metadata->>'business_type', '')::public.business_type, 'FnB'),
    nullif(trim(coalesce(input_metadata->>'whatsapp', '')), '')
  )
  returning id into new_outlet_id;

  insert into public.profiles (id, outlet_id, name, email, role, whatsapp, status)
  values (
    input_user_id,
    new_outlet_id,
    coalesce(
      nullif(trim(coalesce(input_metadata->>'full_name', input_metadata->>'name', '')), ''),
      split_part(input_email, '@', 1)
    ),
    input_email,
    coalesce(nullif(input_metadata->>'role', '')::public.user_role, 'Owner'),
    nullif(trim(coalesce(input_metadata->>'whatsapp', '')), ''),
    'Aktif'
  )
  on conflict (id) do update set
    outlet_id = excluded.outlet_id,
    name = coalesce(nullif(public.profiles.name, ''), excluded.name),
    email = excluded.email,
    role = coalesce(public.profiles.role, excluded.role),
    whatsapp = coalesce(public.profiles.whatsapp, excluded.whatsapp),
    status = coalesce(public.profiles.status, excluded.status)
  returning public.profiles.id, public.profiles.outlet_id into resolved_profile_id, resolved_outlet_id;

  insert into public.outlet_subscriptions (outlet_id, plan_id, status, current_period_ends_at)
  values (new_outlet_id, 'core', 'Trial', now() + interval '30 days')
  on conflict (outlet_id) do nothing;

  insert into public.categories (outlet_id, name)
  values (new_outlet_id, 'FnB'), (new_outlet_id, 'Retail')
  on conflict (outlet_id, name) do nothing;

  return query select resolved_profile_id, resolved_outlet_id;
end;
$$;

do $$
declare
  item text;
  target_tables text[] := array[
    'app_users',
    'outlets',
    'profiles',
    'outlet_subscriptions',
    'categories',
    'products',
    'ingredients',
    'promos',
    'staff_members',
    'customers',
    'suppliers',
    'expenses',
    'cashier_shifts'
  ];
begin
  foreach item in array target_tables loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', item, item);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      item,
      item
    );
  end loop;
end $$;

insert into public.plans (id, name, monthly_price, product_limit, staff_limit, features)
values
  (
    'core',
    'Core',
    169000,
    30,
    2,
    '["Hingga 30 produk", "Transaksi unlimited", "Laporan harian & bulanan", "Struk digital via WhatsApp", "Hingga 2 staf kasir"]'::jsonb
  ),
  (
    'basic',
    'Basic',
    349000,
    null,
    null,
    '["Laporan HPP & profit margin", "Export PDF", "Member & loyalty poin", "Struk digital tanpa branding Mava", "Campaign promo lebih lengkap"]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  product_limit = excluded.product_limit,
  staff_limit = excluded.staff_limit,
  features = excluded.features;
