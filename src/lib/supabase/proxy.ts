import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인 없이 볼 수 있는 경로. 이 목록에 없으면 전부 보호됩니다. */
const PUBLIC_PATHS = ["/", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );
}

/**
 * 세션 쿠키를 갱신하면서 접근 권한을 판정합니다.
 *
 * createServerClient와 getClaims() 사이에 다른 코드를 넣지 마세요.
 * 토큰 갱신 타이밍이 어긋나면 사용자가 임의로 로그아웃됩니다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: claims, error } = await supabase.auth.getClaims();
  const isSignedIn = !error && !!claims;

  const { pathname } = request.nextUrl;

  // 로그인한 사람에게 랜딩은 의미가 없습니다. 책장으로 보냅니다. (기획서 §5)
  if (isSignedIn && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/shelf";
    return NextResponse.redirect(url);
  }

  if (!isSignedIn && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 쿠키를 옮겨 담지 않으면 세션이 끊깁니다. response를 그대로 돌려주세요.
  return response;
}
