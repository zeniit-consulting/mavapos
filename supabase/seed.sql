-- Optional demo data that mirrors src/components/mavapos/data.ts.
-- Run after the initial migration when you want a sample outlet for integration work.

insert into public.outlets (id, name, business_type, whatsapp)
values
  ('00000000-0000-4000-8000-000000000001', 'Outlet Mava Demo', 'FnB', '0812-3456-7788')
on conflict (id) do update set
  name = excluded.name,
  business_type = excluded.business_type,
  whatsapp = excluded.whatsapp;

insert into public.outlet_subscriptions (outlet_id, plan_id, status)
values ('00000000-0000-4000-8000-000000000001', 'core', 'Aktif')
on conflict (outlet_id) do update set
  plan_id = excluded.plan_id,
  status = excluded.status;

insert into public.categories (id, outlet_id, name)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'FnB'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Retail')
on conflict (id) do update set
  name = excluded.name;

insert into public.products (id, outlet_id, category_id, name, price, stock, tag, image_url)
values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Nasi Ayam Geprek', 18000, 18, 'Terlaris', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Es Kopi Susu', 16000, 24, 'Promo', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'Mie Goreng Spesial', 22000, 11, 'Dapur', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Roti Cokelat', 8500, 6, 'Stok tipis', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Air Mineral 600ml', 5000, 42, 'Cepat', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80'),
  ('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'Snack Kentang', 12000, 15, 'Barcode', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80')
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  price = excluded.price,
  stock = excluded.stock,
  tag = excluded.tag,
  image_url = excluded.image_url;

insert into public.ingredients (id, outlet_id, name, unit, stock, min_stock, cost_per_unit)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', 'Es batu', 'kg', 14, 5, 3500),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 'Teh celup', 'box', 9, 4, 18500),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', 'Gula cair', 'liter', 7, 3, 12000),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000001', 'Kopi blend house', 'kg', 4, 2, 145000),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000001', 'Susu fresh', 'liter', 6, 2, 21000)
on conflict (id) do update set
  name = excluded.name,
  unit = excluded.unit,
  stock = excluded.stock,
  min_stock = excluded.min_stock,
  cost_per_unit = excluded.cost_per_unit;

insert into public.product_recipes (product_id, ingredient_id, qty)
values
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000301', 0.15),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000303', 0.03),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000304', 0.025),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000305', 0.12)
on conflict (product_id, ingredient_id) do update set
  qty = excluded.qty;

insert into public.promos (id, outlet_id, name, code, type, target, value, period, status)
values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001', 'Diskon kopi sore', 'DISKONKOPISORE', 'Diskon nominal', 'Es Kopi Susu', 'Rp6.000', '15.00-18.00', 'Aktif'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', 'Member loyalty', 'MEMBERLOYALTY', 'Loyalty poin', 'Semua produk', '1 poin / Rp10.000', 'Setiap hari', 'Aktif'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000001', 'Bundle menu cepat', 'BUNDLECEPAT', 'Bundle', 'Makanan + Minuman', 'Harga paket', 'Draft kampanye', 'Draft')
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  type = excluded.type,
  target = excluded.target,
  value = excluded.value,
  period = excluded.period,
  status = excluded.status;

insert into public.staff_members (id, outlet_id, name, role, phone, shift, status)
values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000001', 'Ayu Lestari', 'Kasir', '0812-3456-7788', 'Pagi', 'Aktif'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000001', 'Rafi Pratama', 'Kasir', '0812-8899-1100', 'Sore', 'Aktif')
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  shift = excluded.shift,
  status = excluded.status;

insert into public.expenses (id, outlet_id, title, category, amount, expense_date, payment_method, note, status)
values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', 'Belanja bahan minuman', 'Bahan baku', 285000, '2026-05-06', 'Transfer', 'Restock teh, gula, dan susu', 'Tercatat'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', 'Pembelian gas dapur', 'Operasional', 95000, '2026-05-05', 'Kas outlet', 'Untuk kebutuhan dapur harian', 'Tercatat'),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001', 'Servis blender bar', 'Peralatan', 65000, '2026-05-03', 'Tunai', 'Ganti karet seal', 'Draft')
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  amount = excluded.amount,
  expense_date = excluded.expense_date,
  payment_method = excluded.payment_method,
  note = excluded.note,
  status = excluded.status;
