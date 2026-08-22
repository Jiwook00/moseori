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
  // sharp의 네이티브 `.node`는 형제 패키지의 libvips 공유 라이브러리(libvips-cpp.so)를
  // 런타임에 dlopen합니다. 파일 트레이싱이 이 동적 로드를 못 따라가 Vercel 함수 번들에서
  // libvips가 빠지고, 표지를 처리하는 /api/shelf만 ERR_DLOPEN_FAILED로 죽습니다.
  outputFileTracingIncludes: {
    "/api/shelf": ["./node_modules/@img/**/*"],
  },
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
