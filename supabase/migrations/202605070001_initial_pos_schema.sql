create extension if not exists pgcrypto;

create type public.business_type as enum ('FnB', 'Retail');
create type public.user_role as enum ('Owner', 'Kasir');
create type public.staff_shift as enum ('Pagi', 'Sore');
create type public.record_status as enum ('Aktif', 'Nonaktif');
create type public.draft_status as enum ('Aktif', 'Draft');
create type public.expense_status as enum ('Tercatat', 'Draft');
create type public.payment_method as enum ('Tunai', 'QRIS', 'Transfer', 'Kas outlet');
create type public.transaction_status as enum ('Selesai', 'Void', 'Refund');
create type public.stock_movement_type as enum ('Penjualan', 'Stok masuk', 'Penyesuaian', 'Stok opname');
create type public.subscription_status as enum ('Aktif', 'Trial', 'Past due', 'Batal');

create table public.outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type public.business_type not null default 'FnB',
  whatsapp text,
  timezone text not null default 'Asia/Makassar',
  currency text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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

create table public.plans (
  id text primary key,
  name text not null,
  monthly_price integer not null check (monthly_price >= 0),
  product_limit integer,
  staff_limit integer,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.outlet_subscriptions (
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

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  price integer not null check (price >= 0),
  stock numeric(12, 3) not null default 0 check (stock >= 0),
  tag text not null default 'Reguler',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, name)
);

