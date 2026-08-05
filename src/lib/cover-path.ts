/**
 * 표지 버킷 이름과 공개 URL. 클라이언트에서 import해도 안전합니다 —
 * 실제 표지 처리(sharp, 알라딘 왕복)는 서버 전용인 `cover.ts`에 있습니다.
 */

export const COVER_BUCKET = "cover";

/** book.cover_path(버킷 안 경로) → 공개 URL. 버킷이 public이라 서명이 필요 없습니다. */
export function coverPublicUrl(coverPath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${COVER_BUCKET}/${coverPath}`;
}
