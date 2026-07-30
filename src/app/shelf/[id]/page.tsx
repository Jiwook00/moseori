import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookSize } from "@/lib/books/dimensions";
import { coverPublicUrl } from "@/lib/cover-path";
import { STATUS_LABELS, isShelfStatus } from "@/lib/shelf/status";
import { createClient } from "@/lib/supabase/server";

/**
 * 책 상세 (기획서 §5) — **스텁입니다.**
 *
 * 담은 직후 이 화면으로 오게 되어 있어서(§5) 이번 세션에 최소한만 만들었습니다.
 * §5가 정한 전체 구성(상태와 별점 → 리뷰 → 이 책의 밑줄 목록 → 밑줄 추가)과
 * design.md 규격은 다음 세션입니다. 지금 있는 것은 담기가 제대로 됐는지
 * 눈으로 확인하는 자리입니다.
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
    cover_width: number | null;
    cover_height: number | null;
    style_desc: string | null;
    cover_path: string | null;
    cover_is_large: boolean | null;
    accent_color: string | null;
  } | null;
};

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS가 남의 책을 걸러줍니다. 그래도 없는 id는 404로 끝냅니다.
  const { data } = await supabase
    .from("shelf_item")
    .select(
      "id, status, rating, book:book(title, author, publisher, published_at, page_count, size_width, size_height, cover_width, cover_height, style_desc, cover_path, cover_is_large, accent_color)",
    )
    .eq("id", id)
    .maybeSingle<ShelfItemDetail>();

  if (!data?.book) notFound();
  const { book } = data;

  // 판형은 알라딘이 가로·세로를 뒤바꿔 주는 책이 있어 보정해서 씁니다 (§5).
  const size = bookSize(book);

  const facts = [
    book.publisher,
    book.published_at,
    book.page_count ? `${book.page_count}쪽` : null,
    book.size_width && book.size_height
      ? `${size.width} × ${size.height}mm${size.corrected ? " (보정)" : ""}`
      : null,
    book.style_desc,
  ].filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 py-20 sm:px-7">
      <Link href="/shelf" className="text-sub text-xs underline-offset-4">
        ← 책장
      </Link>

      <div className="mt-10 flex gap-6">
        {/*
          표지의 실제 픽셀 크기를 저장해두었으므로 비율을 추측하지 않습니다.
          모양은 이미지가 정합니다 (§5).
        */}
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
          <h1 className="text-lg leading-snug">{book.title}</h1>
          {book.author && (
            <p className="text-sub mt-2 text-sm">{book.author}</p>
          )}
          <p className="text-sub mt-4 text-xs leading-relaxed">
            {facts.join(" · ")}
          </p>
          <p className="mt-4 text-xs">
            {isShelfStatus(data.status)
              ? STATUS_LABELS[data.status]
              : data.status}
            {data.rating ? ` · 별점 ${data.rating}` : ""}
          </p>
        </div>
      </div>

      {/* 담기 결과를 눈으로 확인하는 자리입니다. 디자인이 붙으면 사라집니다. */}
      <p className="text-sub mt-12 text-[11px]">
        표지 {book.cover_is_large ? "500px" : "200px"} · accent{" "}
        {book.accent_color ?? "없음"}
        {book.accent_color && (
          <span
            aria-hidden
            className="border-line ml-2 inline-block h-3 w-3 border align-middle"
            style={{ background: book.accent_color }}
          />
        )}
      </p>
    </main>
  );
}
