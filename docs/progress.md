# progress

## 지금 상태 (2026-07-30)

| 영역      | 상태                                                           |
| --------- | -------------------------------------------------------------- |
| 스캐폴딩  | Next 16.2.12 / React 19.2 / TS / Tailwind v4, `src/` 구조      |
| 인증      | 구글 OAuth 실제 왕복 통과. 가입 트리거 동작 확인               |
| DB        | 기획서 §4 테이블 6개 + RLS 전부 적용·검증 완료                 |
| 화면      | `/` 랜딩 · `/shelf` · `/shelf/[id]` 스텁. **디자인 이전 상태** |
| 알라딘 §7 | 검색·담기·표지 복사·대표색 **실제 왕복 통과**. 검증 항목 완료  |
| 판형      | 알라딘의 가로·세로 뒤바뀜 보정까지 구현 (§5 규칙)              |

Supabase 전용 프로젝트 `moseori` (`ccfgjaxaylwwdfsspdys`, Seoul).
마이그레이션 4개 적용됨 — `20260730000000_profile`, `20260730010000_core_schema`,
`20260730020000_cover_storage`, `20260730030000_book_cover_size`.

원격 데이터는 `book` 5행(표지·대표색 전부 채워짐) + 본인 서재 1권.
검증용 계정은 만들었다가 지웠습니다.

---

## 남은 것

**다음 세션 후보**

1. **design.md 규격 적용** — 폰트 서빙(MaruBuri, IBM Plex Sans KR, 직접 서빙 ·
   `font-display: swap`), 720px / 28px 레이아웃 셸, 상단 네비.
   랜딩·`/shelf`·`/shelf/[id]`의 현재 활자·간격은 Tailwind 기본 스케일 위의 **임시값**입니다
2. **검색 오버레이** (§5) — 화면을 덮고, 커서가 들어가 있고, 세 번의 탭.
   지금 `/shelf`에 있는 `search-panel.tsx`는 API를 눈으로 보려고 만든 임시 UI입니다
3. **책 상세** (§5 전체) — 상태와 별점 → 리뷰 → 밑줄 목록 → 밑줄 추가.
   지금은 사실 정보만 찍는 스텁입니다
4. **책장 표지 격자** (§5) — 판형 보정과 표지 픽셀 크기는 준비돼 있습니다
   (`src/lib/books/dimensions.ts`, `book.cover_width` / `cover_height`).
   **표시 크기(148px 셀 / 176px 슬롯)는 다시 정할 수 있습니다** — 200px 천장
   아래에서 나온 값인데 이제 원본이 500px입니다

**두고 온 것**

- **별점 묻기 (§6)를 담기에 붙이지 않았습니다.** `finished`로 담으면 지금은 조용히
  저장만 됩니다. §6의 "finished로 바뀌면 별점을 묻는다"는 상태 변경 UI와 같이
  만들 일이라 책 상세 세션으로 넘겼습니다
- **`style_desc`에 `"미확인"`이 그대로 들어갑니다.** 알라딘이 주는 값입니다.
  화면에 그대로 쓸지는 판형 표시를 만들 때 판단하세요
- **표지를 다시 받아오는 기능을 만들면 경로에 버전을 붙여야 합니다.**
  공개 버킷은 CDN이 캐시하므로 같은 경로에 덮어써도 잠시 옛 파일이 나옵니다
  (아래 "알아두면 시간 아끼는 것들"). 표지는 한 번 쓰고 안 바꾸니 지금은 문제가 아닙니다
- **RLS 런타임 검증이 아직 남았습니다** (세션 2에서 미룬 것). 정책 정의는 맞지만
  로그인 세션 두 개로 남의 `shelf_item`이 안 보이는지는 아직 안 봤습니다.
  이제 데이터가 있으니 확인할 수 있습니다 — 계정 두 개 만드는 방법은 아래
  "알아두면 시간 아끼는 것들"에 있습니다
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
service*role 키가 필요한데, `supabase projects api-keys`는 새 `sb_secret*...`을
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

**로그인이 필요한 경로를 스크립트로 검증하는 법.** 구글 OAuth는 스크립트로 못
돌리지만, 검증용 계정을 만들면 됩니다. 세션 3에서 API 전체를 이렇게 확인했습니다.

```
1. service_role로 계정 생성   POST /auth/v1/admin/users  {email, password, email_confirm:true}
2. 비밀번호로 로그인          POST /auth/v1/token?grant_type=password   → access_token
3. 쿠키로 만들어 curl에 붙임  sb-<project-ref>-auth-token=base64-<base64(세션 JSON)>
4. 끝나면 계정 삭제           DELETE /auth/v1/admin/users/<id>
```

