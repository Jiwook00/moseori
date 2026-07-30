-- 기획서 §4 데이터 모델 — book / shelf_item / review / passage / passage_comment
--
-- profile은 20260730000000_profile.sql에 이미 있습니다.
-- 화면도 API도 이 마이그레이션의 범위가 아닙니다.

-- ---------------------------------------------------------------------------
-- 확장
-- ---------------------------------------------------------------------------

-- 한국어 전문검색용 (§8). 지금은 켜두기만 합니다.
-- 개인 규모에서는 ILIKE로 충분하고, 느려지면 인덱스만 나중에 붙이면 됩니다.
-- 인덱스라서 추가해도 마이그레이션이 아닙니다. 여기서 만들지 않습니다.
create extension if not exists pgroonga with schema extensions;

-- ---------------------------------------------------------------------------
-- book — 공용 마스터
-- ---------------------------------------------------------------------------
--
-- 알라딘에서 받아온 사실 정보. 사용자별이 아니라 전역 공유입니다.
-- NOT NULL은 aladin_item_id / title / created_at만 겁니다.
-- 표지 경로와 대표색은 알라딘 응답 직후에는 비어 있고 나중에 채워집니다.
-- 판형·무게는 결측이 많을 것으로 보고 있습니다 (§10).

create table if not exists public.book (
  id               uuid primary key default gen_random_uuid(),
  aladin_item_id   text not null unique,          -- 실질적 자연키
  isbn13           text,                          -- 독립출판·절판 대비
  title            text not null,
  author           text,                          -- "홍길동 (지은이), 김철수 (옮긴이)" 원문 그대로
  publisher        text,
  published_at     date,
  cover_url        text,                          -- 알라딘 원본 URL
  cover_path       text,                          -- Supabase Storage 경로
  cover_is_large   boolean,                       -- 큰 이미지 확보 여부 (§7)
  accent_color     text,                          -- 표지에서 추출한 대표색
  page_count       int,
  size_width       int,                           -- 가로 mm
  size_height      int,                           -- 세로 mm
  size_depth       int,                           -- 두께 mm
  weight           int,                           -- 그램
  style_desc       text,                          -- 양장본·반양장본 등
  raw              jsonb,                         -- 알라딘 응답 원본
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- shelf_item — 서재의 한 권
-- ---------------------------------------------------------------------------
--
-- user와 book 사이의 조인 엔티티. 내 기록은 전부 이 아래로 모입니다.
-- soft delete 없이 hard delete입니다 (§4 공통 규칙).
--
-- book_id는 restrict입니다. book은 공용 마스터라 다른 사용자가 참조하고 있을 수
-- 있고, 어차피 지울 일이 없습니다.

create table if not exists public.shelf_item (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  book_id           uuid not null references public.book (id) on delete restrict,
  status            text not null
                      check (status in ('wishlist', 'reading', 'finished', 'set_aside')),
  status_changed_at timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz,
  archived_at       timestamptz,                  -- 상태와 직교하는 축
  rating            int check (rating between 1 and 5),
  created_at        timestamptz not null default now(),
  unique (user_id, book_id)
);

-- 책장은 항상 내 것만 봅니다.
create index if not exists shelf_item_user_idx
  on public.shelf_item (user_id, created_at desc);

create index if not exists shelf_item_book_idx
  on public.shelf_item (book_id);

-- ---------------------------------------------------------------------------
-- review — 책당 하나
-- ---------------------------------------------------------------------------
--
-- UNIQUE(shelf_item_id)는 부분 인덱스로 겁니다. review는 soft delete이므로
-- 컬럼 제약으로 걸면 지운 리뷰가 자리를 차지해 같은 책에 다시 쓸 수 없습니다.
-- "살아있는 리뷰는 책당 하나"가 실제로 지키려는 규칙입니다.
--
-- updated_at은 애플리케이션 레이어에서 갱신합니다. §6이 상태 전이를 트리거가
-- 아니라 앱에서 처리하기로 정했고, 같은 방침을 따릅니다.

create table if not exists public.review (
  id            uuid primary key default gen_random_uuid(),
  shelf_item_id uuid not null references public.shelf_item (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  body          text not null,                    -- 마크다운 서브셋 (§6)
  created_at    timestamptz not null default now(),  -- 처음 쓴 날
  updated_at    timestamptz not null default now(),  -- 마지막으로 고친 날
  deleted_at    timestamptz
);

create unique index if not exists review_shelf_item_uniq
  on public.review (shelf_item_id)
  where deleted_at is null;

create index if not exists review_user_idx
  on public.review (user_id)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- passage — 밑줄
-- ---------------------------------------------------------------------------

create table if not exists public.passage (
  id            uuid primary key default gen_random_uuid(),
  shelf_item_id uuid not null references public.shelf_item (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  body          text not null,                    -- 원문 그대로. 서식 없음
  page          int,
  last_shown_at timestamptz,                      -- 오늘의 밑줄용 (§6)
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- 책 상세의 밑줄 정렬: page NULLS LAST, created_at (§4)
create index if not exists passage_shelf_item_idx
  on public.passage (shelf_item_id, page nulls last, created_at)
  where deleted_at is null;

-- 오늘의 밑줄: 내 밑줄 중 오래 안 본 것부터 (§6)
create index if not exists passage_user_last_shown_idx
  on public.passage (user_id, last_shown_at nulls first)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- passage_comment — 밑줄에 단 생각
-- ---------------------------------------------------------------------------
--
-- 한 문장에 여러 개. 시간순으로 쌓입니다.
-- user_id는 passage를 타고 가면 알 수 있지만, RLS 정책을 다른 테이블과
-- 같은 모양(auth.uid() = user_id)으로 유지하려고 둡니다.

create table if not exists public.passage_comment (
  id          uuid primary key default gen_random_uuid(),
  passage_id  uuid not null references public.passage (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  body        text not null,                      -- 평문
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists passage_comment_passage_idx
  on public.passage_comment (passage_id, created_at)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- RLS — 전부 켭니다 (§4)
-- ---------------------------------------------------------------------------
--
-- 다중 사용자이므로 정책 하나가 잘못되면 남의 리뷰가 보입니다.
-- auth.uid()를 (select ...)로 감싸는 건 행마다 재평가되지 않게 하는 Supabase 권장 형태입니다.

alter table public.book            enable row level security;
alter table public.shelf_item      enable row level security;
alter table public.review          enable row level security;
alter table public.passage         enable row level security;
alter table public.passage_comment enable row level security;

-- book — 로그인 사용자 전체 read / insert / update.
-- delete 정책은 두지 않습니다. §4 표에 없고, 공용 마스터를 개인이 지울 이유가 없습니다.

drop policy if exists "book_select_authenticated" on public.book;
create policy "book_select_authenticated"
  on public.book for select
  to authenticated
  using (true);

drop policy if exists "book_insert_authenticated" on public.book;
create policy "book_insert_authenticated"
  on public.book for insert
  to authenticated
  with check (true);

drop policy if exists "book_update_authenticated" on public.book;
create policy "book_update_authenticated"
  on public.book for update
  to authenticated
  using (true)
  with check (true);

-- shelf_item — auth.uid() = user_id

drop policy if exists "shelf_item_select_own" on public.shelf_item;
create policy "shelf_item_select_own"
  on public.shelf_item for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "shelf_item_insert_own" on public.shelf_item;
create policy "shelf_item_insert_own"
  on public.shelf_item for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "shelf_item_update_own" on public.shelf_item;
create policy "shelf_item_update_own"
  on public.shelf_item for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "shelf_item_delete_own" on public.shelf_item;
create policy "shelf_item_delete_own"
  on public.shelf_item for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- review — auth.uid() = user_id
-- delete 정책도 둡니다. soft delete는 update로 이뤄지지만, 실수로 지운 기록을
-- SQL로 되살리는 것과 별개로 하드 삭제 경로를 막아둘 이유는 없습니다.

drop policy if exists "review_select_own" on public.review;
create policy "review_select_own"
  on public.review for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "review_insert_own" on public.review;
create policy "review_insert_own"
  on public.review for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "review_update_own" on public.review;
create policy "review_update_own"
  on public.review for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "review_delete_own" on public.review;
create policy "review_delete_own"
  on public.review for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- passage — auth.uid() = user_id

drop policy if exists "passage_select_own" on public.passage;
create policy "passage_select_own"
  on public.passage for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "passage_insert_own" on public.passage;
create policy "passage_insert_own"
  on public.passage for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "passage_update_own" on public.passage;
create policy "passage_update_own"
  on public.passage for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "passage_delete_own" on public.passage;
create policy "passage_delete_own"
  on public.passage for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- passage_comment — auth.uid() = user_id

drop policy if exists "passage_comment_select_own" on public.passage_comment;
create policy "passage_comment_select_own"
  on public.passage_comment for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "passage_comment_insert_own" on public.passage_comment;
create policy "passage_comment_insert_own"
  on public.passage_comment for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "passage_comment_update_own" on public.passage_comment;
create policy "passage_comment_update_own"
  on public.passage_comment for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "passage_comment_delete_own" on public.passage_comment;
create policy "passage_comment_delete_own"
  on public.passage_comment for delete
  to authenticated
  using ((select auth.uid()) = user_id);
