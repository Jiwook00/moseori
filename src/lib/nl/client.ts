/**
 * 국립중앙도서관 ISBN 서지정보 (기획서 §7 · ADR 0004). 카카오에 없는 쪽수·세로 판형을
 * 보조합니다. `NL_SEOJI_CERT_KEY`를 읽는 유일한 곳이라 서버에서만 import하세요.
 *
 * 보조일 뿐이라 결코 던지지 않습니다 — 실패·결측이면 null을 돌려주고, 담기는 그대로 진행됩니다.
 * 표본 절반은 쪽수·크기가 비어 옵니다(오래된 CIP 등록).
 */

const ENDPOINT = "https://www.nl.go.kr/seoji/SearchApi.do";

const TIMEOUT_MS = 7000;

/** 서지정보는 바뀌지 않으니 오래 캐시합니다. */
const REVALIDATE_SECONDS = 30 * 24 * 60 * 60;

export type BookExtra = {
  pageCount: number | null;
  /** mm. 폭은 §5가 표지 비율로 계산하므로 저장하지 않습니다. */
  sizeHeight: number | null;
};

const EMPTY: BookExtra = { pageCount: null, sizeHeight: null };

type SeojiDoc = {
  PAGE?: string;
  BOOK_SIZE?: string;
};

/** "512 p." · "182" · "285p." — 앞 정수만. */
function pageCountOf(page: string | undefined): number | null {
  const match = page?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

/** "183*235" — 이미 mm, `폭*세로`. 세로는 둘째 숫자. (cm 아님) */
function sizeHeightOf(bookSize: string | undefined): number | null {
  const match = bookSize?.match(/(\d+)\s*[*xX×]\s*(\d+)/);
  return match ? Number(match[2]) : null;
}

export async function lookUpBookExtra(isbn13: string): Promise<BookExtra> {
  const key = process.env.NL_SEOJI_CERT_KEY;
  if (!key) return EMPTY;

  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    cert_key: key,
    result_style: "json",
    page_no: "1",
    page_size: "1",
    isbn: isbn13,
  }).toString();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return EMPTY;

    const body = (await response.json()) as { docs?: SeojiDoc[] };
    const doc = body.docs?.[0];
    if (!doc) return EMPTY;

    return {
      pageCount: pageCountOf(doc.PAGE),
      sizeHeight: sizeHeightOf(doc.BOOK_SIZE),
    };
  } catch {
    return EMPTY;
  }
}