`shelf_item`·`profile`은 `auth.users` cascade로 같이 사라지고 `book`은 남습니다
(공용 마스터라서 정상입니다). **`UID`를 셸 변수 이름으로 쓰지 마세요** — zsh 예약
변수라 대입이 실패합니다.

**공개 버킷은 CDN이 캐시합니다.** 같은 경로에 파일을 덮어써도 공개 URL이 한동안
옛 파일을 줍니다. 세션 3에서 이걸 모르고 버그로 착각했습니다. 실제 내용을 보려면
인증 경로(`/storage/v1/object/cover/...` + service_role)나 쿼리스트링으로 캐시를
피하세요.

**Next 16 `dev`는 데몬으로 뜹니다.** 실행한 명령이 먼저 끝나고 서버는 남습니다.
두 번 실행하면 `Another next dev server is already running`과 함께 PID를 알려줍니다.
로그는 `.next/dev/logs/next-development.log` (브라우저 콘솔 경고까지 들어옵니다).

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

---

## 세션 3 — 알라딘 연동과 책 담기

기획서 §7 전체와 §5의 판형 판정. UI는 API를 눈으로 확인하는 최소한만
만들었습니다 — 디자인은 다음 세션입니다.

### 이번에 한 것

**마이그레이션 2개. 둘 다 적용 완료.**

- `20260730020000_cover_storage` — 공개 버킷 `cover` + `storage.objects` 정책 3개
  (전체 read / 인증 insert · update). `book`의 정책과 같은 모양입니다 — 표지도
  공용 마스터라서. delete 정책은 없습니다
- `20260730030000_book_cover_size` — `book.cover_width` / `cover_height`

**서버 라이브러리** (전부 서버 전용. 키와 sharp가 여기 있습니다)

| 파일                       | 하는 일                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `lib/aladin/client.ts`     | `ALADIN_TTB_KEY`를 읽는 **유일한** 곳. 검색은 4시간 캐시   |
| `lib/aladin/map.ts`        | §7 매핑표. 빈 문자열·0을 null로 접는 것 외에 가공 없음     |
| `lib/cover.ts`             | cover500 시도 → 픽셀 검사 → 폴백, 대표색 추출              |
| `lib/cover-path.ts`        | 버킷 이름과 공개 URL. 클라이언트에서 써도 안전한 쪽만 분리 |
| `lib/books/ensure-book.ts` | `aladin_item_id` 기준 book 확보 + 표지 부착                |
| `lib/books/dimensions.ts`  | `bookSize()` — 판형 가로·세로 보정 (아래 10번)             |

**Route Handler 2개**

- `GET /api/search?q=` — 결과마다 `shelfItemId`를 붙여 "이미 서재에 있어요"(§5)를
  판단할 수 있게 합니다. 내 서재 대조는 조회 한 번
- `POST /api/shelf` `{ aladinItemId, status }` — ensureBook → 중복 확인 →
  `shelf_item` insert. `reading`이면 `started_at`, `finished`면 `finished_at` (§6)

**화면(임시)** `shelf/search-panel.tsx`, `shelf/[id]/page.tsx` 스텁.
`next.config.ts`에 표지 호스트 2개(`image.aladin.co.kr`, Supabase Storage).

### §7 검증 항목 — 끝났습니다

1. **`OptResult=packing`은 별도 협의 없이 됩니다.** 표본 18권에서 판형 결측 **0건**.
   §10의 "판형 결측률" 우려는 최소한 유통 중인 책에서는 기우였습니다
   (절판·독립출판은 아직 표본 없음)
2. **검색 응답에 `itemId`가 옵니다.** `isbn13`·`cover`도 함께
3. **`/coverbig/`는 404입니다. `/cover500/`이 500×713px를 줍니다** (18/18 성공)

덧붙여, **엔드포인트가 `https://`로 응답합니다.** §7의 mixed content 이야기는
낡은 정보였습니다. 키 때문에 서버 경유는 여전히 필요합니다.

### 판단이 필요했던 지점

**1. 큰 표지 — `/coverbig/`가 아니라 `/cover500/`.** (물어보고 진행)
알라딘이 주는 URL은 `/cover200/`이고 이걸 `/cover500/`으로 바꾸면 500×713px가
옵니다. CLAUDE.md 절대 규칙 "표지 원본은 200px가 최대"와 부딪히므로 물어봤고,
**원본은 500px로 저장하되 표시 크기는 design.md 그대로**로 정했습니다.

