/**
 * 알라딘 TTB API 클라이언트 (기획서 §7). `ALADIN_TTB_KEY`를 읽는 유일한 곳이라
 * 서버에서만 import하세요 (클라이언트에서 import하면 키가 번들에 실립니다).
 * 두 엔드포인트 — 검색(ItemSearch)과 상품 조회(ItemLookUp). 쪽수·판형은 후자에만 있습니다.
 */

const BASE = "https://www.aladin.co.kr/ttb/api";

/** 기본값이 2007년 버전입니다. 두 호출 모두 필수입니다. */
const VERSION = "20131101";

/** 같은 검색어의 결과를 캐시하는 시간. §7 "몇 시간". */
const SEARCH_REVALIDATE_SECONDS = 4 * 60 * 60;

const TIMEOUT_MS = 7000;

/** 알라딘 응답의 한 항목. 우리가 읽는 필드만 적었습니다. */
export type AladinItem = {
  itemId: number;
  isbn13?: string;
  isbn?: string;
  title: string;
  author?: string;
  publisher?: string;
  pubDate?: string;
  description?: string;
  cover?: string;
  subInfo?: {
    itemPage?: number;
    packing?: {
      sizeWidth?: number;
      sizeHeight?: number;
      sizeDepth?: number;
      weight?: number;
      styleDesc?: string;
    };
  };
  /** 매핑표의 `raw`. 위에 적지 않은 필드까지 전부 그대로 저장합니다. */
  [key: string]: unknown;
};

export class AladinError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AladinError";
  }
}

function ttbKey() {
  const key = process.env.ALADIN_TTB_KEY;
  if (!key) throw new AladinError("ALADIN_TTB_KEY가 없습니다");
  return key;
}

/**
 * 알라딘은 실패도 HTTP 200으로 주고 본문에 errorCode를 담습니다.
 * 상태 코드만 보면 조용히 빈 결과가 됩니다.
 *
 * Output=JS 응답에 이스케이프되지 않은 제어문자가 섞여 오는 경우가 있어
 * JSON.parse가 실패하면 한 번 걷어내고 다시 시도합니다.
 */
async function call(
  endpoint: string,
  params: Record<string, string>,
  init: RequestInit,
): Promise<{ item?: AladinItem[]; totalResults?: number }> {
  const url = new URL(`${BASE}/${endpoint}`);
  url.search = new URLSearchParams({
    ...params,
    TTBKey: ttbKey(),
    Version: VERSION,
    Output: "JS",
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    throw new AladinError(`알라딘에 닿지 못했습니다 (${endpoint})`, { cause });
  }

  if (!response.ok) {
    throw new AladinError(
      `알라딘이 ${response.status}를 줬습니다 (${endpoint})`,
    );
  }

  const text = await response.text();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    try {
      body = JSON.parse(text.replace(/[\x00-\x1f]/g, " "));
    } catch (cause) {
      throw new AladinError(`알라딘 응답을 읽지 못했습니다 (${endpoint})`, {
        cause,
      });
    }
  }

  const parsed = body as {
    errorCode?: number;
    errorMessage?: string;
    item?: AladinItem[];
    totalResults?: number;
  };

  if (parsed.errorCode) {
    throw new AladinError(
      `알라딘 오류 ${parsed.errorCode}: ${parsed.errorMessage ?? "이유 없음"}`,
    );
  }

  return parsed;
}

/** 검색어를 캐시 키로 다듬습니다. 공백 정리 + 소문자화라 표기만 다른 검색이 캐시를 공유합니다. */
export function normalizeQuery(raw: string) {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * 검색 (기획서 §7). 절판된 책도 담아야 해 outofStockfilter는 끕니다.
 * 캐시는 URL을 키로 쓰는 Next Data Cache에 맡깁니다 (normalizeQuery로 URL이 통일됨).
 */
export async function searchBooks(query: string) {
  const body = await call(
    "ItemSearch.aspx",
    {
      Query: query,
      QueryType: "Keyword",
      SearchTarget: "Book",
      Cover: "Big",
      MaxResults: "20",
      start: "1",
    },
    { next: { revalidate: SEARCH_REVALIDATE_SECONDS } },
  );

  return body.item ?? [];
}

/**
 * 상품 조회 (기획서 §7). 쪽수와 판형을 받으려고 부릅니다. 결과가 book에 저장돼
 * 같은 책을 다시 부를 일이 없으므로 캐시하지 않습니다.
 */
export async function lookUpBook(aladinItemId: string) {
  const body = await call(
    "ItemLookUp.aspx",
    {
      ItemId: aladinItemId,
      ItemIdType: "ItemId",
      Cover: "Big",
      OptResult: "packing",
    },
    { cache: "no-store" },
  );

  const item = body.item?.[0];
  if (!item) throw new AladinError(`알라딘에 ${aladinItemId} 책이 없습니다`);
  return item;
}
