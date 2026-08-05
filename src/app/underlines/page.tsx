import PassageBand from "@/app/passage-band";
import { authorName } from "@/lib/books/author";
import { fetchCommentsByPassage } from "@/lib/passage/comments";
import { createClient } from "@/lib/supabase/server";
import Nav from "../nav";

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

export default async function UnderlinesPage() {
  const supabase = await createClient();

  const { data: passages } = await supabase
    .from("passage")
    .select(
      "id, body, page, created_at, shelf_item:shelf_item(id, book:book(title, author, accent_color))",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<PassageRow[]>();

  const passageRows = passages ?? [];
  const commentsByPassage = await fetchCommentsByPassage(
    supabase,
    passageRows.map((p) => p.id),
  );

  return (
    <>
      <Nav />
      {/* 읽기 폭 720. 왼쪽 정렬 — 네비·책장과 왼쪽 모서리를 맞춥니다. */}
      <main className="w-full max-w-[720px] flex-1 px-5 py-14 sm:px-7">
        {passageRows.length === 0 ? (
          <p className="text-sub text-sm">
            아직 그은 밑줄이 없습니다. 책을 열어 좋았던 문장을 그어보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-[28px]">
            {passageRows.map((passage) => {
              const book = passage.shelf_item?.book;
              return (
                <PassageBand
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