**2. 200을 받았다고 큰 이미지인 게 아닙니다.**
오래된 책에는 `/cover500/`에 **원본보다 작은** 파일이 있습니다 — 『이해선 사진집』
(592934)의 cover500은 150×155이고 cover200은 200×207입니다. 바이트 수로는 안
걸러집니다(10KB로 멀쩡함). → **실제 픽셀 너비를 보고 300px 미만이면 폴백**합니다.
처음엔 놓쳐서 150px 이미지를 `cover_is_large = true`로 저장했습니다.

**3. 대표색은 색조만 표지에서 가져옵니다.**
24×24로 줄여 채널당 4비트로 뭉갠 뒤, 흰 여백(L>95%)과 검은 글자(L<8%)를 뺀 최다
덩어리를 고릅니다(채도 가중). §3이 명도와 채도를 강제하므로 실제로 고르는 건
색조뿐입니다. 그 이상 정교해질 이유가 없습니다.

**4. §3 정규화 범위를 1%씩 안으로 넣었습니다.** 16진수로 저장하면 채널이 8비트로
뭉개지는데, 명도 90% 근처에서는 채널 차이가 6~~7밖에 안 돼 반올림 한 번에 채도가
2%p씩 튑니다. 88~~91 / 15~~30을 그대로 쓰면 **저장된 색을 다시 재봤을 때** 규칙을
벗어납니다(18권 중 5권). → 88.5~~90.5 / 16~29로 클램프.

**5. 검색 캐시는 테이블이 아니라 Next Data Cache입니다.**
URL이 그대로 캐시 키라서 §7의 "몇 시간 캐시"에 테이블이 필요하지 않습니다.
검색어는 trim·공백축약·소문자로 정규화해 적중률을 올립니다.

**6. 이미 있는 `book`의 사실 정보는 다시 쓰지 않습니다.**
알라딘 응답이 바뀔 이유가 거의 없고, 남이 담아둔 행을 매번 덮어쓰면 write만
늘어납니다. 예외는 표지입니다 — `cover_path`나 `cover_width`가 비어 있으면
이번에 채웁니다 (`needsCover`).

**7. 표지 실패가 담기를 실패시키지 않습니다.** `cover_path`·`accent_color`는 §4에서
nullable입니다. 비어 있으면 다음에 이 책을 담는 사람이 다시 시도합니다.

**8. 이미 서재에 있는 책은 상태를 덮어쓰지 않습니다.** 담기는 새로 담는 동작이고,
상태 변경은 책 상세에서 하는 일입니다. `{ shelfItemId, alreadyInShelf: true }`.

**9. 동시 삽입.** 두 사람이 같은 책을 같은 순간에 담으면 `book`의 UNIQUE가 터집니다.
`23505`면 그 행을 다시 읽어 씁니다.

**10. 판형 가로·세로가 뒤바뀐 채 옵니다.** 표본 18권 중 **5권**.

| 책                     | 알라딘 판형 | 표지 이미지 |
| ---------------------- | ----------- | ----------- |
| 소설을 살다 (문고본)   | 178 × 110   | 200×324     |
| 대적기도 (문고본)      | 174 × 118   | 200×300     |
| 미디어의 이해 (문고본) | 188 × 128   | 200×292     |
| 브랜드 디자인          | 210 × 150   | 200×280     |
| 윤미네 집              | 193 × 153   | 200×279     |

가로로 긴 책이 실재하는 것은 문제가 아닙니다 — **그건 그대로 보여주는 게
맞습니다.** 문제는 알라딘이 **어느 값이 세로인지**를 틀리게 준다는 것입니다.
『소설을 살다』는 세로로 긴 문고본인데 "가로 178 × 세로 110"으로 옵니다.
§5의 `높이 = size_height × 0.7`을 그대로 쓰면 높이가 77px이 되어 실제 책보다
납작해집니다. 있는 그대로가 아니라 **틀리게** 보이는 쪽입니다.

→ **규칙: 표지 이미지의 방향을 심판으로 씁니다.** 이미지가 세로형이면 판형의 큰
값이 세로, 가로형이면 작은 값이 세로. 진짜 가로형 책은 이미지도 가로형이라 그대로
남고 잘못된 값만 바로잡힙니다. 정사각형에 가까운 책(±4%)은 손대지 않습니다.
**기획서 §5에 규칙으로 적었습니다.** 매핑은 원문 그대로 저장하고
(`size_width`/`size_height`는 계속 알라딘의 값), 보정은 화면에서만 합니다.
심판이 되는 `cover_width` / `cover_height`는 §5의 "폭은 이미지 실제 비율로
계산합니다"에도 어차피 필요한 값이라 컬럼으로 넣었습니다 (물어보고 진행).

