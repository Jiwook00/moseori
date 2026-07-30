import sharp from "sharp";

/**
 * 표지를 우리 것으로 만드는 일 (기획서 §7).
 *
 * "표지 URL을 그대로 들고 있지 마세요. 몇 년 뒤 깨집니다."
 *
 * 1. 큰 URL을 먼저 시도
 * 2. 실패하면 알라딘이 준 URL로 폴백
 * 3. 어느 쪽이 저장됐는지 cover_is_large에 기록
 * 4. Storage에 올리면서 대표색을 뽑아 accent_color에 저장
 *
 * 서버 전용입니다 (sharp).
 */

/** 이보다 작으면 이미지가 아니라 에러 페이지나 플레이스홀더로 봅니다. */
const MIN_COVER_BYTES = 3000;

/**
 * 큰 표지로 인정하는 최소 너비.
 *
 * `/cover500/`이 200을 준다고 큰 이미지인 건 아닙니다. 오래된 책에는 이 경로에
 * **원본보다 작은** 파일이 놓여 있습니다 — 확인해보니 『이해선 사진집』(592934)의
 * cover500은 150×155이고 cover200은 그보다 큽니다. 바이트 수로는 걸러지지 않아
 * (10KB로 멀쩡합니다) 실제 픽셀을 봐야 합니다.
 */
const LARGE_MIN_WIDTH = 300;

const FETCH_TIMEOUT_MS = 7000;

/**
 * 큰 표지 URL.
 *
 * 알라딘이 주는 URL은 `/cover200/`이고, 그 조각을 바꾸면 더 큰 이미지가 옵니다.
 * (§7이 예전에 적어두었던 `/coverbig/`는 404입니다.) 확인해보니
 * **`/cover500/`이 500×713px로 응답합니다.** 그래서 경로의 cover* 조각을
 * cover500으로 바꿉니다. 되면 좋고, 안 되면 조용히 200px를 씁니다.
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
 * 큰 것 먼저, 실패하면 원본. 둘 다 실패하면 null입니다.
 *
 * 큰 쪽은 200을 받았다는 것만으로 믿지 않습니다. 실제로 열어보고 충분히 큰지
 * 확인합니다 (LARGE_MIN_WIDTH 주석 참조). 아니면 조용히 원본으로 갑니다 —
 * §7이 정한 그대로입니다.
 *
 * **표지가 없어도 책은 담깁니다.** 여기서 null이 나오면 cover_path와
 * accent_color를 비워둔 채 진행합니다 (§4에서 둘 다 nullable).
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
 * **§3의 정규화 규칙.** 명도를 88~91%, 채도를 15~30%로 강제합니다.
 *
 * 이 규칙이 없으면 어떤 책은 새까맣고 어떤 책은 형광입니다. 명도 상한이 91%인 건
 * 그보다 밝으면 종이색(#F7F4ED)과 구분되지 않기 때문입니다.
 *
 * 색조(H)만 표지에서 오고 나머지 두 축은 앱이 정합니다.
 *
 * 경계에서 1%씩 안으로 들어와 있는 이유: 결과를 16진수로 저장하면 채널마다
 * 8비트로 뭉개집니다. 명도 90% 근처에서는 채널 차이가 6~7밖에 안 되므로
 * 반올림 한 번에 채도가 2%p씩 튑니다. 경계값을 그대로 쓰면 **저장된 색을 다시
 * 재보았을 때** 88~91 / 15~30을 벗어납니다. 안쪽으로 넣어두면 어떤 색이 들어와도
 * 저장된 값이 규칙 안에 있습니다.
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
 * 표지에서 대표색을 뽑습니다.
 *
 * 24×24로 줄여 채널당 4비트로 뭉갠 뒤 가장 넓은 색 덩어리를 고릅니다.
 * 평균색을 쓰면 어떤 표지든 진흙색이 되고, 그냥 최빈색을 쓰면 표지 대부분을
 * 차지하는 흰 여백이 이깁니다. 그래서
 *
 * - 거의 흰색·거의 검은색 픽셀은 후보에서 뺍니다
 * - 채도가 높은 덩어리에 가중치를 줍니다
 *
 * 어차피 명도와 채도는 normalizeAccent가 덮어쓰므로 여기서 정말 고르는 건
 * **색조 하나**입니다. 그 이상 정교해질 이유가 없습니다.
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
