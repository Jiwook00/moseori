/**
 * 서재의 상태 4종 (기획서 §4 · §5).
 *
 * 탭 순서가 이 배열의 순서입니다. 워딩은 §3 그대로 — 임의로 바꾸지 않습니다.
 */

export const STATUSES = [
  { value: "wishlist", label: "읽고 싶음" },
  { value: "reading", label: "읽는 중" },
  { value: "finished", label: "읽음" },
  { value: "set_aside", label: "덮어둠" },
] as const;

export type ShelfStatus = (typeof STATUSES)[number]["value"];

/** 책장에 처음 들어왔을 때 열려 있는 탭. */
export const DEFAULT_STATUS: ShelfStatus = "reading";

export const STATUS_LABELS: Record<ShelfStatus, string> = Object.fromEntries(
  STATUSES.map(({ value, label }) => [value, label]),
) as Record<ShelfStatus, string>;

export function isShelfStatus(value: unknown): value is ShelfStatus {
  return STATUSES.some((status) => status.value === value);
}
