import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트 · Route Handler · Server Action에서 쓰는 Supabase 클라이언트.
 * 요청마다 새로 만듭니다. 모듈 스코프에 담아두지 마세요.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다.
            // 세션 갱신은 미들웨어가 하므로 여기서는 무시해도 됩니다.
          }
        },
      },
    },
  );
}
