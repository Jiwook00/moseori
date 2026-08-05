import sharp from "sharp";

/**
 * 표지를 우리 Storage로 복사합니다 (기획서 §7 — 표지 URL을 그대로 들고 있으면 깨집니다).
 * 큰 URL을 먼저 받고 실패하면 원본으로 폴백하며, 올리면서 대표색을 뽑습니다. 서버 전용(sharp).
 */

/** 이보다 작으면 이미지가 아니라 에러 페이지나 플레이스홀더로 봅니다. */
const MIN_COVER_BYTES = 3000;

/**
 * 큰 표지로 인정하는 최소 너비. `/cover500/`이 200을 준다고 큰 이미지는 아닙니다 —
 * 오래된 책에는 이 경로에 원본보다 작은 파일이 놓여 있어(바이트로는 못 거름) 실제 픽셀을 봐야 합니다.
 */
const LARGE_MIN_WIDTH = 300;

const FETCH_TIMEOUT_MS = 7000;

/**
 * 큰 표지 URL. 알라딘이 주는 `/cover200/` 조각을 `/cover500/`으로 바꿉니다
 * (§7의 옛 `/coverbig/`는 404). 안 되면 호출부가 조용히 200px를 씁니다.
 */
export function largeCoverUrl(url: string): string | null {
  const replaced = url.replace(/\/cover[^/]*\//, "/cover500/");
  return replaced === url ? null : replaced;
}

export type FetchedCover = {
  bytes: Uint8Array<ArrayBuffer>;
  contentType: string;
  isLarge: boolean;
  /** 픽셀 크기. 읽지 못했으면 null (§5 격자와 판형 판정에 씁니다). */
  width: number | null;
  height: number | null;
};

/** 픽셀 크기. 읽지 못하면 둘 다 null (이미지가 아니거나 깨진 파일). */
async function dimensions(bytes: Uint8Array<ArrayBuffer>) {
  try {
    const { width, height } = await sharp(bytes).metadata();
    return { width: width ?? null, height: height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

async function get(url: string): Promise<FetchedCover | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < MIN_COVER_BYTES) return null;

    return {
      bytes,
      contentType,
      isLarge: false,
      ...(await dimensions(bytes)),
    };
  } catch {
    return null;
  }
}

/**
 * 큰 것 먼저, 실패하면 원본, 둘 다 실패하면 null. 큰 쪽은 200 응답만으론 믿지 않고
 * 실제 픽셀이 충분히 큰지 확인합니다 (LARGE_MIN_WIDTH). null이어도 책은 담깁니다.
 */
export async function fetchCover(
  coverUrl: string,
): Promise<FetchedCover | null> {
  const largeUrl = largeCoverUrl(coverUrl);
  if (largeUrl) {
    const large = await get(largeUrl);
    if (large?.width && large.width >= LARGE_MIN_WIDTH) {
      return { ...large, isLarge: true };
    }
  }
  return await get(coverUrl);
}

/** content-type → 파일 확장자. 모르는 형식은 저장하지 않습니다. */
export function extensionFor(contentType: string): string | null {
  const type = contentType.split(";")[0].trim().toLowerCase();
  switch (type) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 대표색
// ---------------------------------------------------------------------------

type Rgb = { r: number; g: number; b: number };

function rgbToHsl({ r, g, b }: Rgb) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;

  h = (h / 6) % 1;
  return { h: h < 0 ? h + 1 : h, s, l };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const channel = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };

  return {
    r: Math.round(channel(h + 1 / 3) * 255),
    g: Math.round(channel(h) * 255),
    b: Math.round(channel(h - 1 / 3) * 255),
  };
}

function toHex({ r, g, b }: Rgb) {
  const pair = (v: number) =>
    Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${pair(r)}${pair(g)}${pair(b)}`;
}

/**
 * §3 정규화 규칙: 색조(H)만 표지에서 오고, 명도 88~91%·채도 15~30%는 앱이 강제합니다
 * (명도 상한은 종이색 #F7F4ED과 구분되도록). 경계값은 1%씩 안으로 넣었습니다 —
 * 16진수 저장 시 반올림으로 채도가 튀어, 저장된 색을 다시 재면 범위를 벗어나기 때문입니다.
 */
const LIGHTNESS_RANGE = [0.885, 0.905] as const;
const SATURATION_RANGE = [0.16, 0.29] as const;

export function normalizeAccent(rgb: Rgb): string {
  const { h, s, l } = rgbToHsl(rgb);
  const clamp = (v: number, [min, max]: readonly [number, number]) =>
    Math.max(min, Math.min(max, v));

  return toHex(
    hslToRgb(h, clamp(s, SATURATION_RANGE), clamp(l, LIGHTNESS_RANGE)),
  );
}

/**
 * 표지에서 대표색을 뽑습니다. 24×24로 줄여 색 덩어리를 세되, 흰 여백·검은 글자는 빼고
 * 채도 높은 덩어리에 가중치를 줍니다. normalizeAccent가 명도·채도를 덮어쓰므로 여기서
 * 정말 고르는 건 색조 하나입니다.
 */
export async function extractAccentColor(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string | null> {
  let pixels: Buffer;
  try {
    pixels = await sharp(bytes)
      .resize(24, 24, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer();
  } catch {
    return null;
  }

  type Bin = { count: number; r: number; g: number; b: number; s: number };
  const bins = new Map<number, Bin>();
  let all: Bin = { count: 0, r: 0, g: 0, b: 0, s: 0 };

  for (let i = 0; i + 2 < pixels.length; i += 3) {
    const rgb = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
    const { s, l } = rgbToHsl(rgb);

    all = {
      count: all.count + 1,
      r: all.r + rgb.r,
      g: all.g + rgb.g,
      b: all.b + rgb.b,
      s: all.s + s,
    };

    // 표지의 흰 여백과 검은 글자를 후보에서 뺍니다.
    if (l < 0.08 || l > 0.95) continue;

    const key = ((rgb.r >> 4) << 8) | ((rgb.g >> 4) << 4) | (rgb.b >> 4);
    const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0, s: 0 };
    bins.set(key, {
      count: bin.count + 1,
      r: bin.r + rgb.r,
      g: bin.g + rgb.g,
      b: bin.b + rgb.b,
      s: bin.s + s,
    });
  }

  const mean = (bin: Bin) => ({
    r: Math.round(bin.r / bin.count),
    g: Math.round(bin.g / bin.count),
    b: Math.round(bin.b / bin.count),
  });

  let best: Bin | null = null;
  let bestScore = 0;
  for (const bin of bins.values()) {
    // 넓이 × (채도 + 바닥값). 바닥값이 없으면 한 점짜리 형광색이 이깁니다.
    const score = bin.count * (0.35 + bin.s / bin.count);
    if (score > bestScore) {
      bestScore = score;
      best = bin;
    }
  }

  // 흑백 표지처럼 후보가 전부 걸러진 경우. 색조만 평균에서 빌려옵니다.
  if (!best) best = all.count > 0 ? all : null;
  if (!best) return null;

  return normalizeAccent(mean(best));
}
