import { createClient } from "@/lib/supabase/server";

/**
 * 책장 (기획서 §5). 이번 세션에서는 인증이 통과했다는 것만 확인합니다.
 * 상태 탭 · 표지 격자 · 오늘의 밑줄은 다음 세션입니다.
 */
export default async function ShelfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 py-20 sm:px-7">
      <p className="text-sub text-[10.5px] tracking-[0.09em]">책장</p>
      <p className="mt-6 text-sm">{user?.email}</p>

      <form action="/auth/signout" method="post" className="mt-10">
        <button type="submit" className="text-sub text-xs underline-offset-4">
          로그아웃
        </button>
      </form>
    </main>
  );
}
