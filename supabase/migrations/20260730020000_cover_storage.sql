-- 표지 Storage 버킷 (기획서 §7)
--
-- "표지 URL을 그대로 들고 있지 마세요. 몇 년 뒤 깨집니다."
-- 책을 담을 때 알라딘 이미지를 여기로 복사하고 book.cover_path에 경로를 적습니다.
--
-- 공개 버킷입니다. 표지는 알라딘의 공개 상품 이미지라 개인정보가 아니고,
-- 책장 한 화면에 수십 장이 깔리므로 서명 URL을 매번 발급하면 왕복만 늘어납니다.
--
-- cover_path에는 버킷 이름을 넣지 않습니다. 버킷 안 경로만 넣습니다
-- (`{aladin_item_id}.jpg`). 버킷 이름은 코드 상수 한 곳에만 있습니다.

insert into storage.buckets (id, name, public)
values ('cover', 'cover', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 정책
-- ---------------------------------------------------------------------------
--
-- read는 전체 공개(public 버킷이므로 정책과 무관하게 열리지만, 명시해 둡니다).
-- insert / update는 로그인 사용자. book 테이블의 정책과 같은 모양입니다 —
-- book이 공용 마스터이므로 표지도 공용입니다.
--
-- delete 정책은 두지 않습니다. book에 delete 정책이 없는 것과 같은 이유입니다.

drop policy if exists "cover_read_all" on storage.objects;
create policy "cover_read_all"
  on storage.objects for select
  using (bucket_id = 'cover');

drop policy if exists "cover_insert_authenticated" on storage.objects;
create policy "cover_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cover');

drop policy if exists "cover_update_authenticated" on storage.objects;
create policy "cover_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cover')
  with check (bucket_id = 'cover');
