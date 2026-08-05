import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coverPublicUrl } from "@/lib/cover-path";
import { createClient } from "@/lib/supabase/server";
import PassageCard from "@/app/passage-card";
import AddPassage from "./add-passage";
import PassageItem from "./passage-item";
import ReviewEditor from "./review-editor";
import StatusRating from "./status-rating";

/**
 * 책 상세 (기획서 §5, design.md §레이아웃). **펼침 2단**입니다.
 *
 * - 넓은 화면(lg↑): 왼쪽에 책(표지·제목·저자·출판사·쪽수·상태·별점)과 리뷰를
 *   **종이 위에** 두고 `sticky`로 고정, 오른쪽에 이 책의 밑줄을 **accent 색 필드**로
 *   화면 오른쪽 끝까지 펼칩니다. "펼친 책 — 내 밑줄".
 * - 좁은 화면: 2단이 접혀 왼쪽(책·리뷰) → 오른쪽(밑줄 필드) 순으로 쌓입니다.
 *
 * 밑줄 사이에는 **직선 구분선을 두지 않습니다**(사용자 결정) — 손으로 그은 밑줄과
 * 쪽수가 경계를 대신하고, 화면의 선은 손그림 한 종류뿐이라 서명이 선명합니다.
 * 리뷰는 내 글이라 색을 입지 않고 왼쪽 종이 위에 흐릅니다.
 *
 * 책 소개(description)는 상세에 내지 않습니다(사용자 결정). 판형·무게·출간일·제본도
 * book에 데이터로만 두고 화면에는 내지 않습니다 (§5).
 */

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

type CommentRow = {
  id: string;
  passage_id: string;
  body: string;
  created_at: string;
};

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS가 남의 책을 걸러줍니다. 없는 id는 404.
  const { data } = await supabase
    .from("shelf_item")
    .select(
      "id, status, rating, book:book(title, author, publisher, page_count, cover_width, cover_height, cover_path, accent_color)",
    )
    .eq("id", id)
    .maybeSingle<ShelfItemDetail>();

  if (!data?.book) notFound();
  const { book } = data;

  // 밑줄과 리뷰. 모든 조회에 deleted_at IS NULL (CLAUDE.md).
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
  const commentsByPassage = new Map<string, CommentRow[]>();
  if (passageRows.length > 0) {
    const { data: comments } = await supabase
      .from("passage_comment")
      .select("id, passage_id, body, created_at")
      .in(
        "passage_id",
        passageRows.map((p) => p.id),
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .returns<CommentRow[]>();
    for (const comment of comments ?? []) {
      const list = commentsByPassage.get(comment.passage_id) ?? [];
      list.push(comment);
      commentsByPassage.set(comment.passage_id, list);
    }
  }

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

      {/*
        펼침 2단. lg↑에서 왼쪽(책·리뷰, 종이)과 오른쪽(밑줄, accent 필드)로 갈리고,
        그 아래에서는 접혀 왼쪽 → 오른쪽 순으로 쌓입니다. items-start라 왼쪽을
        sticky로 고정할 수 있습니다.
      */}
      <div className="mt-4 flex-1 lg:grid lg:grid-cols-[4fr_6fr] lg:items-start">
        {/* 왼쪽: 책 정보 + 리뷰. 종이 위에 흐르고 넓은 화면에서 고정됩니다. */}
        <div className="px-5 pb-10 sm:px-7 lg:sticky lg:top-6 lg:self-start lg:pr-9 lg:pb-16">
          {/* 표지의 실제 픽셀 크기가 있으므로 비율을 추측하지 않습니다 (§5). */}
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
          {/* 긴 제목도 전부 보입니다 — 옛 2줄 말줄임은 표지 높이 정렬용이었고, 이제 없어졌습니다. */}
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

        {/*
          오른쪽: 밑줄 accent 필드. 화면 오른쪽 끝까지 색이 흐르고(가로 여백은 필드가
          갖습니다), 글줄만 읽기 폭으로 좁힙니다. 밑줄 사이 직선 구분선은 없습니다.
        */}
        <div
          className="px-5 pt-10 pb-14 sm:px-7 lg:pt-10 lg:pl-9"
          style={{ background: book.accent_color ?? "var(--color-card)" }}
        >
          <div className="max-w-[680px]">
            <p className="text-sub text-[10.5px] tracking-[0.09em]">
              밑줄{passageRows.length > 0 ? ` ${passageRows.length}` : ""}
            </p>

            {passageRows.length === 0 ? (
              <p className="text-sub mt-4 text-sm">
                아직 밑줄이 없습니다. 좋았던 문장을 그어보세요.
              </p>
            ) : (
              <div className="mt-6 flex flex-col gap-8">
                {passageRows.map((passage) => (
                  <PassageItem
                    key={passage.id}
                    id={passage.id}
                    body={passage.body}
                    page={passage.page}
                  >
                    <PassageCard
                      id={passage.id}
                      body={passage.body}
                      page={passage.page}
                      comments={commentsByPassage.get(passage.id) ?? []}
                      draw={false}
                    />
                  </PassageItem>
                ))}
              </div>
            )}

            <AddPassage shelfItemId={data.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
