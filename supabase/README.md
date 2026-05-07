# Supabase Setup MAVA POS

Folder ini berisi setup database awal untuk fitur POS yang sudah ada di UI.

## File

- `migrations/202605070001_initial_pos_schema.sql`: schema utama, enum, trigger, RLS policy, auth trigger, dan seed paket `Core`/`Basic`.
- `seed.sql`: data demo yang mengikuti `src/components/mavapos/data.ts`.

## Jalankan Lewat Supabase SQL Editor

1. Buka project Supabase.
2. Masuk ke **SQL Editor**.
3. Jalankan isi `migrations/202605070001_initial_pos_schema.sql`.
4. Opsional: jalankan isi `seed.sql` untuk data demo.
5. Pastikan `.env.local` punya nilai berikut:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Jalankan Lewat Supabase CLI

```bash
supabase link --project-ref <project-ref>
supabase db push
supabase db seed
```

## Catatan Integrasi Aplikasi

- Auth Supabase sudah tersedia di aplikasi lewat `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, dan `src/proxy.ts`.
- Registrasi user baru akan otomatis membuat `outlets`, `profiles`, subscription `Core` berstatus `Trial` selama 30 hari, dan kategori awal `FnB`/`Retail`.
- Akun Supabase lama yang dibuat sebelum migration akan dibantu oleh RPC `ensure_current_user_profile()` saat aplikasi pertama kali memuat data outlet.
- Data produk, bahan, promo, staf, pengeluaran, stok, dan transaksi saat ini masih hidup di state React plus `localStorage`. Langkah berikutnya adalah mengganti seed/localStorage dengan query Supabase per tabel.
- RLS dibuat per `outlet_id`. User role `Owner` bisa mengelola master data; user `Kasir` bisa membaca data outlet dan membuat transaksi/mutasi yang diperlukan kasir.
