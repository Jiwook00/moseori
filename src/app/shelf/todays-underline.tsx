import PassageBand from "@/app/passage-band";
import { authorName } from "@/lib/books/author";
import { createClient } from "@/lib/supabase/server";
import { chooseTodaysPassage } from "@/lib/underline/today";

/**
 * 오늘의 밑줄 (기획서 §5·§6, design.md §오늘의 밑줄). 책장 맨 위 한 장.
 * 선택 규칙(하루 고정, 오래 안 본 것 우선)은 `lib/underline/today.ts`에 있고,
 * 3개 미만이면 아무것도 그리지 않습니다.
 */

type Row = {
  id: string;
  body: string;
  page: number | null;
  last_shown_at: string | null;
  created_at: string;
  shelf_item: {
    id: string;
    book: {
      title: string;
      author: string | null;
      accent_color: string | null;
    } | null;
  } | null;
};

export default async function TodaysUnderline({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("passage")
    .select(
      "id, body, page, last_shown_at, created_at, shelf_item:shelf_item(id, book:book(title, author, accent_color))",
    )
    .is("deleted_at", null)
    .returns<Row[]>();

  const rows = data ?? [];
  const pick = chooseTodaysPassage(rows, userId);
  if (!pick) return null;

  const passage = rows.find((r) => r.id === pick.id);
  if (!passage) return null;

  // 오늘 처음 고른 것이면 last_shown_at을 찍습니다 (오래 안 본 것 우선의 기록).
  if (pick.stamp) {
    await supabase
      .from("passage")
      .update({ last_shown_at: new Date().toISOString() })
      .eq("id", passage.id);
  }

  const book = passage.shelf_item?.book;

  return (
    <section className="mb-12">
      <p className="text-sub mb-4 text-[10.5px] tracking-[0.09em]">
        오늘의 밑줄
      </p>
      <PassageBand
        id={passage.id}
        body={passage.body}
        page={passage.page}
        accentColor={book?.accent_color ?? null}
        comments={[]}
        source={
          book
            ? { title: book.title, author: authorName(book.author) }
            : undefined
        }
        href={
          passage.shelf_item ? `/shelf/${passage.shelf_item.id}` : undefined
        }
        today
        draw={false}
      />
    </section>
  );
}
