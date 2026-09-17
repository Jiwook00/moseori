import { isbn13Of, type KakaoBook } from "./client";

/**
 * 카카오 응답 → book 행 (기획서 §7 매핑표).
 * 쪽수·판형은 카카오에 없어 비워 두고, cover_path 등은 표지를 복사한 뒤 정해집니다 (`cover.ts`).
 */
export type BookInsert = {
  isbn13: string;
  title: string;
  author: string | null;
  publisher: string | null;
  published_at: string | null;
  description: string | null;
  cover_url: string | null;
  raw: KakaoBook;
};

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const ENTITIES: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&amp;": "&",
};

/** 카카오는 contents를 HTML 이스케이프해서 줍니다 ("&lt;문학과 삶&gt;"). */
function unescapeHtml(value: string) {
  return value.replace(/&(lt|gt|quot|#39|amp);/g, (entity) => ENTITIES[entity]);
}

/**
 * 알라딘 시절 원문과 같은 "이름 (지은이), 이름 (옮긴이)" 꼴로 적습니다.
 * 이미 저장된 책과 표기가 섞이지 않고, `authorName`이 역할로 지은이를 골라낼 수 있습니다.
 */
function author(book: KakaoBook): string | null {
  const names = [
    ...book.authors.map((name) => `${name.trim()} (지은이)`),
    ...book.translators.map((name) => `${name.trim()} (옮긴이)`),
  ];
  return names.length > 0 ? names.join(", ") : null;
}

export function toBookInsert(book: KakaoBook): BookInsert {
  const isbn13 = isbn13Of(book);
  if (!isbn13) throw new Error("ISBN13이 없는 책은 담을 수 없습니다");

  return {
    isbn13,
    title: book.title,
    author: author(book),
    publisher: text(book.publisher),
    published_at: /^\d{4}-\d{2}-\d{2}/.test(book.datetime)
      ? book.datetime.slice(0, 10)
      : null,
    description: text(unescapeHtml(book.contents)),
    cover_url: text(book.thumbnail),
    raw: book,
  };
}
