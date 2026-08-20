# 모서리 (moseori)

읽은 책을 기록하고, 좋았던 문장에 밑줄을 긋는 웹.
Next.js (App Router) + Supabase + 알라딘 TTB API.

문서는 `docs/`에 있습니다 — 기획서, 디자인 규격, 진행 상황.

## 개발

```bash
npm run dev     # 개발 서버
npm run build   # 빌드
npm run lint    # 린트
```

환경변수는 `.env.local` (`.env.local.example` 참조).

## 단축키

앱 안에 진입점은 없고, 로그인 후 `/shortcuts`로 직접 들어가면 단축키 도움말이 나옵니다.

- `⌘K` / `Ctrl+K` — 책 검색 열기
- `⌘↵` / `Ctrl+↵` — 저장 (밑줄·문장·생각·리뷰·코멘트)
- 밑줄 입력 중 문장 마지막 줄에서 `↓` → 쪽수 칸, 쪽수 칸에서 `↑` → 문장
