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
 * 책 상세 (기획서 §5). 컨테이너 폭 720 고정 — 넓은 화면에서도 읽기 폭을 지킵니다.
 *
 * 위에서 아래로: 뒤로가기 → 헤더(표지 + 정보 + 상태·별점) → 리뷰 →
 * 이 책의 밑줄 목록 → 밑줄 추가. 담은 직후 이 화면으로 옵니다.
 *
 * **헤더 배치(시안 C).** 표지를 왼쪽에 크게(240px) 놓고, 오른쪽 칼럼을 표지 높이만큼
 * 늘려 위/아래로 가릅니다 — 제목·저자·출판사·쪽수·책 소개는 표지 상단에, 상태·별점은
 * 표지 하단선에 맞춰 내려갑니다. 좁은 화면(모바일)에서는 표지 아래로 쌓습니다.
 * 제목 2줄·소개 5줄로 잘라 위 묶음이 표지 높이를 넘지 않게 합니다.
 *
 * 판형·무게·출간일·제본은 book에 데이터로만 두고 화면에는 내지 않습니다 (§5).
 */

/** 헤더 표지 표시 폭 (§5 · design.md §레이아웃). */
const COVER_W = 240;

type ShelfItemDetail = {
  id: string;
  status: string;
  rating: number | null;
  book: {
    title: string;
    author: string | null;
    publisher: string | null;
    page_count: number | null;
    description: string | null;
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
      "id, status, rating, book:book(title, author, publisher, page_count, description, cover_width, cover_height, cover_path, accent_color)",
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
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 py-14 sm:px-7">
      <Link
        href="/shelf"
        className="text-sub hover:text-ink mb-8 inline-flex w-fit items-center gap-1 text-xs"
      >
        <span aria-hidden>←</span> 책장
      </Link>

      {/*
        헤더(시안 C). 모바일은 표지 위 · 정보 아래로 쌓고(flex-col), sm↑에서 좌우로
        나란히 놓으며 오른쪽 칼럼을 표지 높이만큼 늘려(items-stretch) 상태·별점을
        표지 하단선에 맞춥니다.
      */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-7">
        {/* 표지의 실제 픽셀 크기가 있으므로 비율을 추측하지 않습니다 (§5). */}
        {book.cover_path && book.cover_width && book.cover_height && (
          <Image
            src={coverPublicUrl(book.cover_path)}
            alt=""
            width={book.cover_width}
            height={book.cover_height}
            style={{ width: COVER_W }}
            className="h-auto shrink-0"
          />
        )}
        <div className="flex flex-1 flex-col sm:justify-between sm:py-0.5">
          <div>
            <h1 className="line-clamp-2 text-[19px] leading-snug">
              {book.title}
            </h1>
            {book.author && (
              <p className="text-sub mt-2 text-sm">{book.author}</p>
            )}
            {facts.length > 0 && (
              <p className="text-sub mt-3 text-xs">{facts.join(" · ")}</p>
            )}
            {book.description && (
              <p className="text-sub mt-4 line-clamp-5 text-[13.5px] leading-[1.7]">
                {book.description}
              </p>
            )}
          </div>
          <div className="mt-8 sm:mt-0 sm:pt-6">
            <StatusRating
              shelfItemId={data.id}
              initialStatus={data.status}
              initialRating={data.rating}
            />
          </div>
        </div>
      </div>

      <ReviewEditor shelfItemId={data.id} initialBody={review?.body ?? ""} />

      <section className="mt-10">
        <p className="text-sub text-[10.5px] tracking-[0.09em]">
          밑줄{passageRows.length > 0 ? ` ${passageRows.length}` : ""}
        </p>

        {passageRows.length === 0 ? (
          <p className="text-sub mt-4 text-sm">
            아직 밑줄이 없습니다. 좋았던 문장을 그어보세요.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-[28px]">
            {passageRows.map((passage) => (
              <PassageItem
                key={passage.id}
                id={passage.id}
                body={passage.body}
                page={passage.page}
                accentColor={book.accent_color}
              >
                <PassageCard
                  id={passage.id}
                  body={passage.body}
                  page={passage.page}
                  accentColor={book.accent_color}
                  comments={commentsByPassage.get(passage.id) ?? []}
                  draw={false}
                />
              </PassageItem>
            ))}
          </div>
        )}
      </section>

      <AddPassage shelfItemId={data.id} accentColor={book.accent_color} />
    </main>
  );
}
