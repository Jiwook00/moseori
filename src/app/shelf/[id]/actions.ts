"use server";

import { revalidatePath } from "next/cache";
import { type ShelfStatus, isShelfStatus } from "@/lib/shelf/status";
import { createClient } from "@/lib/supabase/server";

// 책 상세의 변경들. 상태와 별점은 독립입니다 (§6의 별점–완독 연동은 제거).

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

/** 상태 변경. reading/finished면 시작·완독일을 찍되 이미 있으면 덮지 않습니다. */
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" → 정오 KST의 timestamptz. 정오라 표시(Asia/Seoul)에서 날짜가 밀리지 않습니다. */
function dateToStamp(date: string | null): string | null {
  return date ? new Date(`${date}T12:00:00+09:00`).toISOString() : null;
}

/**
 * 읽은 기간을 직접 남깁니다. started_at/finished_at을 재사용하되, 상태 전이가
 * 자동으로 찍던 것(§6)과 달리 사용자가 덮어쓸 수 있습니다.
 */
export async function setReadingDates(
  shelfItemId: string,
  input: { startedAt: string | null; finishedAt: string | null },
): Promise<MutationResult> {
  const { startedAt, finishedAt } = input;
  if (
    (startedAt && !DATE_RE.test(startedAt)) ||
    (finishedAt && !DATE_RE.test(finishedAt))
  ) {
    return { ok: false, error: "날짜 형식이 올바르지 않습니다" };
  }
  if (startedAt && finishedAt && startedAt > finishedAt) {
    return { ok: false, error: "시작한 날이 다 읽은 날보다 뒤입니다" };
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
    .update({
      started_at: dateToStamp(startedAt),
      finished_at: dateToStamp(finishedAt),
    })
    .eq("id", shelfItemId);
  if (error) return { ok: false, error: "읽은 기간을 저장하지 못했습니다" };

  revalidatePath(`/shelf/${shelfItemId}`);
  return { ok: true };
}

/** 별점. 저장만 합니다 — 상태를 바꾸지 않습니다. */
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

/** 리뷰 저장 (§6). 책당 하나. 본문이 비면 soft delete합니다. */
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

  // 지워진 옛 행은 되살리지 않습니다 — "살아있는 리뷰는 책당 하나"(부분 unique 인덱스)를 깨뜨립니다.
  const { data: live } = await supabase
    .from("review")
    .select("id")
    .eq("shelf_item_id", shelfItemId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string }>();

  if (!text) {
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

/** 리뷰 삭제. soft delete입니다. */
export async function deleteReview(
  shelfItemId: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: item } = await loadItem(supabase, shelfItemId);
  if (!item) return NOT_FOUND;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("review")
    .update({ deleted_at: now, updated_at: now })
    .eq("shelf_item_id", shelfItemId)
    .is("deleted_at", null);
  if (error) return { ok: false, error: "리뷰를 지우지 못했습니다" };

  revalidatePath(`/shelf/${shelfItemId}`);
  return { ok: true };
}

/** 살아있는 내 밑줄 하나. RLS가 남의 것을 걸러줍니다. */
async function loadPassage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  passageId: string,
) {
  return supabase
    .from("passage")
    .select("id, shelf_item_id")
    .eq("id", passageId)
    .is("deleted_at", null)
    .maybeSingle<{ id: string; shelf_item_id: string }>();
}

const PASSAGE_NOT_FOUND = {
  ok: false,
  error: "밑줄을 찾지 못했습니다",
} as const;

/** 밑줄 수정. 문장과 쪽수만 고칩니다 (`passage`에는 updated_at이 없습니다 — 기획서 §4). */
export async function updatePassage(
  passageId: string,
  input: { body: string; page?: number | null },
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: passage } = await loadPassage(supabase, passageId);
  if (!passage) return PASSAGE_NOT_FOUND;

  const text = input.body.trim();
  if (!text) return { ok: false, error: "문장을 입력해주세요" };

  const page =
    input.page != null && Number.isFinite(input.page) && input.page > 0
      ? Math.trunc(input.page)
      : null;

  const { error } = await supabase
    .from("passage")
    .update({ body: text, page })
    .eq("id", passageId);
  if (error) return { ok: false, error: "밑줄을 고치지 못했습니다" };

  revalidatePath(`/shelf/${passage.shelf_item_id}`);
  return { ok: true };
}

/** 밑줄 삭제. soft delete입니다 — 달린 코멘트는 밑줄을 통해서만 닿으므로 함께 사라집니다. */
export async function deletePassage(
  passageId: string,
): Promise<MutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTH;

  const { data: passage } = await loadPassage(supabase, passageId);
  if (!passage) return PASSAGE_NOT_FOUND;

  const { error } = await supabase
    .from("passage")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", passageId);
  if (error) return { ok: false, error: "밑줄을 지우지 못했습니다" };

  revalidatePath(`/shelf/${passage.shelf_item_id}`);
  return { ok: true };
}

/** 밑줄 추가 (§6). 문장만 있으면 저장되고, 코멘트가 있으면 passage_comment 하나를 답니다. */
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
