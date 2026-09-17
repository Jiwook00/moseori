import { NextResponse, type NextRequest } from "next/server";
import {
  isbn13Of,
  KakaoError,
  normalizeQuery,
  searchBooks,
} from "@/lib/kakao/client";
import { createClient } from "@/lib/supabase/server";

/**
 * 책 검색 (기획서 §7). 카카오 키가 서버 전용이라 브라우저는 이 경로로만 검색합니다.
 * 결과마다 `shelfItemId`를 붙여 "이미 서재에 있어요"를 안내합니다 (§5).
 */

export type SearchResult = {
  isbn13: string;
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
    if (error instanceof KakaoError) {
      console.error("[search]", error.message);
      return NextResponse.json(
        { error: "책 검색이 지금은 안 됩니다" },
        { status: 502 },
      );
    }
    throw error;
  }

  const isbn13s = items.map((item) => isbn13Of(item)!);

  const { data: mine } = await supabase
    .from("shelf_item")
    .select("id, book:book!inner(isbn13)")
    .eq("user_id", user.id)
    .in("book.isbn13", isbn13s);

  const shelfItemIdByIsbn = new Map<string, string>();
  for (const row of (mine ?? []) as unknown as {
    id: string;
    book: { isbn13: string } | null;
  }[]) {
    if (row.book) shelfItemIdByIsbn.set(row.book.isbn13, row.id);
  }

  const results: SearchResult[] = items.map((item, index) => ({
    isbn13: isbn13s[index],
    title: item.title,
    author: item.authors.join(", ") || null,
    publisher: item.publisher || null,
    pubDate: item.datetime.slice(0, 10) || null,
    cover: item.thumbnail || null,
    shelfItemId: shelfItemIdByIsbn.get(isbn13s[index]) ?? null,
  }));

  return NextResponse.json({ results });
}
