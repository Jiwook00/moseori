import {
  DEFAULT_STATUS,
  STATUSES,
  type ShelfStatus,
  isShelfStatus,
} from "@/lib/shelf/status";
import { createClient } from "@/lib/supabase/server";
import SearchScreen from "@/app/search/search-screen";
import ShelfGrid, { type ShelfBook } from "./shelf-grid";
import StatusTabs from "./status-tabs";

/**
 * 책장 (기획서 §5). 상태 탭 4종 → 표지 격자. 검색 UI는 책이 없을 때만 화면을 채우고,
 * 있으면 네비 아이콘이 여는 오버레이가 맡습니다. 오늘의 밑줄은 일단 뺐습니다(progress.md).
 */

type Row = {
  id: string;
  status: string;
  book: ShelfBook["book"] | null;
  passage: { id: string }[];
};

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active: ShelfStatus = isShelfStatus(status) ? status : DEFAULT_STATUS;

  const supabase = await createClient();

  // 상태로 거르지 않고 전부 받아 탭 4개의 개수를 한 결과에서 셉니다 (아카이브만 제외, §5).
  const { data, error } = await supabase
    .from("shelf_item")
    .select(
      "id, status, book:book(title, author, cover_path, cover_width, cover_height, size_width, size_height), passage(id)",
    )
    .is("archived_at", null)
    .is("passage.deleted_at", null)
    .order("status_changed_at", { ascending: false })
    .returns<Row[]>();

  if (error) throw error;

  const items: (ShelfBook & { status: string })[] = (data ?? [])
    .filter((row): row is Row & { book: ShelfBook["book"] } =>
      Boolean(row.book),
    )
    .map((row) => ({
      id: row.id,
      status: row.status,
      book: row.book,
      passageCount: row.passage.length,
    }));

  const counts = Object.fromEntries(
    STATUSES.map(({ value }) => [
      value,
      items.filter((item) => item.status === value).length,
    ]),
  ) as Record<ShelfStatus, number>;

  const visible = items.filter((item) => item.status === active);

  const empty = items.length === 0;

  return (
    // 화면 폭 갤러리 — 표지 격자는 넓게, 상태 탭 같은 읽기 요소는 그 안에서 720 폭으로 (§5).
    <main className="w-full flex-1 px-5 py-14 sm:px-7">
      {empty ? (
        <div className="mx-auto max-w-[720px]">
          <SearchScreen first />
        </div>
      ) : (
        <>
          <div className="max-w-[720px]">
            <StatusTabs active={active} counts={counts} />
          </div>

          <div className="mt-9">
            {visible.length > 0 ? (
              <ShelfGrid items={visible} />
            ) : (
              <p className="text-sub text-[12px]">여기엔 아직 없습니다</p>
            )}
          </div>
        </>
      )}

      {/* 로그아웃은 원래 설정 화면의 것 — /settings를 만들 때 옮깁니다 (§5). */}
      <form action="/auth/signout" method="post" className="mt-20">
        <button type="submit" className="text-sub text-[11px]">
          로그아웃
        </button>
      </form>
    </main>
  );
}
