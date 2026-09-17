-- book의 자연키를 aladin_item_id에서 isbn13으로 (docs/adr/0004)
--
-- 알라딘 TTB API가 종료되어 카카오 책 검색으로 옮깁니다. 카카오는 상품 id를 주지 않아
-- ISBN13이 유일한 식별자입니다. ISBN13이 없는 책은 검색 결과에서 뺍니다.
--
-- aladin_item_id는 지우지 않습니다. 알라딘 시절 책의 raw·cover_path가 이 값에 기대고 있습니다.
-- 적용 시점 원격 book 22행 전부 isbn13이 있고 중복이 없었습니다.

alter table public.book
  alter column aladin_item_id drop not null,
  alter column isbn13 set not null;

alter table public.book
  add constraint book_isbn13_key unique (isbn13);
