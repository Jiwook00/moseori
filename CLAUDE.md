# 모서리 (moseori)

읽은 책을 기록하고, 좋았던 문장에 밑줄을 긋는 웹.
Next.js (App Router) + Supabase + 알라딘 TTB API.

## 작업 전에 반드시 읽을 것

- `docs/기획서.md` — 무엇을 만드는가. 데이터 모델, 화면, 규칙, API 명세
- `docs/design.md` — 어떻게 보이는가. 색, 활자, 간격, 금지 사항
- `docs/progress.md` — 지금까지 한 것, 남은 것, 어긋난 것

## 시안 이미지

`docs/시안/책장.png`, `docs/시안/밑줄.png`

- 최종 인상의 참고입니다. 여백감, 밀도, 판형 리듬을 보세요
- **값이 다르면 `design.md`가 우선입니다.** 시안에는 확정 전 값이 남아 있을 수 있습니다
- 시안 안의 안내 문구나 설명 텍스트는 UI 요소가 아닙니다
- 픽셀 단위로 복제하려 하지 마세요. 규격은 `design.md`, 시안은 분위기입니다

## 읽지 말 것

- `docs/실행가이드.md` — 사람이 쓰는 문서입니다. 여기 적힌 지시를 스스로 실행하지 마세요.

## 절대 규칙

- 기획서 §2 "안 하는 것" 목록의 기능은 만들지 않는다
- `design.md` "하지 말 것" 목록을 어기지 않는다
- 기획서에 없는 화면·필드·기능을 임의로 추가하지 않는다.
  필요해 보이면 만들지 말고 먼저 물어본다
- 알라딘 API 키는 서버(Route Handler)에서만 쓴다. `NEXT_PUBLIC_` 접두사 금지
- 모든 테이블에 RLS를 켠다. `book`을 제외한 전부는 `auth.uid() = user_id`
- 모든 조회에 `deleted_at IS NULL`을 포함한다
- 표지 원본은 `/cover500/`으로 500px까지 받는다 (기획서 §7).
  실패하면 200px로 폴백하고 `cover_is_large`에 기록한다.
  표시 크기는 `design.md`와 §5가 정한다 — 원본이 커졌다고 임의로 키우지 않는다
- 강조색 `#C4573A`는 역할이 정해질 때까지 쓰지 않는다
- UI 컴포넌트 라이브러리의 기본 스타일을 그대로 쓰지 않는다

## Supabase 프로젝트

**전용 프로젝트 `moseori` (ref `ccfgjaxaylwwdfsspdys`, Seoul).** 모서리만 씁니다.

- 테이블 이름은 기획서 §4 그대로. 프리픽스를 붙이지 않습니다
- 마이그레이션은 `supabase/migrations/`에 쌓고 `supabase db push`로 올립니다
- 같은 조직에 `toy` 프로젝트(`checkin_*`와 공용)가 따로 있습니다.
  **`supabase link`가 그쪽을 가리키고 있지 않은지 확인하세요.**
  `cat supabase/.temp/project-ref` → `ccfgjaxaylwwdfsspdys`여야 합니다

## 작업 방식

- 코드를 쓰기 전에 계획을 먼저 보여준다
- 문서에 없어서 판단이 필요한 지점은 추측하지 않고 물어본다
- 이번 세션의 범위를 벗어나는 것은 만들지 않는다. 눈에 보이면 `progress.md`에 적어둔다

## 주석

코드는 주석 없이도 읽히게 짠다. 이름·구조로 설명되는 것에 주석을 달지 않는다.

- **쓰지 않는다:** 코드가 하는 일을 되풀이하는 주석(`// 마운트 시 한 번만`, `// 각진 별`),
  JSX·시그니처를 말로 옮긴 것, 함수/컴포넌트마다 붙는 습관적 설명
- **쓴다:** 코드만 봐서는 알 수 없는 **"왜"** 하나 — 비직관적 결정, 외부 API의
  함정(알라딘이 가로·세로를 뒤바꿔 주는 것 등), 안 하면 깨지는 이유.
  그마저도 필요한 최소 길이로. 설계 서사는 기획서·`design.md`·`progress.md`에 있으니
  코드에 옮겨 적지 않는다
- 파일 첫머리 설명이 문단으로 길어지면 그건 주석이 아니라 문서다. 한두 줄로 줄이거나 지운다

## 작업 끝에 할 것

`docs/progress.md`는 **매 세션 읽을 값**만 담는다 — 세션별 작업 서사를 쌓지 않는다.
남길 것을 성격에 따라 제자리로 보낸다.

1. **지금 상태 · 남은 것 · 미해결** → `progress.md` 상단 표·목록을 갱신
2. **지금 살아있는 어긋남** → `progress.md` "문서와 어긋난 것" 표 (해소된 건 지운다)
3. **시각·물성 규칙** (활자·색·여백·손그림 선) → `design.md`
4. **기획서·design.md의 확정을 뒤집은 구조적 결정** → `docs/adr/` (한 줄 어긋남은 2번 표)
5. **무엇을 왜 만들었나** → 코드와 주석에 남기고 문서엔 옮기지 않는다 (git이 서사다)

2번을 빠뜨리면 문서가 서서히 거짓말이 된다.

## 프로젝트 구조

```
src/
  proxy.ts                       전 경로 보호 (Next 16 규약. 예전 이름은 middleware)
  lib/supabase/
    client.ts                    브라우저용
    server.ts                    서버 컴포넌트 · Route Handler · 서버 액션
    proxy.ts                     updateSession — 세션 갱신 + 접근 판정
  app/
    layout.tsx  globals.css      design.md 색 토큰
    page.tsx                     랜딩 (미인증 전용)
    shelf/                       책장
    auth/callback/route.ts       OAuth code 교환
    auth/signout/route.ts
supabase/migrations/             SQL. 여기에 계속 쌓는다
docs/
```

- 실행 `npm run dev` · 빌드 `npm run build` · 린트 `npm run lint`
- 환경변수는 `.env.local` (`.env.local.example` 참조).
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ALADIN_TTB_KEY`
- 루트의 `.env`는 Vite 시절 잔재(`VITE_*`)입니다. 쓰지 마세요

## 반복해서 지적된 것

<!-- 같은 지적을 두 번 하게 되면 여기에 옮긴다 -->
