/**
 * 카카오 책 검색 (기획서 §7). `KAKAO_REST_API_KEY`를 읽는 유일한 곳이라 서버에서만 import하세요.
 */

const ENDPOINT = "https://dapi.kakao.com/v3/search/book";

/** 같은 검색어의 결과를 캐시하는 시간. §7 "몇 시간". */
const SEARCH_REVALIDATE_SECONDS = 4 * 60 * 60;

const TIMEOUT_MS = 7000;

export type KakaoBook = {
  title: string;
  contents: string;
  url: string;
  /** "ISBN10 ISBN13". 한쪽이 빈 채로 오기도 합니다 (" 9791186019047"). */
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  sale_price: number;
  /** 120×174로 고정 리사이즈된 썸네일. `fname`에 원본 주소가 들어 있습니다. */
  thumbnail: string;
  status: string;
};

export class KakaoError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "KakaoError";
  }
}

function restApiKey() {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new KakaoError("KAKAO_REST_API_KEY가 없습니다");
  return key;
}

async function call(
  params: Record<string, string>,
  init: RequestInit,
): Promise<KakaoBook[]> {
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams(params).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Authorization: `KakaoAK ${restApiKey()}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    throw new KakaoError("카카오에 닿지 못했습니다", { cause });
  }

  if (!response.ok) {
    throw new KakaoError(`카카오가 ${response.status}를 줬습니다`);
  }

  const body = (await response.json()) as { documents?: KakaoBook[] };
  return body.documents ?? [];
}

export function isbn13Of(book: Pick<KakaoBook, "isbn">): string | null {
  return book.isbn.split(/\s+/).find((part) => /^\d{13}$/.test(part)) ?? null;
}

/** 검색어를 캐시 키로 다듬습니다. 공백 정리 + 소문자화라 표기만 다른 검색이 캐시를 공유합니다. */
export function normalizeQuery(raw: string) {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/** ISBN13이 없는 책은 담을 수 없어(book의 자연키) 결과에서 뺍니다. */
export async function searchBooks(query: string) {
  const documents = await call(
    { query, size: "20" },
    { next: { revalidate: SEARCH_REVALIDATE_SECONDS } },
  );
  return documents.filter((book) => isbn13Of(book));
}

export async function lookUpBook(isbn13: string) {
  const documents = await call(
    { query: isbn13, target: "isbn" },
    { cache: "no-store" },
  );

  const book = documents.find((document) => isbn13Of(document) === isbn13);
  if (!book) throw new KakaoError(`카카오에 ${isbn13} 책이 없습니다`);
  return book;
}
