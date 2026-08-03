/**
 * 저자 표기에서 작가만 골라냅니다.
 *
 * `book.author`는 알라딘 원문 그대로입니다 (기획서 §4):
 * `"홍길동 (지은이), 김철수 (옮긴이)"` 꼴. 밑줄 카드의 출처에는 옮긴이·그림·감수
 * 같은 부가 역할을 빼고 지은 사람만 보입니다 (시안: "책제목 · 작가").
 *
 * 원문은 `book`에 그대로 두고 **표시할 때만** 골라냅니다 — 책 상세의 서지 정보는
 * 전체 크레딧을 원문으로 씁니다. 파싱하지 않고 원문을 저장하라는 §4 방침과
 * 어긋나지 않습니다.
 */

// 지은 사람으로 볼 역할. 이 역할이 붙은 이름만 남깁니다.
// (옮긴이·그림·사진·감수·엮은이 등은 여기 없어 자연히 빠집니다.)
const AUTHOR_ROLES = ["지은이", "지음", "글", "저자", "원작"];

export function authorName(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const segments = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const authors: string[] = [];
  for (const seg of segments) {
    // "이름 (역할)" 꼴. 괄호가 없으면 역할 표시가 없는 것으로 보고 이름으로 씁니다.
    const match = seg.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    if (!match) {
      authors.push(seg);
      continue;
    }
    const [, name, role] = match;
    if (AUTHOR_ROLES.some((r) => role.includes(r))) authors.push(name.trim());
  }

  // 지은이 역할이 하나도 안 잡히면(예: 전부 옮긴이) 첫 이름을 역할만 떼고 씁니다.
  if (authors.length === 0) {
    const first = segments[0]?.replace(/\s*\([^)]*\)\s*$/, "").trim();
    return first || null;
  }

  return authors.join(", ");
}
