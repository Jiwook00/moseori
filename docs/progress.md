# progress

## 지금 상태 (2026-07-30)

| 영역      | 상태                                                      |
| --------- | --------------------------------------------------------- |
| 스캐폴딩  | Next 16.2.12 / React 19.2 / TS / Tailwind v4, `src/` 구조 |
| 인증      | 구글 OAuth 실제 왕복 통과. 가입 트리거 동작 확인          |
| DB        | 기획서 §4 테이블 6개 + RLS 전부 적용·검증 완료            |
| 화면      | `/` 랜딩과 `/shelf` 플레이스홀더뿐. **디자인 이전 상태**  |
| 알라딘 §7 | 시작 안 함. TTB 키도 아직                                 |

Supabase 전용 프로젝트 `moseori` (`ccfgjaxaylwwdfsspdys`, Seoul).
마이그레이션 2개 적용됨 — `20260730000000_profile`, `20260730010000_core_schema`.

---

## 남은 것

**다음 세션 후보**

1. **알라딘 TTB 키 발급 + §7 검증 3항목** — 이게 없으면 `book`을 채울 수 없습니다
2. **design.md 규격 적용** — 폰트 서빙(MaruBuri, IBM Plex Sans KR, 직접 서빙 ·
   `font-display: swap`), 720px / 28px 레이아웃 셸, 상단 네비.
   랜딩과 `/shelf`의 현재 활자·간격은 Tailwind 기본 스케일 위의 **임시값**입니다
3. 화면 전부 (§5)

**두고 온 것**

- `npm audit` high 12건. 전부 `eslint` 하위 `brace-expansion` 계열 **개발 의존성**이라
  런타임에 안 실립니다. `--force`는 eslint 10 메이저 업그레이드
- `/settings`의 개인정보처리방침 링크 (§5) — 배포 전에 필요
- 루트 `.env`의 Vite 잔재(`VITE_*`). 지우는 건 사람이 판단할 일이라 두었습니다
- 강조색 `#C4573A`는 여전히 미사용 (§10에서 역할 미정)

---

## 알아두면 시간 아끼는 것들

**`middleware`가 아니라 `proxy`.** Next 16이 `middleware` 파일 규약을 deprecate하고
이름을 바꿨습니다. API는 같습니다. Supabase 공식 문서는 아직 `middleware`로 적혀 있으니
문서를 볼 때 헷갈리지 마세요.

**세션 판정은 `getClaims()`.** `getSession()`은 서버에서 신뢰하지 않습니다.

**anon 키는 publishable key(`sb_publishable_...`)를 씁니다.**
환경변수 이름은 기획서 §9대로 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 유지.

**익명 키로 테이블을 조회하면 `200 []`가 정상입니다.** 정책이 전부
`to authenticated`라 RLS가 아무것도 주지 않습니다. 행을 눈으로 보려면
service_role 키가 필요한데, `supabase projects api-keys`는 새 `sb_secret_...`을
마스킹해서 줍니다 — 레거시 `service_role` JWT를 쓰거나 대시보드에서 복사하세요.

**Supabase가 실제로 들고 있는 OAuth 값 확인법.**

```
GET {SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=...
→ 302 Location에 client_id, redirect_uri, scope가 그대로 들어 있음
```

세션 1-c에서 구글 client ID가 앞부분(`1974351245-`)이 잘린 채 저장돼 있어
`invalid_client`가 났습니다. 구글 client ID는 항상
`프로젝트번호-무작위문자.apps.googleusercontent.com` 형태입니다.

**`toy` 프로젝트를 가리키고 있지 않은지 확인.**
`cat supabase/.temp/project-ref` → `ccfgjaxaylwwdfsspdys`

---

## 세션 1 · 1-b · 1-c — 스켈레톤과 인증 (요약)

