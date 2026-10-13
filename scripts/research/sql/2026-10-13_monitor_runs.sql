-- Additive migration. Does not alter products, decisions, criteria or market snapshots.
-- Run as DB owner. Worker RPCs are service_role only; the web remains read-only.
begin;
create table public.research_monitor_runs (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id),
  run_day date not null,
  policy_version text not null,
  status text not null check (status in ('running','completed','failed')),
  attempt integer not null default 1 check (attempt between 1 and 3),
  lease_token uuid not null default gen_random_uuid(),
  lease_until timestamptz not null default now() + interval '10 minutes',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  result jsonb,
  unique(product_id, run_day, policy_version)
);
create table public.research_monitor_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.research_monitor_runs(id),
  recorded_at timestamptz not null default now(),
  attempt integer not null,
  step text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb
);
create table public.research_monitor_tasks (
  product_id bigint not null references public.products(id),
  task_key text not null,
  run_id uuid not null references public.research_monitor_runs(id),
  title text not null,
  detail text not null,
  kind text not null check (kind in ('research','human')),
  status text not null default 'open' check (status in ('open','resolved')),
  updated_at timestamptz not null default now(),
  primary key(product_id, task_key)
);
alter table public.research_monitor_runs enable row level security;
alter table public.research_monitor_events enable row level security;
alter table public.research_monitor_tasks enable row level security;
create policy monitor_runs_read on public.research_monitor_runs for select to anon, authenticated using (true);
create policy monitor_events_read on public.research_monitor_events for select to anon, authenticated using (true);
create policy monitor_tasks_read on public.research_monitor_tasks for select to anon, authenticated using (true);
grant select on public.research_monitor_runs, public.research_monitor_events, public.research_monitor_tasks to anon, authenticated;

create function public.research_monitor_claim(p_product_id bigint, p_run_day date, p_policy_version text)
returns setof public.research_monitor_runs language plpgsql security definer set search_path = public as $$
declare r public.research_monitor_runs;
begin
  insert into research_monitor_runs(product_id, run_day, policy_version, status)
    values(p_product_id,p_run_day,p_policy_version,'running')
    on conflict(product_id,run_day,policy_version) do nothing returning * into r;
  if r.id is null then
    update research_monitor_runs set status='running', attempt=attempt+1,
      lease_token=gen_random_uuid(), lease_until=now()+interval '10 minutes', error=null, finished_at=null
      where product_id=p_product_id and run_day=p_run_day and policy_version=p_policy_version
      and attempt<3 and (status='failed' or (status='running' and lease_until<now()))
      returning * into r;
  end if;
  if r.id is not null then
    insert into research_monitor_events(run_id,attempt,step,status) values(r.id,r.attempt,'claim','running');
    return next r;
  end if;
end $$;

create function public.research_monitor_finish(p_run_id uuid, p_lease_token uuid, p_result jsonb, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.research_monitor_runs; t jsonb;
begin
  select * into r from research_monitor_runs where id=p_run_id for update;
  if r.id is null or r.status<>'running' or r.lease_token<>p_lease_token or r.lease_until<now() then
    raise exception 'Lease lost';
  end if;
  if p_error is null then
    if p_result is null or p_result->>'product_id' is distinct from r.product_id::text
      or p_result->>'policy_version' is distinct from r.policy_version
      or p_result->>'evaluated_on' is distinct from r.run_day::text
      or jsonb_typeof(p_result->'tasks') is distinct from 'array' then
      raise exception 'Invalid monitor result';
    end if;
    -- Only auto-resolve data checks. Human work remains open until evidence is supplied.
    update research_monitor_tasks set status='resolved',updated_at=now()
      where product_id=r.product_id and kind='research' and status='open'
      and task_key not in (select value->>'key' from jsonb_array_elements(p_result->'tasks'));
    for t in select value from jsonb_array_elements(p_result->'tasks') loop
      insert into research_monitor_tasks(product_id,task_key,run_id,title,detail,kind)
        values(r.product_id,t->>'key',r.id,t->>'title',t->>'detail',t->>'kind')
        on conflict(product_id,task_key) do update set run_id=excluded.run_id,title=excluded.title,
          detail=excluded.detail,kind=excluded.kind,status='open',updated_at=now();
    end loop;
  end if;
  update research_monitor_runs set status=case when p_error is null then 'completed' else 'failed' end,
    finished_at=now(), result=p_result,error=left(p_error,500) where id=r.id;
  insert into research_monitor_events(run_id,attempt,step,status,detail)
    values(r.id,r.attempt,'audit',case when p_error is null then 'completed' else 'failed' end,
      case when p_error is null then jsonb_build_object('summary',p_result->>'summary') else jsonb_build_object('error',left(p_error,500)) end);
end $$;
revoke all on function public.research_monitor_claim(bigint,date,text) from public,anon,authenticated;
revoke all on function public.research_monitor_finish(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.research_monitor_claim(bigint,date,text) to service_role;
grant execute on function public.research_monitor_finish(uuid,uuid,jsonb,text) to service_role;
commit;
