-- book에 알라딘 책 소개 (기획서 §4 · §7 매핑표)
--
-- 상세 화면에 짧은 책 소개(한두 문단)를 보여줍니다. 알라딘 ItemLookUp 응답의
-- `description`은 이미 raw(jsonb)에 통째로 들어와 있었지만, 조회할 때마다 무거운
-- raw를 끌고 다니지 않으려고 컬럼으로 승격합니다. §7 매핑표에도 추가했습니다.
--
-- 알라딘은 없는 값을 ""로 주는 자리가 많아 백필에서 빈 문자열은 null로 만듭니다
-- (src/lib/aladin/map.ts의 text()와 같은 규칙). 표지·판형처럼 nullable입니다.

alter table public.book
  add column if not exists description text;

update public.book
  set description = nullif(btrim(raw->>'description'), '')
  where description is null;
