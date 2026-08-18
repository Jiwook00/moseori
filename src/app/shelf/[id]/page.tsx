import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coverPublicUrl } from "@/lib/cover-path";
import { fetchCommentsByPassage } from "@/lib/passage/comments";
import { createClient } from "@/lib/supabase/server";
import PassageList from "./passage-list";
import ReviewEditor from "./review-editor";
import StatusRating from "./status-rating";

/** 왼쪽 칼럼의 표지 표시 폭 (design.md §레이아웃). */
const COVER_W = 220;

type ShelfItemDetail = {
  id: string;
  status: string;
  rating: number | null;
  book: {
    title: string;
    author: string | null;
    publisher: string | null;
    page_count: number | null;
    cover_width: number | null;
    cover_height: number | null;
    cover_path: string | null;
    accent_color: string | null;
  } | null;
};

type PassageRow = {
  id: string;
  body: string;
  page: number | null;
  created_at: string;
};

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("shelf_item")
    .select(
      "id, status, rating, book:book(title, author, publisher, page_count, cover_width, cover_height, cover_path, accent_color)",
    )
    .eq("id", id)
    .maybeSingle<ShelfItemDetail>();

  if (!data?.book) notFound();
  const { book } = data;

  const [{ data: review }, { data: passages }] = await Promise.all([
    supabase
      .from("review")
      .select("body")
      .eq("shelf_item_id", id)
      .is("deleted_at", null)
      .maybeSingle<{ body: string }>(),
    supabase
      .from("passage")
      .select("id, body, page, created_at")
      .eq("shelf_item_id", id)
      .is("deleted_at", null)
      .order("page", { nullsFirst: false })
      .order("created_at", { ascending: true })
      .returns<PassageRow[]>(),
  ]);

  const passageRows = passages ?? [];
  const commentsByPassage = await fetchCommentsByPassage(
    supabase,
    passageRows.map((p) => p.id),
  );
  const passagesWithComments = passageRows.map((passage) => ({
    ...passage,
    comments: commentsByPassage.get(passage.id) ?? [],
  }));

  const facts = [
    book.publisher,
    book.page_count ? `${book.page_count}쪽` : null,
  ].filter(Boolean);

  return (
    <main className="flex w-full flex-1 flex-col">
      <div className="px-5 pt-8 sm:px-7">
        <Link
          href="/shelf"
          className="text-sub hover:text-ink inline-flex w-fit items-center gap-1 text-xs"
        >
          <span aria-hidden>←</span> 책장
        </Link>
      </div>

      {/* 펼침 2단: 왼쪽(책·리뷰, 종이·sticky) / 오른쪽(밑줄, accent 필드). 좁으면 접혀 쌓입니다. */}
      <div className="mt-4 flex-1 lg:grid lg:grid-cols-[4fr_6fr] lg:items-start">
        <div className="px-5 pb-10 sm:px-7 lg:sticky lg:top-6 lg:self-start lg:pr-9 lg:pb-16">
          {book.cover_path && book.cover_width && book.cover_height && (
            <Image
              src={coverPublicUrl(book.cover_path)}
              alt=""
              width={book.cover_width}
              height={book.cover_height}
              style={{ width: COVER_W }}
              className="h-auto"
            />
          )}
          <h1 className="mt-5 text-[19px] leading-snug">{book.title}</h1>
          {book.author && (
            <p className="text-sub mt-2 text-sm">{book.author}</p>
          )}
          {facts.length > 0 && (
            <p className="text-sub mt-3 text-xs">{facts.join(" · ")}</p>
          )}
          <div className="mt-6">
            <StatusRating
              shelfItemId={data.id}
              initialStatus={data.status}
              initialRating={data.rating}
            />
          </div>

          <ReviewEditor
            shelfItemId={data.id}
            initialBody={review?.body ?? ""}
          />
        </div>

        {/* accent 필드: 색이 화면 오른쪽 끝까지 흐르고, 글줄만 읽기 폭으로 좁힙니다. */}
        <div
          className="px-5 pt-10 pb-14 sm:px-7 lg:pt-10 lg:pl-9"
          style={{ background: book.accent_color ?? "var(--color-card)" }}
        >
          <div className="max-w-[680px]">
            <PassageList
              shelfItemId={data.id}
              passages={passagesWithComments}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
