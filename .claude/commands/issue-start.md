Start working on a GitHub issue. Usage: /issue-start <issue-number>

## Steps

1. **이슈 정보 가져오기**

   Run:

   ```
   gh issue view $ARGUMENTS --json number,title,body,labels,comments
   ```

   이슈가 없으면 "이슈 #$ARGUMENTS 를 찾을 수 없습니다." 라고 알리고 중단.
   본문에서 참조하는 다른 이슈(#N)가 있으면 그것도 훑어본다.

2. **기준 브랜치 확인**

   ```
   git branch --show-current
   git status --short
   ```

   - 커밋 안 된 변경이 있으면 알리고 어떻게 할지 묻는다
   - 현재 브랜치가 `main`이 아니면:

     > 지금 `<현재 브랜치>`에 있습니다. `main`으로 옮겨 pull한 뒤 브랜치를 만들까요? (y / 여기서 만들기 / cancel)

   - `y` → `git checkout main && git pull`

3. **브랜치명 제안**

   라벨 기반으로 prefix 결정:
   - `type: bug` → `fix/`
   - `type: feature` → `feat/`
   - `type: chore` → `chore/`
   - 그 외 → `feat/`

   이슈 제목을 영어 소문자 + 하이픈으로 변환 (짧게, 최대 5단어):

   ```
   fix/issue-8-mobile-input-zoom
   feat/issue-11-add-book-flow
   ```

   > 이 브랜치명으로 생성할까요? (y / 직접 입력 / cancel)

4. **브랜치 생성**

   ```
   git checkout -b <branch-name>
   ```

5. **문서 읽고 계획 보여주기**

   코드를 쓰기 전에 `docs/기획서.md`, `docs/design.md`, `docs/progress.md`를 읽고 이슈와 관련된 부분을 짚는다. 그다음 보여줄 것:

   - 이슈 요약 (배경 · 할 일)
   - **정할 것** — 이슈에 적힌 것 + 문서를 읽고 새로 보인 것. 각각 선택지와 추천
   - 기획서 §2 "안 하는 것"이나 `design.md` "하지 말 것"에 걸리는 게 있으면 명시
   - 작업 계획 (순서, 건드릴 파일)

   정할 것에 대한 답을 받기 전에는 구현을 시작하지 않는다.
