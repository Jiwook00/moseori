import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

/**
 * 활자 (design.md §타이포그래피).
 *
 * design.md는 "두 폰트 모두 웹폰트로 직접 서빙하고 `font-display: swap`을 붙입니다"라고
 * 정했습니다. `next/font/google`은 빌드 시점에 폰트 파일을 내려받아 **우리 도메인에서
 * 서빙**합니다 — 런타임에 Google로 나가는 요청이 없으므로 "직접 서빙"입니다.
 *
 * **`subsets`를 지정하지 않는 것이 의도적입니다.** next/font가 아는 서브셋은
 * `latin` / `latin-ext`뿐이라 그걸 지정하면 한글이 아예 안 내려옵니다
 * (한글 UI가 시스템 폰트로 떨어집니다). 비워두면 Google이 주는 CSS를 전부 받아
 * 한글 서브셋까지 내려받습니다. 대신 unicode-range가 100개 넘게 쪼개져 있어
 * `preload`는 끕니다 — `swap`으로 처음 한 번만 폴백을 보이게 두는 쪽이 낫습니다.
 *
 * MaruBuri(수집한 문장)는 이번 화면에 문장이 나오지 않으므로 아직 붙이지 않았습니다.
 */
const plexSansKR = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "모서리",
  description: "읽은 책을 기록하고, 좋았던 문장에 밑줄을 긋는 웹.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${plexSansKR.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
