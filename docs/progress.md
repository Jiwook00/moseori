# progress

## 2026-07-30 · 세션 1 — 스켈레톤과 인증

### 이번에 한 것

**프로젝트 스캐폴딩**

- Next 16.2.12 (App Router) / React 19.2 / TypeScript / Tailwind v4 / ESLint, `src/` 구조
- `@supabase/supabase-js` 2.111, `@supabase/ssr` 0.12
- `create-next-app` 기본 잔여물 제거: Geist 폰트, 다크 모드 CSS, `public/*.svg`, favicon,
  생성된 `CLAUDE.md`·`AGENTS.md`(프로젝트 것과 충돌하므로 아예 가져오지 않음)
- `.gitignore`에 `next-env.d.ts`, `*.tsbuildinfo`, `supabase/.temp` 추가

**색 토큰** — `src/app/globals.css`

design.md §색의 6개만 Tailwind `@theme`에 심었습니다:
`paper` `card` `ink` `sub` `line` `underline`.
강조색 `#C4573A`는 역할이 정해지지 않았으므로 **넣지 않았습니다.**
다크 모드는 두지 않았습니다 — 종이는 한 색입니다.
활자(MaruBuri / IBM Plex Sans KR) 서빙은 이번 범위 밖.

**인증**

| 파일                             | 역할                                      |
| -------------------------------- | ----------------------------------------- |
| `src/lib/supabase/client.ts`     | 브라우저 클라이언트                       |
| `src/lib/supabase/server.ts`     | 서버 컴포넌트 · Route Handler · 서버 액션 |
| `src/lib/supabase/proxy.ts`      | `updateSession` — 세션 갱신 + 접근 판정   |
| `src/proxy.ts`                   | 전 경로 매처                              |
| `src/app/auth/callback/route.ts` | OAuth code → 세션 교환 후 `/shelf`        |
| `src/app/auth/signout/route.ts`  | 로그아웃 POST                             |

- 공개 경로는 `/`, `/auth/*`, 정적 파일뿐. 나머지는 전부 보호됩니다
- 로그인 상태로 `/`에 오면 `/shelf`로 (기획서 §5)
- 세션 판정은 `getClaims()`. `getSession()`은 서버에서 신뢰하지 않습니다

**화면**

- `/` 랜딩 (§5) — 구조와 문구만. 디자인은 다음 세션
- `/shelf` — 이메일과 로그아웃 버튼만 있는 플레이스홀더

**DB** — `supabase/migrations/20260730000000_profile.sql`

`profile` 테이블 + RLS(본인 select/update만) + `handle_new_user()` 가입 트리거.
`security definer` + `search_path = ''`.

**검증**

`npm run build` 통과. dev 서버에 curl로 확인:

- `/` 미인증 → 200
- `/shelf`, `/underlines` 미인증 → 307 → `/`
- `/auth/callback` code 없음 → 307 → `/?error=auth`

실제 구글 로그인은 세션 1-c에서 확인했습니다. 통과.

---

### 판단이 필요했던 지점

**1. `.env`에 Vite 시절 키가 남아 있었음**

`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`가 있었습니다. 기획서 §9는
`NEXT_PUBLIC_*`을 지정하므로, 같은 값을 `NEXT_PUBLIC_*` 이름으로 `.env.local`에
새로 썼습니다. `.env`는 건드리지 않았습니다 — 정리하거나 지우는 건 사람이 판단할 일.
`.env.local.example`도 함께 뒀습니다.

**2. `middleware` 대신 `proxy`**

Next 16이 `middleware` 파일 규약을 deprecate하고 `proxy`로 이름을 바꿨습니다
(빌드에 경고가 떴습니다). API는 같습니다. 새 이름을 따랐습니다.
Supabase 공식 문서는 아직 `middleware`로 적혀 있으니, 문서를 참고할 때 헷갈리지 마세요.

**3. 랜딩 문구**

기획서 §3의 워딩 원칙(종이책을 다루는 손)에 맞춰 초안을 썼습니다.
전부 `src/app/page.tsx` 한 파일 안에 있으니 고치기 쉽습니다.

> 읽은 책을 기록하고, 좋았던 문장에 밑줄을 긋습니다.
> 접어둔 페이지 모서리에서. 쪽수와 그때의 생각까지 같이 남깁니다.
> [구글로 시작하기] · 가입 절차는 없습니다.

**4. `profile`에 insert / delete 정책을 두지 않음**

행을 만드는 건 트리거뿐이고, 삭제는 `auth.users` cascade로 일어납니다.
정책을 열어둘 이유가 없어 닫아뒀습니다.

**5. `/auth/callback`의 `next` 파라미터 검증**

`/`로 시작하고 `//`로 시작하지 않는 경로만 허용합니다. 오픈 리다이렉트 방지.

---

### 기획서 · design.md와 어긋난 부분

