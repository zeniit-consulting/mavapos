create or replace function public.ensure_current_user_profile()
returns table (profile_id uuid, outlet_id uuid)
language plpgsql
security definer
set search_path = public
as '
declare
  auth_user_record auth.users%rowtype;
  new_outlet_id uuid;
  resolved_profile_id uuid;
  resolved_outlet_id uuid;
  outlet_name text;
begin
  select * into auth_user_record from auth.users where id = auth.uid();

  if auth_user_record.id is null then
    raise exception ''Not authenticated'';
  end if;

  select p.id, p.outlet_id
  into resolved_profile_id, resolved_outlet_id
  from public.profiles as p
  where p.id = auth_user_record.id;

  if resolved_profile_id is not null and resolved_outlet_id is not null then
    return query select resolved_profile_id, resolved_outlet_id;
    return;
  end if;

  outlet_name := nullif(trim(coalesce(auth_user_record.raw_user_meta_data->>''outlet'', '''')), '''');

  if outlet_name is null then
    outlet_name := ''Outlet Mava Demo'';
  end if;

  insert into public.outlets (name, business_type, whatsapp)
  values (
    outlet_name,
    coalesce(nullif(auth_user_record.raw_user_meta_data->>''business_type'', '''')::public.business_type, ''FnB''),
    nullif(trim(coalesce(auth_user_record.raw_user_meta_data->>''whatsapp'', '''')), '''')
  )
  returning id into new_outlet_id;

  insert into public.profiles (id, outlet_id, name, email, role, whatsapp, status)
  values (
    auth_user_record.id,
    new_outlet_id,
    coalesce(
      nullif(trim(coalesce(auth_user_record.raw_user_meta_data->>''full_name'', auth_user_record.raw_user_meta_data->>''name'', '''')), ''''),
      split_part(auth_user_record.email, ''@'', 1)
    ),
    auth_user_record.email,
    coalesce(nullif(auth_user_record.raw_user_meta_data->>''role'', '''')::public.user_role, ''Owner''),
    nullif(trim(coalesce(auth_user_record.raw_user_meta_data->>''whatsapp'', '''')), ''''),
    ''Aktif''
  )
  on conflict (id) do update set
    outlet_id = excluded.outlet_id,
    name = coalesce(nullif(public.profiles.name, ''''), excluded.name),
    email = excluded.email,
    role = coalesce(public.profiles.role, excluded.role),
    whatsapp = coalesce(public.profiles.whatsapp, excluded.whatsapp),
    status = coalesce(public.profiles.status, excluded.status)
  returning public.profiles.id, public.profiles.outlet_id into resolved_profile_id, resolved_outlet_id;

  insert into public.outlet_subscriptions (outlet_id, plan_id, status, current_period_ends_at)
  values (new_outlet_id, ''core'', ''Trial'', now() + interval ''30 days'')
  on conflict on constraint outlet_subscriptions_outlet_id_key do nothing;

  insert into public.categories (outlet_id, name)
  values (new_outlet_id, ''FnB''), (new_outlet_id, ''Retail'')
  on conflict on constraint categories_outlet_id_name_key do nothing;

  return query select resolved_profile_id, resolved_outlet_id;
end;
';

grant execute on function public.ensure_current_user_profile() to authenticated;
