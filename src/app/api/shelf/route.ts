import { NextResponse } from "next/server";
import { AladinError } from "@/lib/aladin/client";
import { ensureBook } from "@/lib/books/ensure-book";
import { createClient } from "@/lib/supabase/server";

/**
 * 책 담기 (기획서 §5 · §7). book이 없으면 알라딘에서 받아와 만들고(표지 복사 포함)
 * shelf_item을 만듭니다. 이미 서재에 있으면 상태를 덮지 않고 그대로 알려줍니다.
 */

const STATUSES = ["wishlist", "reading", "finished", "set_aside"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && STATUSES.includes(value as Status);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  let body: { aladinItemId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "본문을 읽지 못했습니다" },
      { status: 400 },
    );
  }

  const aladinItemId =
    typeof body.aladinItemId === "string" ? body.aladinItemId.trim() : "";
  if (!aladinItemId) {
    return NextResponse.json(
      { error: "aladinItemId가 없습니다" },
      { status: 400 },
    );
  }
  if (!isStatus(body.status)) {
    return NextResponse.json(
      { error: "status가 올바르지 않습니다" },
      { status: 400 },
    );
  }
  const status = body.status;

  let bookId: string;
  try {
    bookId = await ensureBook(supabase, aladinItemId);
  } catch (error) {
    if (error instanceof AladinError) {
      console.error("[shelf]", error.message);
      return NextResponse.json(
        { error: "알라딘에서 책 정보를 받지 못했습니다" },
        { status: 502 },
      );
    }
    throw error;
  }

  // 이미 서재에 있으면 상태·별점을 건드리지 않습니다 — 상태 변경은 책 상세의 일입니다 (§5).
  const { data: existing } = await supabase
    .from("shelf_item")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    return NextResponse.json({
      shelfItemId: existing.id,
      alreadyInShelf: true,
    });
  }

  const now = new Date().toISOString();

  const { data: inserted, error } = await supabase
    .from("shelf_item")
    .insert({
      user_id: user.id,
      book_id: bookId,
      status,
      status_changed_at: now,
      // §6 상태 전이. 새 행이라 덮어쓸 값이 없습니다.
      started_at: status === "reading" ? now : null,
      finished_at: status === "finished" ? now : null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    console.error("[shelf]", error.message);
    return NextResponse.json(
      { error: "서재에 담지 못했습니다" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { shelfItemId: inserted.id, alreadyInShelf: false },
    { status: 201 },
  );
}