`create-next-app` 잔여물(Geist 폰트, 다크 모드 CSS, `public/*.svg`, 생성된
`CLAUDE.md`·`AGENTS.md`)을 걷어내고, design.md §색의 6개 토큰만
`globals.css`의 Tailwind `@theme`에 심었습니다. 다크 모드는 두지 않았습니다 —
종이는 한 색입니다.

인증은 `src/lib/supabase/{client,server,proxy}.ts` + `src/proxy.ts` +
`auth/callback` · `auth/signout`. 공개 경로는 `/`, `/auth/*`, 정적 파일뿐이고
나머지는 전부 보호됩니다. 로그인 상태로 `/`에 오면 `/shelf`로 (§5).
`/auth/callback`의 `next` 파라미터는 `/`로 시작하고 `//`로 시작하지 않는 것만
허용합니다 (오픈 리다이렉트 방지).

`profile` 테이블 + 본인 select/update 정책 + `handle_new_user()` 가입 트리거
(`security definer`, `search_path = ''`). insert/delete 정책은 두지 않았습니다 —
행을 만드는 건 트리거뿐이고 삭제는 `auth.users` cascade로 일어납니다.

### 공용 프로젝트 `toy`를 접고 전용 프로젝트로 간 이유

기록해 둡니다. 같은 판단을 다시 할 일이 있을 수 있습니다.

1. **`db push`가 아예 막힙니다.** `supabase_migrations.schema_migrations`가
   프로젝트 단위로 공유되는데, 원격에 checkin 이력 19개가 있고 로컬엔 없습니다.
   CLI가 제안하는 `migration repair --status reverted`는 checkin 이력을 전부
   "되돌림"으로 표시하는 명령이라 돌리면 안 됩니다
2. **`auth.users` 트리거 이름이 전역입니다.** `on_auth_user_created`는 Supabase
   공식 문서 예제 이름이라 checkin도 쓸 가능성이 높고, `drop trigger if exists`가
   남의 가입 트리거를 조용히 지웠을 겁니다
3. **리전.** `toy`는 Mumbai라 기획서 §9(Seoul)와 어긋났습니다
4. **기존 사용자에게 트리거가 안 걸립니다.** `auth.users`가 공유되면 checkin으로
   먼저 가입한 사람은 이미 행이 있어 `insert` 트리거가 발동하지 않습니다

전용 프로젝트로 옮기면서 잠깐 넣었던 `moseori_` 프리픽스도 전부 걷어냈고,
리전 어긋남과 백필 코드도 함께 사라졌습니다.

### 검증 결과

`npm run build` 통과. 미인증 `/` 200 / `/shelf`·`/underlines` 307 → `/` /
`/auth/callback` code 없음 307 → `/?error=auth`.
실제 구글 로그인 후 `auth.users` 1행, `profile` 1행("김지욱", `avatar_url` 있음).
`raw_user_meta_data`의 `full_name` / `avatar_url` 매핑이 구글 응답과 맞습니다
(coalesce 폴백까지 갈 일 없었음).

### 기획서·design.md와 어긋난 부분

**없습니다.** 다만 랜딩과 `/shelf`의 활자·간격은 design.md 규격 이전의
임시값입니다 (위 "남은 것" 2번).

---

## 세션 2 — 데이터 모델과 RLS

기획서 §4를 SQL로 옮겼습니다. 화면·API는 이번 범위가 아닙니다.

### 이번에 한 것

`supabase/migrations/20260730010000_core_schema.sql` 하나. **적용 완료.**

- 테이블 5개: `book` `shelf_item` `review` `passage` `passage_comment`
- UNIQUE 세 개: `book.aladin_item_id`, `shelf_item(user_id, book_id)`,
  `review(shelf_item_id)` — 마지막은 부분 인덱스 (아래 1번)
- CHECK: `shelf_item.status` 4값, `shelf_item.rating` 1~5
- RLS 전 테이블 enable + §4 표대로 정책
- `pgroonga` 3.2.5 enable (`extensions` 스키마). **인덱스는 만들지 않음** (§8)

