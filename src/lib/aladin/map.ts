import type { AladinItem } from "./client";

/**
 * 알라딘 응답 → book 행 (기획서 §7 매핑표). 가공하지 않고 준 사실 그대로 적습니다 —
 * author 파싱도, size 보정(알라딘은 가로·세로를 뒤바꿔 주기도 함)도 화면 쪽 일입니다.
 * cover_path·cover_is_large·accent_color는 표지를 복사한 뒤 정해집니다 (`cover.ts`).
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

/** pubDate → date. 결측이거나 "YYYY-MM-DD" 꼴이 아니면 버립니다 (nullable). */
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