create table public.ingredients (
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

create table public.product_recipes (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  qty numeric(12, 3) not null check (qty > 0),
  created_at timestamptz not null default now(),
  primary key (product_id, ingredient_id)
);

create table public.promos (
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

create table public.staff_members (
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

create table public.expenses (
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

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  invoice_no text not null,
  cashier_id uuid references public.profiles(id) on delete set null,
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

create table public.transaction_items (
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

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
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

create table public.ingredient_movements (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  ingredient_name text not null,
  qty_change numeric(12, 3) not null,
  previous_stock numeric(12, 3) not null check (previous_stock >= 0),
  next_stock numeric(12, 3) not null check (next_stock >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index idx_profiles_outlet_id on public.profiles(outlet_id);
create index idx_products_outlet_id on public.products(outlet_id);
create index idx_ingredients_outlet_id on public.ingredients(outlet_id);
create index idx_transactions_outlet_completed_at on public.transactions(outlet_id, completed_at desc);
create index idx_transaction_items_transaction_id on public.transaction_items(transaction_id);
create index idx_stock_movements_outlet_created_at on public.stock_movements(outlet_id, created_at desc);
create index idx_expenses_outlet_expense_date on public.expenses(outlet_id, expense_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger outlets_set_updated_at
before update on public.outlets
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger outlet_subscriptions_set_updated_at
before update on public.outlet_subscriptions
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

create trigger promos_set_updated_at
before update on public.promos
for each row execute function public.set_updated_at();

create trigger staff_members_set_updated_at
before update on public.staff_members
for each row execute function public.set_updated_at();

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create or replace function public.current_profile_outlet_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select outlet_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'Owner'
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_outlet_id uuid;
  outlet_name text;
begin
  outlet_name := nullif(trim(coalesce(new.raw_user_meta_data->>'outlet', '')), '');

  if outlet_name is null then
    outlet_name := 'Outlet Mava Demo';
  end if;

  insert into public.outlets (name, business_type, whatsapp)
  values (
    outlet_name,
    coalesce((new.raw_user_meta_data->>'business_type')::public.business_type, 'FnB'),
    nullif(trim(coalesce(new.raw_user_meta_data->>'whatsapp', '')), '')
  )
  returning id into new_outlet_id;

  insert into public.profiles (id, outlet_id, name, email, role, whatsapp, status)
  values (
    new.id,
    new_outlet_id,
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'Owner'),
    nullif(trim(coalesce(new.raw_user_meta_data->>'whatsapp', '')), ''),
    'Aktif'
  );

  insert into public.outlet_subscriptions (outlet_id, plan_id, status)
  values (new_outlet_id, 'core', 'Aktif')
  on conflict (outlet_id) do nothing;

  insert into public.categories (outlet_id, name)
  values (new_outlet_id, 'FnB'), (new_outlet_id, 'Retail')
  on conflict (outlet_id, name) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.outlets enable row level security;
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.outlet_subscriptions enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.product_recipes enable row level security;
alter table public.promos enable row level security;
alter table public.staff_members enable row level security;
alter table public.expenses enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.ingredient_movements enable row level security;

create policy "Plans are readable by authenticated users"
on public.plans for select
to authenticated
using (true);

create policy "Users can read their outlet"
on public.outlets for select
to authenticated
using (id = public.current_profile_outlet_id());

create policy "Owners can update their outlet"
on public.outlets for update
to authenticated
using (id = public.current_profile_outlet_id() and public.is_owner())
with check (id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet profiles"
on public.profiles for select
to authenticated
using (outlet_id = public.current_profile_outlet_id() or id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Users can read their outlet subscription"
on public.outlet_subscriptions for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners can update their outlet subscription"
on public.outlet_subscriptions for update
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet categories"
on public.categories for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet categories"
on public.categories for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet products"
on public.products for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet products"
on public.products for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Cashiers can update product stock"
on public.products for update
to authenticated
using (outlet_id = public.current_profile_outlet_id())
with check (outlet_id = public.current_profile_outlet_id());

create policy "Users can read outlet ingredients"
on public.ingredients for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet ingredients"
on public.ingredients for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Cashiers can update ingredient stock"
on public.ingredients for update
to authenticated
using (outlet_id = public.current_profile_outlet_id())
with check (outlet_id = public.current_profile_outlet_id());

create policy "Users can read outlet recipes"
on public.product_recipes for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_recipes.product_id
      and p.outlet_id = public.current_profile_outlet_id()
  )
);

create policy "Owners manage outlet recipes"
on public.product_recipes for all
to authenticated
using (
  public.is_owner()
  and exists (
    select 1
    from public.products p
    where p.id = product_recipes.product_id
      and p.outlet_id = public.current_profile_outlet_id()
  )
)
with check (
  public.is_owner()
  and exists (
    select 1
    from public.products p
    where p.id = product_recipes.product_id
      and p.outlet_id = public.current_profile_outlet_id()
  )
);

create policy "Users can read outlet promos"
on public.promos for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet promos"
on public.promos for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet staff"
on public.staff_members for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet staff"
on public.staff_members for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet expenses"
on public.expenses for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Owners manage outlet expenses"
on public.expenses for all
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet transactions"
on public.transactions for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Users can create outlet transactions"
on public.transactions for insert
to authenticated
with check (outlet_id = public.current_profile_outlet_id());

create policy "Owners can update outlet transactions"
on public.transactions for update
to authenticated
using (outlet_id = public.current_profile_outlet_id() and public.is_owner())
with check (outlet_id = public.current_profile_outlet_id() and public.is_owner());

create policy "Users can read outlet transaction items"
on public.transaction_items for select
to authenticated
using (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_items.transaction_id
      and t.outlet_id = public.current_profile_outlet_id()
  )
);

create policy "Users can create outlet transaction items"
on public.transaction_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_items.transaction_id
      and t.outlet_id = public.current_profile_outlet_id()
  )
);

create policy "Users can read outlet stock movements"
on public.stock_movements for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Users can create outlet stock movements"
on public.stock_movements for insert
to authenticated
with check (outlet_id = public.current_profile_outlet_id());

create policy "Users can read outlet ingredient movements"
on public.ingredient_movements for select
to authenticated
using (outlet_id = public.current_profile_outlet_id());

create policy "Users can create outlet ingredient movements"
on public.ingredient_movements for insert
to authenticated
with check (outlet_id = public.current_profile_outlet_id());

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
