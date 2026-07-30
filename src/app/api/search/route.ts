import { NextResponse, type NextRequest } from "next/server";
import { AladinError, normalizeQuery, searchBooks } from "@/lib/aladin/client";
import { createClient } from "@/lib/supabase/server";

/**
 * 책 검색 (기획서 §7).
 *
 * 알라딘 키가 서버에만 있어야 하므로 브라우저는 이 경로를 통해서만 검색합니다.
 *
 * 결과마다 `shelfItemId`를 붙입니다. 이미 서재에 있는 책을 "이미 서재에 있어요"로
 * 안내하고(§5), 누르면 그 책의 상세로 보내려면 id가 필요합니다.
 */

export type SearchResult = {
  aladinItemId: string;
  isbn13: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  pubDate: string | null;
  cover: string | null;
  /** 내 서재에 이미 있으면 그 shelf_item의 id. 없으면 null. */
  shelfItemId: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const query = normalizeQuery(request.nextUrl.searchParams.get("q") ?? "");
  if (!query) {
    return NextResponse.json({ error: "검색어가 없습니다" }, { status: 400 });
  }

  let items;
  try {
    items = await searchBooks(query);
  } catch (error) {
    if (error instanceof AladinError) {
      console.error("[search]", error.message);
      return NextResponse.json(
        { error: "알라딘 검색이 지금은 안 됩니다" },
        { status: 502 },
      );
    }
    throw error;
  }

  const aladinItemIds = items.map((item) => String(item.itemId));

  // 내 서재와 대조합니다. 한 번의 조회로 끝냅니다.
  const { data: mine } = await supabase
    .from("shelf_item")
    .select("id, book:book!inner(aladin_item_id)")
    .eq("user_id", user.id)
    .in("book.aladin_item_id", aladinItemIds);

  const shelfItemIdByAladinId = new Map<string, string>();
  for (const row of (mine ?? []) as unknown as {
    id: string;
    book: { aladin_item_id: string } | null;
  }[]) {
    if (row.book) shelfItemIdByAladinId.set(row.book.aladin_item_id, row.id);
  }

  const results: SearchResult[] = items.map((item) => {
    const aladinItemId = String(item.itemId);
    return {
      aladinItemId,
      isbn13: item.isbn13 ?? null,
      title: item.title,
      author: item.author ?? null,
      publisher: item.publisher ?? null,
      pubDate: item.pubDate ?? null,
      cover: item.cover ?? null,
      shelfItemId: shelfItemIdByAladinId.get(aladinItemId) ?? null,
    };
  });

  return NextResponse.json({ results });
}
