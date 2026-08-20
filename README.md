# 모서리 (moseori)

읽은 책을 기록하고, 좋았던 문장에 밑줄을 긋는 웹.

책장에 읽은 책을 꽂고, 문장을 옮겨 적어 밑줄을 긋고, 거기에 생각을 덧붙입니다.

## 스택

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind v4
- **Supabase** — 인증(구글 OAuth) · Postgres(RLS) · Storage(표지)
- **알라딘 TTB API** — 책 검색·담기·표지·대표색

## 화면

| 경로          | 무엇                                    |
| ------------- | --------------------------------------- |
| `/`           | 랜딩 (미인증 전용)                      |
| `/shelf`      | 책장 — 상태별 표지 갤러리               |
| `/shelf/[id]` | 책 상세 — 밑줄·리뷰·별점                |
| `/underlines` | 밑줄 모아보기 (읽기 전용)               |
| `/shortcuts`  | 단축키 도움말 (앱 안 진입점 없음, 임시) |

## 개발

```bash
npm run dev     # 개발 서버
npm run build   # 빌드
npm run lint    # 린트
```

환경변수는 `.env.local` (`.env.local.example` 참조) —
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALADIN_TTB_KEY`.

## 단축키

- `⌘K` / `Ctrl+K` — 책 검색 열기
- `⌘↵` / `Ctrl+↵` — 저장 (밑줄·문장·생각·리뷰·코멘트)
- 밑줄 입력 중 문장 마지막 줄에서 `↓` → 쪽수 칸, 쪽수 칸에서 `↑` → 문장

## 문서

- `docs/기획서.md` — 무엇을 만드는가 (데이터 모델·화면·규칙·API 명세)
- `docs/design.md` — 어떻게 보이는가 (색·활자·간격)
- `docs/progress.md` — 지금까지 한 것, 남은 것, 문서와 어긋난 것
