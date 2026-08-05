import PassageBand from "@/app/passage-band";
import { authorName } from "@/lib/books/author";
import { createClient } from "@/lib/supabase/server";
import { chooseTodaysPassage } from "@/lib/underline/today";

/**
 * 오늘의 밑줄 (기획서 §5·§6, design.md §오늘의 밑줄).
 *
 * 책장 맨 위 한 장. 문장 카드와 같은 형태에 섹션 라벨을 얹고, 배경은 **그 문장이
 * 속한 책의 accent_color**입니다(고정색 아님). 하루 단위로 고정되고 오래 안 본 것을
 * 우선으로 뽑습니다 — 선택 규칙은 `lib/underline/today.ts`에.
 *
 * **빈 책장에서는 이 컴포넌트를 렌더하지 않습니다** (§5: 오늘의 밑줄 자리도 비움).
 * 호출부(`/shelf`)가 서재가 비었는지 알고 있어 거기서 걸러냅니다. 여기서는 밑줄이
 * 3개 미만인 경우만 처리합니다 — **아무것도 그리지 않습니다**(사용자 지시로 §6의
 * "밑줄을 그어보세요" 안내는 두지 않습니다).
 *
 * 코멘트는 접습니다(teaser). 카드 전체는 그 책 상세로 가는 링크입니다.
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

  // RLS가 내 밑줄만 줍니다. 모든 조회에 deleted_at IS NULL (CLAUDE.md).
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

  // 이번에 처음 고른 것이면 last_shown_at을 찍습니다 (오래 안 본 것 우선의 기록).
  // 하루에 한 번뿐입니다 — 이후 로드는 오늘 것을 그대로 다시 보여줍니다.
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
