import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookSize } from "@/lib/books/dimensions";
import { coverPublicUrl } from "@/lib/cover-path";
import { createClient } from "@/lib/supabase/server";
import PassageCard from "@/app/passage-card";
import AddPassage from "./add-passage";
import PassageItem from "./passage-item";
import ReviewEditor from "./review-editor";
import StatusRating from "./status-rating";

/**
 * 책 상세 (기획서 §5).
 *
 * 위에서 아래로: 책장으로 가는 뒤로가기 → 표지와 책 정보(판형·쪽수·무게) →
 * 상태와 별점 → 리뷰 → 이 책의 밑줄 목록 → 밑줄 추가. 담은 직후 이 화면으로 옵니다.
 */

type ShelfItemDetail = {
  id: string;
  status: string;
  rating: number | null;
  book: {
    title: string;
    author: string | null;
    publisher: string | null;
    published_at: string | null;
    page_count: number | null;
    size_width: number | null;
    size_height: number | null;
    size_depth: number | null;
    weight: number | null;
    cover_width: number | null;
    cover_height: number | null;
    style_desc: string | null;
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
      "id, status, rating, book:book(title, author, publisher, published_at, page_count, size_width, size_height, size_depth, weight, cover_width, cover_height, style_desc, cover_path, accent_color)",
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

  // 판형은 알라딘이 가로·세로를 뒤바꿔 주는 책이 있어 보정해서 씁니다 (§5).
  const size = bookSize(book);
  const facts = [
    book.publisher,
    book.page_count ? `${book.page_count}쪽` : null,
    book.size_width && book.size_height
      ? `${size.width} × ${size.height}mm${size.corrected ? " (보정)" : ""}`
      : null,
    book.weight ? `${book.weight}g` : null,
    book.style_desc,
  ].filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 py-14 sm:px-7">
      <Link
        href="/shelf"
        className="text-sub hover:text-ink mb-8 inline-flex w-fit items-center gap-1 text-xs"
      >
        <span aria-hidden>←</span> 책장
      </Link>

      <div className="flex gap-6">
        {/* 표지의 실제 픽셀 크기가 있으므로 비율을 추측하지 않습니다 (§5). */}
        {book.cover_path && book.cover_width && book.cover_height && (
          <Image
            src={coverPublicUrl(book.cover_path)}
            alt=""
            width={book.cover_width}
            height={book.cover_height}
            className="h-auto w-[124px] self-start"
          />
        )}
        <div className="flex-1">
          <h1 className="text-[19px] leading-snug">{book.title}</h1>
          {book.author && (
            <p className="text-sub mt-2 text-sm">{book.author}</p>
          )}
          {facts.length > 0 && (
            <p className="text-sub mt-4 text-xs leading-relaxed">
              {facts.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <StatusRating
        shelfItemId={data.id}
        initialStatus={data.status}
        initialRating={data.rating}
      />

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

      <AddPassage shelfItemId={data.id} />
    </main>
  );
}