**없습니다.** 다만 유보한 것이 둘:

- 랜딩의 활자·간격은 design.md 규격을 따르지 않은 **임시값**입니다
  (Tailwind 기본 스케일 위에 얹혀 있습니다). 다음 세션에서 §타이포그래피와
  §레이아웃(720px / 28px)으로 다시 짜야 합니다
- `/shelf` 플레이스홀더도 마찬가지로 디자인 이전 상태입니다

---

### 남은 것

**바로 다음에 해야 할 것 (사람 손이 필요)**

1. **마이그레이션을 실제 Supabase에 적용.** 아직 안 돌렸습니다 (DB 비밀번호 필요)
2. **구글 로그인 실제 왕복 확인.** Supabase Auth의 Redirect URL에
   `http://localhost:3000/auth/callback`이 등록돼 있어야 합니다
3. 로그인 후 `moseori_profile` 행이 실제로 생기는지 확인

**다음 세션 (데이터 모델)**

- `moseori_book` / `moseori_shelf_item` / `moseori_review` / `moseori_passage` /
  `moseori_passage_comment` 테이블과 RLS
- 마이그레이션은 `supabase/migrations/`에 계속 쌓습니다

**그 다음**

- 폰트 서빙 (MaruBuri, IBM Plex Sans KR — `font-display: swap`, 직접 서빙)
- design.md 규격에 맞춘 상단 네비와 레이아웃 셸
- 알라딘 TTB 키 발급 및 §7 검증 3항목

**눈에 띄었지만 이번 범위가 아니라 두고 온 것**

- `npm audit`에 high 12건. 전부 `eslint` 하위 `brace-expansion` 계열 **개발 의존성**이고
  런타임에 실리지 않습니다. `--force`는 eslint 10 메이저 업그레이드라 지금 하지 않았습니다
- `/settings`의 개인정보처리방침 링크 (§5) — 배포 전에 필요

---

## 2026-07-30 · 세션 1-b — Supabase 연결과 마이그레이션 적용

### 결론부터

**모서리 전용 Supabase 프로젝트 `moseori` (ref `ccfgjaxaylwwdfsspdys`, Seoul)를
새로 만들어 거기에 붙였습니다.** 마이그레이션 적용까지 끝났습니다.

처음에는 공용 프로젝트 `toy`(checkin과 공유)에 얹으려 했는데,
아래 이유로 전용 프로젝트로 갈라섰습니다.

### 공용 프로젝트를 접은 이유

**1. `supabase db push`가 아예 막힙니다**

`supabase_migrations.schema_migrations`가 프로젝트 단위로 공유됩니다.
원격에 checkin 마이그레이션 19개가 있고 로컬에 없으니 push가 거부했습니다.
CLI가 제안하는 해법은 이것인데,

```
supabase migration repair --status reverted 20260224000000 ... (19개)
```

**checkin의 이력 19개를 전부 "되돌림"으로 표시하는 명령입니다. 돌리면 안 됩니다.**
우회하려면 checkin 마이그레이션 19개를 빈 파일로 이 저장소에 복제해야 하는데,
저장소가 거짓말을 하게 됩니다.

> 세션 중에 "이력이 섞여도 실무상 문제없다"고 적었는데, 틀렸습니다.
> `db push`가 실제로 거부합니다.

**2. `auth.users` 트리거 이름이 전역입니다**

첫 마이그레이션에 `drop trigger if exists on_auth_user_created on auth.users`가
있었습니다. `on_auth_user_created`는 **Supabase 공식 문서의 예제 이름**이라
checkin도 같은 이름을 쓸 가능성이 높습니다. 그대로 돌렸으면 checkin의 가입 트리거가
조용히 사라졌을 겁니다.

**3. 리전**

`toy`는 South Asia (Mumbai)라 기획서 §9(Seoul)와 어긋났습니다.
새 프로젝트는 Seoul이라 이 어긋남도 사라졌습니다.

**4. 기존 사용자에게 트리거가 안 걸림**

`auth.users`가 공유되면 checkin으로 먼저 가입한 사람은 이미 행이 있어서
`insert` 트리거가 발동하지 않습니다. 백필 루프가 따로 필요했습니다.
전용 프로젝트에서는 이 문제가 없어 백필을 걷어냈습니다.

### 이번에 한 것

- `supabase link --project-ref ccfgjaxaylwwdfsspdys`
- `.env.local`을 새 프로젝트 값으로 교체.
  키는 **publishable key(`sb_publishable_...`)**를 씁니다.
  레거시 anon JWT도 아직 오지만 새 프로젝트라 새 방식을 택했습니다.
  환경변수 이름은 기획서 §9대로 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 유지
- `supabase/migrations/20260730000000_profile.sql` 적용 완료 (`db push`)
- `CLAUDE.md`에 "Supabase 프로젝트" 절 추가.
  **`toy`를 실수로 가리키지 않도록 확인 방법을 적어뒀습니다**
