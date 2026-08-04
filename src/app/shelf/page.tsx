import {
  DEFAULT_STATUS,
  STATUSES,
  type ShelfStatus,
  isShelfStatus,
} from "@/lib/shelf/status";
import { createClient } from "@/lib/supabase/server";
import EmptyShelf from "./empty-shelf";
import ShelfGrid, { type ShelfBook } from "./shelf-grid";
import StatusTabs from "./status-tabs";
import TodaysUnderline from "./todays-underline";

/**
 * 책장 (기획서 §5).
 *
 * 맨 위 오늘의 밑줄(§6) → 상태 탭 4종 → 표지 격자.
 *
 * 책이 한 권이라도 있으면 이 화면에 검색 UI는 없습니다. 검색은 네비의 아이콘이 여는
 * 오버레이입니다 (§5). 책이 없을 때만 검색이 화면 전체를 차지합니다.
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

  // 오늘의 밑줄 시드의 절반. 세션 판정은 getClaims (progress.md).
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  /*
   * 아카이브된 항목은 책장에 나오지 않습니다 (§5). 상태는 여기서 걸러내지 않고
   * 전부 받아옵니다 — 탭 4개의 개수를 같은 결과에서 세기 위해서입니다. 한 사람의
   * 서재라 권수가 적고, 탭을 옮길 때마다 다섯 번 세는 것보다 낫습니다.
   *
   * 밑줄 개수는 `passage`의 id를 받아 셉니다. 지운 밑줄은 세지 않습니다
   * (§4 공통 규칙 — 모든 조회에 `deleted_at IS NULL`).
   */
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

  // 빈 책장에는 검색창 말고 아무것도 두지 않습니다 (§5). 탭도, 오늘의 밑줄 자리도.
  const empty = items.length === 0;

  return (
    <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-14 sm:px-7">
      {empty ? (
        <EmptyShelf />
      ) : (
        <>
          {/* 맨 위 오늘의 밑줄 (§5·§6). 밑줄 3개 미만이면 스스로 아무것도 안 그립니다. */}
          {userId && <TodaysUnderline userId={userId} />}

          <StatusTabs active={active} counts={counts} />

          <div className="mt-9">
            {visible.length > 0 ? (
              <ShelfGrid items={visible} />
            ) : (
              <p className="text-sub text-[12px]">여기엔 아직 없습니다</p>
            )}
          </div>
        </>
      )}

      {/*
        로그아웃은 §5에서 설정 화면의 것입니다. /settings가 아직 없어서 여기 남겨둡니다 —
        설정을 만들 때 옮깁니다.
      */}
      <form action="/auth/signout" method="post" className="mt-20">
        <button type="submit" className="text-sub text-[11px]">
          로그아웃
        </button>
      </form>
    </main>
  );
}
