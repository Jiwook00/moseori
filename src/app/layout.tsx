import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/**
 * 활자 (design.md §타이포그래피).
 * `subsets`를 비워둔 것이 의도적입니다 — next/font가 아는 서브셋은 latin뿐이라
 * 지정하면 한글이 안 내려옵니다. 대신 unicode-range가 잘게 쪼개져 `preload`는 끕니다.
 */
const plexSansKR = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-plex",
});

/** MaruBuri는 수집한 문장에만 씁니다 (§타이포). 400 한 무게만 직접 서빙합니다. */
const maruBuri = localFont({
  src: "./fonts/MaruBuri-Regular.woff2",
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-maru",
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
    <html
      lang="ko"
      className={`${plexSansKR.variable} ${maruBuri.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
