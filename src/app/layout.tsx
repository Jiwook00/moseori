import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
