import PassageCard from "@/app/passage-card";
import { authorName } from "@/lib/books/author";
import { createClient } from "@/lib/supabase/server";
import Nav from "../nav";

/**
 * 밑줄 (기획서 §5).
 *
 * 세로 한 줄로 흐릅니다 — 격자로 깔지 않습니다. 카드마다 배경색이 그 책의
 * accent_color라, 스크롤하다 색이 바뀌면 책이 바뀐 것입니다. 카드를 누르면 그
 * 책의 상세로 갑니다(막다른 길 방지). 기본은 최신순.
 *
 * 밑줄 입력은 이 화면이 아니라 책 상세에서 합니다(§5·§6). 여기는 훑어보는 자리입니다.
 * 섞기 버튼은 이번엔 넣지 않았습니다(사용자 지시).
 */

type PassageRow = {
  id: string;
  body: string;
  page: number | null;
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

type CommentRow = {
  id: string;
  passage_id: string;
  body: string;
  created_at: string;
};

export default async function UnderlinesPage() {
  const supabase = await createClient();

  // RLS가 내 밑줄만 줍니다. 모든 조회에 deleted_at IS NULL (CLAUDE.md).
  const { data: passages } = await supabase
    .from("passage")
    .select(
      "id, body, page, created_at, shelf_item:shelf_item(id, book:book(title, author, accent_color))",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PassageRow[]>();

  const passageRows = passages ?? [];

  // 밑줄들의 코멘트를 시간순으로 모아 passage별로 묶습니다(상세 페이지와 같은 방식).
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

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-14 sm:px-7">
        {passageRows.length === 0 ? (
          <p className="text-sub text-sm">
            아직 그은 밑줄이 없습니다. 책을 열어 좋았던 문장을 그어보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-[28px]">
            {passageRows.map((passage) => {
              const book = passage.shelf_item?.book;
              return (
                <PassageCard
                  key={passage.id}
                  id={passage.id}
                  body={passage.body}
                  page={passage.page}
                  accentColor={book?.accent_color ?? null}
                  comments={commentsByPassage.get(passage.id) ?? []}
                  source={
                    book
                      ? { title: book.title, author: authorName(book.author) }
                      : undefined
                  }
                  href={
                    passage.shelf_item
                      ? `/shelf/${passage.shelf_item.id}`
                      : undefined
                  }
                  draw={false}
                />
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