**11. 검색 결과 표지는 `next/image`를 쓰지 않습니다.** 아직 담지 않은 책은 표지의
실제 픽셀을 모르는데 `next/image`는 `width`·`height`를 요구합니다. 아무 값이나
적으면 비율이 틀려 개발 콘솔에 경고가 쌓입니다(실제로 쌓였습니다). 담긴 뒤에는
크기를 알고 있으니 `/shelf/[id]`는 `next/image`로 실제 비율을 씁니다.

### 검증 결과

`npm run lint` · `npm run build` 통과. 검증용 계정 두 개를 만들어 실제 세션으로
담아보고 **둘 다 지웠습니다** — `shelf_item`과 `profile`은 cascade로 사라졌고
`book`은 공용 마스터라 남겨두었습니다. **본인 계정과 서재 1권은 그대로입니다.**

- **`book` 5행.** 쪽수·판형·무게·판형설명 전부 §7 매핑표대로. `cover_width` /
  `cover_height` 5/5 채워짐
- Storage 오브젝트 5개, 익명 공개 URL 200. `40869703` 500×713 ·
  `33197912` 500×703 · `184147470` 500×809 (large=true) /
  `592934` 200×207 (large=false — 위 2번)
- `accent_color` 전부 §3 범위 안. 표본 18권 전수 검사에서도 18/18
- `reading` → `started_at`만, `finished` → `finished_at`만 (§6)
- 같은 책 재요청 → 200 `alreadyInShelf: true`, 상태 안 바뀜.
  잘못된 status → 400. 없는 itemId → 502
- 표지를 비우고 다시 담으면 표지만 채워집니다 (위 6번)
- **판형 보정 표본 18권 재검증: 보정 5건 / 그대로 13건.** 어긋났던 5권만 정확히
  바로잡히고 나머지는 손대지 않았습니다. 셀 높이가 문고본 122~~132px,
  신국판 144~~156px, 사진집 180~207px로 벌어집니다 — §5가 원한 들쭉날쭉함입니다
- 경계 사례: 판형 없음 → 152×225 / 표지 없음 → 알라딘 그대로 /
  **진짜 가로형(이미지도 가로형) → 가로형 유지** / 정사각형 → 그대로
- 실제 왕복으로 『소설을 살다』를 담아 상세 페이지가 `110 × 178mm (보정)`으로
  표시되는 것까지 확인했습니다

**표지 픽셀 크기 백필 1건.** 마이그레이션 전에 브라우저에서 직접 담긴
『달리기를 말할 때 내가 하고 싶은 이야기』가 `cover_width`가 비어 있어서,
Storage의 표지를 읽어 500×714로 채웠습니다.

**미인증 `/api/*`는 401이 아니라 307입니다.** `proxy.ts`가 전 경로를 보호하므로
라우트의 401 분기까지 오지 않습니다. 그대로 두었습니다 — 브라우저에서는 이게 맞습니다.

### 기획서·design.md와 어긋난 부분

**표지 500px 때문에 문서 네 곳을 고쳤습니다** (승인받고).

- 기획서 §7 "표지 — 200px가 천장입니다" → "500px를 받을 수 있습니다".
  검증 항목도 결과로 교체
- CLAUDE.md 절대 규칙
- design.md 원칙 2 — **원칙("표지는 주인공이 아닙니다")은 남기고 근거만** 고쳤습니다.
  주인공이 문장이라는 건 픽셀 사정과 무관한 결정이라서입니다
- **§5의 148px 셀 / 176px 슬롯은 건드리지 않았습니다.** 200px 천장 아래에서 나온
  값이라 다시 정할 수 있지만 시안과 같이 볼 일입니다. 격자 자체가 아직 없고,
  스텁의 124px도 임시값입니다

그 외:

- **`book`에 컬럼 두 개 추가** — `cover_width` / `cover_height`. §4 표에 없던
  필드라 물어보고 넣었고 §4 표와 §5 규칙도 함께 고쳤습니다 (위 10번)
- **§3 정규화 범위를 1%씩 좁혔습니다** (88.5~~90.5 / 16~~29). 위 4번의 이유입니다.
  의도(저장된 색이 88~~91 / 15~~30 안에 있을 것)는 지켰습니다
- `/shelf/[id]`를 §5 구성 없이 스텁으로 만들었습니다. 담은 뒤 갈 곳이 필요해서입니다
- 새 의존성 `sharp` 하나. 기획서 §9 스택에 없지만 대표색 추출과 픽셀 검사에 필요합니다
- `style_desc`에 알라딘이 주는 `"미확인"`이 그대로 들어갑니다 (위 "두고 온 것")
