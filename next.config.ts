import type { NextConfig } from "next";

/**
 * 표지를 next/image로 그리려면 호스트를 열어줘야 합니다.
 *
 * - `image.aladin.co.kr` — 아직 담지 않은 책(검색 결과)의 표지. 우리 Storage에
 *   복사되기 전이라 알라딘 원본을 그대로 씁니다
 * - Supabase Storage — 담은 뒤의 표지 (`book.cover_path`, 기획서 §7)
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.aladin.co.kr" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
