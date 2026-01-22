-- Align recurring_rules schema with app expectations (category, description, created_at)

alter table public.recurring_rules
  add column if not exists description text;

alter table public.recurring_rules
  add column if not exists category text;

update public.recurring_rules
  set category = 'OpEx'
  where category is null;

alter table public.recurring_rules
  alter column category set default 'OpEx',
  alter column category set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'recurring_rules_category_check'
  ) then
    alter table public.recurring_rules
      add constraint recurring_rules_category_check
      check (category in ('OpEx', 'COGS', 'Marketing'));
  end if;
end $$;

alter table public.recurring_rules
  add column if not exists created_at timestamptz;

update public.recurring_rules
  set created_at = now()
  where created_at is null;

alter table public.recurring_rules
  alter column created_at set default now(),
  alter column created_at set not null;

alter table public.recurring_rules enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recurring_rules'
      and policyname = 'anon_full_access'
  ) then
    create policy anon_full_access
      on public.recurring_rules
      for all
      to anon
      using (true)
      with check (true);
  end if;
end $$;

-- Hint PostgREST to refresh schema cache (Supabase listens on this channel).
select pg_notify('pgrst', 'reload schema');
