# PostgreSQL Setup MAVA POS

Schema ini adalah versi PostgreSQL standar dari schema Supabase sebelumnya.
Bagian Supabase-only sudah dihapus: `auth.users`, `auth.uid()`, trigger pada
`auth.users`, RLS policy Supabase, dan role `authenticated`.

## Environment

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/mavapos
```

Env Supabase lama boleh dikosongkan jika aplikasi dijalankan tanpa Supabase.

## Setup Database

```bash
createdb mavapos
psql "$DATABASE_URL" -f database/postgresql/schema.sql
psql "$DATABASE_URL" -f database/postgresql/seed.sql
```

## Health Check

Setelah `npm run dev`, cek koneksi:

```bash
curl http://localhost:3000/api/health/database
```

Response sukses:

```json
{"status":"ok","database":"postgresql","checkedAt":"..."}
```

## Catatan Migrasi

- `public.app_users` menggantikan `auth.users`.
- `public.profiles.id` sekarang reference ke `public.app_users(id)`.
- `public.ensure_app_user_profile(...)` menggantikan RPC
  `ensure_current_user_profile()` yang sebelumnya tergantung `auth.uid()`.
- Security per outlet sekarang harus ditegakkan di layer aplikasi/API karena
  RLS Supabase tidak dipakai di schema PostgreSQL standar ini.
- Password di `seed.sql` adalah placeholder hash. Jangan dipakai untuk login
  produksi sebelum auth PostgreSQL-native diimplementasikan.
