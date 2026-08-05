import type { SupabaseClient } from "@supabase/supabase-js";
import { lookUpBook } from "@/lib/aladin/client";
import { toBookInsert } from "@/lib/aladin/map";
import { COVER_BUCKET } from "@/lib/cover-path";
import { extensionFor, extractAccentColor, fetchCover } from "@/lib/cover";

/**
 * `book`은 공용 마스터입니다 (기획서 §4). aladin_item_id 기준으로 한 번만 저장하고
 * 모든 사용자가 같은 행을 봅니다. 서버 전용입니다 (알라딘 키 · sharp).
 */

/** Postgres unique violation. 같은 책을 두 사람이 동시에 담을 때 납니다. */
const UNIQUE_VIOLATION = "23505";

/**
 * 표지를 Storage로 복사하고 대표색을 뽑아 book에 채웁니다 (기획서 §7).
 * 실패해도 던지지 않습니다 — 표지가 없다고 담기를 막지 않고, 다음에 담는 사람이 다시 시도합니다.
 */
async function attachCover(
  supabase: SupabaseClient,
  book: { id: string; aladin_item_id: string; cover_url: string | null },
) {
  if (!book.cover_url) return;

  try {
    const fetched = await fetchCover(book.cover_url);
    if (!fetched) return;

    const extension = extensionFor(fetched.contentType);
    if (!extension) return;

    const path = `${book.aladin_item_id}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, new Blob([fetched.bytes], { type: fetched.contentType }), {
        contentType: fetched.contentType,
        upsert: true,
      });
    if (uploadError) return;

    await supabase
      .from("book")
      .update({
        cover_path: path,
        cover_is_large: fetched.isLarge,
        // 격자 폭 계산과 판형 가로·세로 판정에 씁니다 (dimensions.ts).
        cover_width: fetched.width,
        cover_height: fetched.height,
        accent_color: await extractAccentColor(fetched.bytes),
      })
      .eq("id", book.id);
  } catch {
    // 표지는 있으면 좋은 것입니다. 담기를 막지 않습니다.
  }
}

type BookRow = {
  id: string;
  aladin_item_id: string;
  cover_url: string | null;
  cover_path: string | null;
  cover_width: number | null;
};

const BOOK_COLUMNS = "id, aladin_item_id, cover_url, cover_path, cover_width";

/** 표지를 채워야 하는가. cover_path는 지난번 실패, cover_width는 픽셀 크기 저장 전 책. */
function needsCover(book: BookRow) {
  return !book.cover_path || !book.cover_width;
}

async function findBook(supabase: SupabaseClient, aladinItemId: string) {
  const { data } = await supabase
    .from("book")
    .select(BOOK_COLUMNS)
    .eq("aladin_item_id", aladinItemId)
    .maybeSingle<BookRow>();
  return data;
}

/**
 * `aladin_item_id`로 book을 찾고, 없으면 알라딘에서 받아와 만듭니다.
 * 이미 있으면 사실 정보는 다시 쓰지 않고 표지만 비어 있을 때 채웁니다 (needsCover).
 */
export async function ensureBook(
  supabase: SupabaseClient,
  aladinItemId: string,
): Promise<string> {
  const existing = await findBook(supabase, aladinItemId);
  if (existing) {
    if (needsCover(existing)) await attachCover(supabase, existing);
    return existing.id;
  }

  // 쪽수와 판형은 검색 응답에 없습니다. 담을 때 한 번 더 부릅니다 (§7).
  const row = toBookInsert(await lookUpBook(aladinItemId));

  const { data: inserted, error } = await supabase
    .from("book")
    .insert(row)
    .select(BOOK_COLUMNS)
    .single<BookRow>();

  if (error) {
    // 같은 순간에 다른 사람이 먼저 넣었습니다. 그 행을 씁니다.
    if (error.code === UNIQUE_VIOLATION) {
      const raced = await findBook(supabase, aladinItemId);
      if (raced) {
        if (needsCover(raced)) await attachCover(supabase, raced);
        return raced.id;
      }
    }
    throw error;
  }

  await attachCover(supabase, inserted);
  return inserted.id;
}
