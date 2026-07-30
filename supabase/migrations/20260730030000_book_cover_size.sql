-- book에 표지 이미지의 픽셀 크기 (기획서 §4 · §5)
--
-- 두 가지에 씁니다.
--
-- 1. **§5 표지 격자.** "폭은 이미지 실제 비율로 계산합니다"가 이미 이미지 비율을
--    요구합니다. 브라우저가 이미지를 받은 뒤에 재면 레이아웃이 흔들립니다.
--
-- 2. **판형 가로·세로 판정.** 알라딘의 sizeWidth / sizeHeight는 뒤바뀐 채 오는
--    책이 있습니다 (표본 18권 중 5권). 세로로 긴 문고본이 "가로 178 × 세로 110"
--    으로 옵니다. 어느 값이 세로인지는 표지 이미지의 방향으로 판정합니다 —
--    이미지가 세로형이면 판형의 큰 값이 세로입니다.
--    진짜 가로형 책은 이미지도 가로형이라 그대로 남습니다.
--
-- 알라딘이 준 판형은 손대지 않습니다. size_width / size_height는 계속 원본이고,
-- 보정은 화면에서 합니다 (src/lib/books/dimensions.ts).
--
-- 표지를 못 받은 책은 둘 다 null입니다. cover_path와 같은 사정입니다.

alter table public.book
  add column if not exists cover_width  int,   -- 표지 이미지 가로 px
  add column if not exists cover_height int;   -- 표지 이미지 세로 px
