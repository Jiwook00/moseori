-- 기획서 §4 profile
--
-- auth.users를 직접 조인하지 않기 위한 표준 패턴. 가입 시 트리거로 생성합니다.

create table if not exists public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- RLS는 전부 켭니다 (기획서 §4). profile은 본인 read / update.
alter table public.profile enable row level security;

drop policy if exists "profile_select_own" on public.profile;
create policy "profile_select_own"
  on public.profile for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profile_update_own" on public.profile;
create policy "profile_update_own"
  on public.profile for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- insert 정책은 두지 않습니다. 행을 만드는 건 아래 트리거뿐입니다.
-- delete 정책도 두지 않습니다. 계정 삭제 시 auth.users의 cascade로 지워집니다.

-- security definer + search_path = '' 는 Supabase 권장 형태입니다.
-- 이 함수는 RLS를 우회하므로 스키마를 명시하지 않으면 위험합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
