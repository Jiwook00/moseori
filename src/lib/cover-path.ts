/**
 * 표지 버킷 이름과 공개 URL. **클라이언트에서 import해도 안전합니다** —
 * 실제 표지 처리(sharp, 알라딘 왕복)는 `cover.ts`에 있고 그쪽은 서버 전용입니다.
 */

/** 마이그레이션 20260730020000_cover_storage.sql에서 만든 공개 버킷. */
export const COVER_BUCKET = "cover";

/**
 * book.cover_path → 공개 URL.
 *
 * cover_path에는 버킷 안 경로만 들어 있습니다 (`{aladin_item_id}.jpg`).
 * 버킷이 public이라 서명이 필요 없습니다.
 */
export function coverPublicUrl(coverPath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${COVER_BUCKET}/${coverPath}`;
}
