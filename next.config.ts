import type { NextConfig } from "next";

/** next/image로 그리는 표지는 담은 뒤의 Storage 표지뿐입니다 (검색 결과는 <img>). */
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
