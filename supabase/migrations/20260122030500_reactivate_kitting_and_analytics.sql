-- Reactivate inventory tables and add analytics metrics table

create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  current_stock numeric not null default 0,
  unit_type text,
  cost_per_unit numeric,
  safety_stock_threshold integer not null default 0
);

alter table public.components
  add column if not exists safety_stock_threshold integer;

update public.components
  set safety_stock_threshold = 0
  where safety_stock_threshold is null;

alter table public.components
  alter column safety_stock_threshold set default 0,
  alter column safety_stock_threshold set not null;

create table if not exists public.product_bom (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  component_id uuid references public.components (id) on delete restrict,
  quantity_required numeric
);

create table if not exists public.analytics_monthly_metrics (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  new_subscribers integer not null default 0,
  active_subscribers integer not null default 0,
  churned_subscribers integer not null default 0,
  total_revenue numeric not null default 0,
  marketing_spend numeric not null default 0
);

create unique index if not exists analytics_monthly_metrics_month_key
  on public.analytics_monthly_metrics (month);

alter table public.components enable row level security;
alter table public.product_bom enable row level security;
alter table public.analytics_monthly_metrics enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'components'
      and policyname = 'anon_full_access'
  ) then
    create policy anon_full_access
      on public.components
      for all
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'product_bom'
      and policyname = 'anon_full_access'
  ) then
    create policy anon_full_access
      on public.product_bom
      for all
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_monthly_metrics'
      and policyname = 'anon_full_access'
  ) then
    create policy anon_full_access
      on public.analytics_monthly_metrics
      for all
      to anon
      using (true)
      with check (true);
  end if;
end $$;