### 적용 후 원격 DB 대조 — 통과

Management API의 query 엔드포인트로 직접 조회했습니다
(`supabase db dump`는 도커가 필요해 못 씁니다).

- **테이블 6개, 컬럼 §4와 일치.** book 19 / shelf_item 10 / review 7 /
  passage 8 / passage_comment 6 / profile 4. 이름·타입·순서 전부.
  §4에 없는 컬럼 0개
- **UNIQUE 3개 확인.** `review` 쪽은 `pg_constraint`가 아니라 `pg_indexes`에
  잡힙니다 (부분 인덱스라서). 제약을 찾을 때 헷갈리지 마세요
- **RLS 6개 테이블 전부 `relrowsecurity = true`.** 정책은 `book` 3 / `profile` 2 /
  나머지 4개씩. `anon`에 열린 정책 없음
- `passage_shelf_item_idx`를 `(shelf_item_id, page nulls last, created_at)`으로
  썼는데 Postgres가 `(shelf_item_id, page, created_at)`로 정규화했습니다.
  btree ASC 기본이 이미 NULLS LAST라 동작은 동일합니다

아직 안 한 검증: **실제 로그인 세션 두 개로 남의 `shelf_item`이 안 보이는지.**
정책 정의는 맞지만 런타임 확인은 데이터가 생긴 뒤에 하는 게 맞습니다.

### 판단이 필요했던 지점

**1. `review`의 UNIQUE와 soft delete가 충돌합니다.**
§4 표는 `shelf_item_id`에 UNIQUE를 걸라고 하는데 `review`는 soft delete입니다.
컬럼 제약으로 걸면 지운 리뷰가 자리를 차지해 같은 책에 다시 못 씁니다.
→ **부분 UNIQUE 인덱스** (`where deleted_at is null`).
실제로 지키려는 규칙은 "살아있는 리뷰가 책당 하나"입니다.

**2. `book`의 NOT NULL 범위.**
§4 표는 nullable만 표시하는데 `cover_path`·`accent_color`는 알라딘 응답 직후에
값이 없습니다. → `aladin_item_id` / `title` / `created_at`만 NOT NULL, 나머지는
전부 nullable. §10의 판형 결측률 우려와도 맞습니다.

**3. `review.updated_at` 갱신 주체.**
§6이 상태 전이를 "트리거가 아니라 애플리케이션 레이어에서" 처리한다고 정했으므로
같은 방침. DB 트리거 없이 `default now()`만 두고 앱이 갱신합니다.

**4. FK 삭제 동작 (§4에 없음).**
모든 `user_id` → `auth.users` cascade / `shelf_item.book_id` → `book`
**restrict**(공용 마스터라 남의 기록이 참조 중일 수 있음) /
`review`·`passage`의 `shelf_item_id` → cascade (§4: `shelf_item`은 hard delete) /
`passage_comment.passage_id` → cascade.

**5. `book`의 delete 정책을 만들지 않았습니다.**
§4 표에 read / insert / update만 있습니다. RLS가 켜져 있으므로
정책 없음 = 아무도 못 지움. 의도한 결과입니다.

**6. 인덱스는 최소한만.**
§4 정렬 규칙(`page NULLS LAST, created_at`)과 §6 오늘의 밑줄
(`last_shown_at` 오래된 것 우선)에 맞춘 것뿐. pgroonga 인덱스는 §8대로 없습니다.

### 기획서·design.md와 어긋난 부분

- **`review`의 UNIQUE를 컬럼 제약이 아니라 부분 인덱스로 걸었습니다.**
  §4 표의 "FK, **UNIQUE**" 표기와 형태가 다릅니다. 위 1번의 이유입니다.
  §4를 고칠지는 판단 보류 — 고친다면 "살아있는 리뷰 기준 UNIQUE"로.
- 그 외 컬럼·타입·정책은 §4 그대로입니다. 추가한 필드 없음.
