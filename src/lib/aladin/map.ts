import type { AladinItem } from "./client";

/**
 * 알라딘 응답 → book 행 (기획서 §7 매핑표).
 *
 * 표에 있는 것만 옮깁니다. 가공하지 않습니다 —
 *
 * - `author`는 파싱하지 않습니다. "홍길동 (지은이), 김철수 (옮긴이)" 원문 그대로입니다
 * - `sizeWidth` / `sizeHeight`도 손대지 않습니다. 알라딘이 가로·세로를 뒤바꿔 주는
 *   책이 실제로 있지만(같은 문고본이 128x188인 것도 188x128인 것도 있습니다)
 *   여기는 알라딘이 준 사실을 적는 자리입니다. 보정은 화면 쪽 문제입니다
 * - 전체 응답은 `raw`에 통째로 들어갑니다
 *
 * `cover_path` · `cover_is_large` · `accent_color`는 여기서 채우지 않습니다.
 * 표지를 Storage로 복사한 뒤에 정해지는 값입니다 (`src/lib/cover.ts`).
 */
export type BookInsert = {
  aladin_item_id: string;
  isbn13: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  published_at: string | null;
  description: string | null;
  cover_url: string | null;
  page_count: number | null;
  size_width: number | null;
  size_height: number | null;
  size_depth: number | null;
  weight: number | null;
  style_desc: string | null;
  raw: AladinItem;
};

/** 빈 문자열을 null로. 알라딘은 없는 값을 ""로 주는 자리가 많습니다. */
function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** 0과 빈 문자열을 null로. 쪽수 0, 무게 0은 "없음"입니다. */
function int(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

/**
 * pubDate → date. 알라딘은 "2014-05-19"로 주지만 결측이거나 형태가 다른 책이
 * 있어 그런 값은 버립니다. published_at은 nullable입니다.
 */
function date(value: unknown): string | null {
  const raw = text(value);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

export function toBookInsert(item: AladinItem): BookInsert {
  const packing = item.subInfo?.packing;

  return {
    aladin_item_id: String(item.itemId),
    isbn13: text(item.isbn13),
    title: item.title,
    author: text(item.author),
    publisher: text(item.publisher),
    published_at: date(item.pubDate),
    description: text(item.description),
    cover_url: text(item.cover),
    page_count: int(item.subInfo?.itemPage),
    size_width: int(packing?.sizeWidth),
    size_height: int(packing?.sizeHeight),
    size_depth: int(packing?.sizeDepth),
    weight: int(packing?.weight),
    style_desc: text(packing?.styleDesc),
    raw: item,
  };
}
