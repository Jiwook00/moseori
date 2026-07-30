import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // 오픈 리다이렉트를 막습니다. 앱 안의 경로만 허용합니다.
  const rawNext = searchParams.get("next") ?? "/shelf";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/shelf";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  // 프록시 뒤(Vercel)에서는 origin이 내부 호스트라 그대로 쓰면 안 됩니다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${next}`);
}
