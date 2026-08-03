"use server";

import { revalidatePath } from "next/cache";
import { type ShelfStatus, isShelfStatus } from "@/lib/shelf/status";
import { createClient } from "@/lib/supabase/server";

/**
 * 책 상세의 변경들.
 *
 * **상태와 별점은 독립입니다** (사용자 지시로 §6의 별점–완독 연동을 제거).
 * 상태를 바꿔도 별점을 묻지 않고, 별점을 매겨도 상태가 바뀌거나 반응이 뜨지
 * 않습니다. 상태 전이의 started_at/finished_at 기록은 그대로 둡니다 — 그건 별점과
 * 무관한 "언제 시작·완독했나"의 기록입니다.
 */

export type MutationResult = { ok: true } | { ok: false; error: string };

const UNAUTH = { ok: false, error: "로그인이 필요합니다" } as const;
const NOT_FOUND = { ok: false, error: "책을 찾지 못했습니다" } as const;

type ShelfItemState = {
  status: ShelfStatus;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
};

/** 내 shelf_item 하나를 읽습니다. RLS가 남의 것을 걸러줍니다. */
async function loadItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shelfItemId: string,
) {
  return supabase
    .from("shelf_item")
    .select("status, started_at, finished_at, rating")
    .eq("id", shelfItemId)
    .maybeSingle<ShelfItemState>();
}

/**
 * 상태 변경.
 * reading이면 started_at, finished면 finished_at을 찍되 **이미 값이 있으면
 * 덮어쓰지 않습니다** — 처음 시작·완독한 날을 지키기 위함. 별점과는 무관합니다.
 */
export async function setStatus(
  shelfItemId: string,
  next: string,
): Promise<MutationResult> {
  if (!isShelfStatus(next)) return { ok: false, error: "잘못된 상태입니다" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: item } = await loadItem(supabase, shelfItemId);
  if (!item) return NOT_FOUND;

  const now = new Date().toISOString();
  const patch: Record<string, string | null> = {
    status: next,
    status_changed_at: now,
  };
  // 이미 값이 있으면 그대로 둡니다. 처음 시작·완독한 날을 지키기 위함.
  if (next === "reading" && !item.started_at) patch.started_at = now;
  if (next === "finished" && !item.finished_at) patch.finished_at = now;

  const { error } = await supabase
    .from("shelf_item")
    .update(patch)
    .eq("id", shelfItemId);
  if (error) return { ok: false, error: "상태를 바꾸지 못했습니다" };

  revalidatePath(`/shelf/${shelfItemId}`);
  return { ok: true };
}

/**
 * 별점. 저장만 합니다 — 상태를 바꾸지 않고 반응도 없습니다.
 */
export async function setRating(
  shelfItemId: string,
  rating: number,
): Promise<MutationResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "별점은 1~5입니다" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: item } = await loadItem(supabase, shelfItemId);
  if (!item) return NOT_FOUND;

  const { error } = await supabase
    .from("shelf_item")
    .update({ rating })
    .eq("id", shelfItemId);
  if (error) return { ok: false, error: "별점을 저장하지 못했습니다" };

  revalidatePath(`/shelf/${shelfItemId}`);
  return { ok: true };
}

/**
 * 리뷰 저장 (§6 리뷰 에디터). 책당 하나(UNIQUE).
 * 본문이 비면 soft delete합니다 — 살아있는 리뷰만 책당 하나라는 규칙(스키마)에 맞춥니다.
 * updated_at은 여기서 갱신합니다(§6은 트리거가 아니라 앱 레이어).
 */
export async function saveReview(
  shelfItemId: string,
  body: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: item } = await loadItem(supabase, shelfItemId);
  if (!item) return NOT_FOUND;

  const text = body.trim();
  const now = new Date().toISOString();

  // 살아있는 리뷰만 봅니다. deleted_at이 있는 옛 행은 건드리지 않습니다 —
  // 되살렸다가는 "살아있는 리뷰는 책당 하나"(부분 unique 인덱스)를 깨뜨립니다.
  const { data: live } = await supabase
    .from("review")
    .select("id")
    .eq("shelf_item_id", shelfItemId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string }>();

  if (!text) {
    // 살아있는 리뷰가 있으면 지웁니다. 없으면 할 일 없음.
    if (live) {
      const { error } = await supabase
        .from("review")
        .update({ deleted_at: now, updated_at: now })
        .eq("id", live.id);
      if (error) return { ok: false, error: "리뷰를 지우지 못했습니다" };
      revalidatePath(`/shelf/${shelfItemId}`);
    }
    return { ok: true };
  }

  if (live) {
    const { error } = await supabase
      .from("review")
      .update({ body: text, updated_at: now })
      .eq("id", live.id);
    if (error) return { ok: false, error: "리뷰를 저장하지 못했습니다" };
  } else {
    const { error } = await supabase.from("review").insert({
      shelf_item_id: shelfItemId,
      user_id: user.id,
      body: text,
    });
    if (error) return { ok: false, error: "리뷰를 저장하지 못했습니다" };
  }

  revalidatePath(`/shelf/${shelfItemId}`);
  return { ok: true };
}

/**
 * 밑줄 추가 (§6 밑줄 입력).
 * 문장만 있으면 저장됩니다. 쪽수·코멘트는 선택.
 * 코멘트가 있으면 같은 동작에서 passage_comment 하나를 답니다.
 */
export async function addPassage(
  shelfItemId: string,
  input: { body: string; page?: number | null; comment?: string },
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: item } = await loadItem(supabase, shelfItemId);
  if (!item) return NOT_FOUND;

  const text = input.body.trim();
  if (!text) return { ok: false, error: "문장을 입력해주세요" };

  const page =
    input.page != null && Number.isFinite(input.page) && input.page > 0
      ? Math.trunc(input.page)
      : null;

  const { data: passage, error } = await supabase
    .from("passage")
    .insert({
      shelf_item_id: shelfItemId,
      user_id: user.id,
      body: text,
      page,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !passage) return { ok: false, error: "밑줄을 긋지 못했습니다" };

  const comment = input.comment?.trim();
  if (comment) {
    const { error: commentError } = await supabase
      .from("passage_comment")
      .insert({ passage_id: passage.id, user_id: user.id, body: comment });
    // 코멘트 실패로 밑줄까지 되돌리지는 않습니다. 밑줄은 이미 저장됐습니다.
    if (commentError) {
      revalidatePath(`/shelf/${shelfItemId}`);
      return {
        ok: false,
        error: "밑줄은 저장됐지만 생각은 저장하지 못했습니다",
      };
    }
  }

  revalidatePath(`/shelf/${shelfItemId}`);
  return { ok: true };
}