- 잠깐 넣었던 `moseori_` 프리픽스는 전부 걷어냈습니다.
  전용 프로젝트가 되었으니 기획서 §4의 이름을 그대로 씁니다

### 검증

- `db push` 성공. `profile` 테이블 생성됨
- 익명 키로 `GET /rest/v1/profile` → `200 []`.
  테이블은 있고 RLS가 익명에게 아무것도 주지 않습니다 (정책이 `to authenticated`)
- publishable key로 `/auth/v1/settings` 200

### 기획서와 어긋난 부분

**없습니다.** `toy`를 쓸 때 생겼던 어긋남(테이블 이름 프리픽스, Mumbai 리전)은
전용 프로젝트로 옮기면서 전부 사라졌습니다.

### 막혀 있는 것

**새 프로젝트에는 구글 provider가 꺼져 있습니다** (`/auth/v1/settings`로 확인:
`google: false`). checkin에서 쓰던 설정은 `toy` 프로젝트의 것이라 따라오지 않습니다.
이것부터 켜야 로그인이 됩니다. 절차는 아래 "남은 것" 참조.

### 남은 것 (사람 손이 필요)

**1. 구글 provider 켜기** — 새 프로젝트 대시보드 → Authentication → Sign In / Providers → Google

Google Cloud Console의 OAuth 클라이언트는 checkin 것을 **재사용해도 됩니다.**
대신 그 클라이언트의 Authorized redirect URIs에 새 프로젝트 콜백을 추가해야 합니다.

```
https://ccfgjaxaylwwdfsspdys.supabase.co/auth/v1/callback
```

**2. Redirect URL 허용목록** — Authentication → URL Configuration

```
http://localhost:3000/**
```

배포하면 그때 Vercel 도메인을 추가합니다.
Site URL은 전용 프로젝트라 모서리가 자유롭게 씁니다.

**3. 실제 로그인 왕복 확인** — `npm run dev` 후 `/`에서 로그인 →
`/shelf`로 떨어지는지, `profile` 행이 생기는지

---

## 2026-07-30 · 세션 1-c — 구글 OAuth 설정 검증

새 프로젝트에 구글 provider를 켜고 client ID를 넣었으나 **값이 잘려 있었습니다.**

### 확인 방법 (다음에도 쓸 것)

Supabase가 실제로 들고 있는 값은 authorize 엔드포인트를 리다이렉트 없이 찍으면 보입니다.

```
GET {SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=...
→ 302 Location에 client_id, redirect_uri, scope가 그대로 들어 있음
```

그 URL을 리다이렉트 따라가며 열면 구글이 판정해줍니다.

| 값                                               | 구글 응답                                    |
| ------------------------------------------------ | -------------------------------------------- |
| `m13on7...apps.googleusercontent.com`            | Error 401 · invalid_client · 클라이언트 없음 |
| `1974351245-m13on7...apps.googleusercontent.com` | 정상. 로그인 화면으로 진행                   |

구글 client ID는 항상 `프로젝트번호-무작위문자.apps.googleusercontent.com`입니다.
앞의 숫자가 빠지면 존재하지 않는 클라이언트가 됩니다.

### 덤으로 확인된 것

전체 값으로 요청했을 때 `redirect_uri_mismatch`가 나지 않았습니다.
→ Google Cloud Console의 Authorized redirect URI
(`https://ccfgjaxaylwwdfsspdys.supabase.co/auth/v1/callback`)는 이미 올바릅니다.

### 조치와 결과 — **세션 1 인증 작업 완료**

Client ID를 전체 값으로 교체하고 로컬에서 실제 로그인까지 마쳤습니다.

- `authorize`의 `client_id`가 `1974351245-`로 시작하는 것 확인
- `auth.users` 1행 — `jwkim775@gmail.com`, provider `google`
- `profile` 1행 — `display_name` "김지욱", `avatar_url` 있음,
  `created_at` 2026-07-30 08:10:44Z

**가입 트리거가 실제로 동작합니다.** `raw_user_meta_data`의 `full_name` /
`avatar_url` 매핑도 구글 응답과 맞습니다 (coalesce 폴백까지 갈 일 없었음).

이로써 세션 1의 미검증 항목이 전부 닫혔습니다.
`/` → 구글 로그인 → `/shelf` → `profile` 생성까지 한 번에 통과.

### 검증에 쓴 방법 (기록)

- 익명 키로는 RLS 때문에 `profile`이 안 보입니다 (`200 []`가 정상)
- 확인하려면 service_role 키가 필요합니다.
  **주의: `supabase projects api-keys`는 새 `sb_secret_...` 키를 마스킹해서 줍니다.**
  값이 필요하면 레거시 `service_role` JWT를 쓰거나 대시보드에서 복사하세요
