/**
 * 판형 (기획서 §5). 높이는 판형에서, 모양(비율)은 표지 이미지에서 가져옵니다.
 *
 * 알라딘의 sizeWidth/sizeHeight는 가로·세로가 뒤바뀐 채 오는 책이 있어(세로로 긴
 * 문고본이 "가로 178 × 세로 110"으로), 표지 이미지의 방향을 심판으로 써서 바로잡습니다 —
 * 이미지가 세로형이면 판형의 큰 값이 세로. 진짜 가로형 책은 이미지도 가로형이라 그대로 남습니다.
 * 순수 함수이고, 알라딘 원본은 `book`에 남습니다.
 */

/** 판형 데이터가 없는 책의 기본값 (§5). */
export const DEFAULT_SIZE = { width: 152, height: 225 } as const;

/** 세로/가로 비가 이 안에 들면 정사각형으로 봐 방향을 따지지 않습니다 (사진집 등). */
const SQUARE_TOLERANCE = 0.04;

export type BookSize = {
  /** mm */
  width: number;
  height: number;
  /** 알라딘이 준 가로·세로를 바꿔 끼웠는지 */
  corrected: boolean;
};

type SizeInput = {
  size_width: number | null;
  size_height: number | null;
  cover_width: number | null;
  cover_height: number | null;
};

export function bookSize(book: SizeInput): BookSize {
  const { size_width, size_height, cover_width, cover_height } = book;

  // 판형이 없으면 기본값. 한쪽만 있는 경우도 믿지 않습니다 —
  // 비율을 만들 수 없으니 반쪽짜리 값보다 기본값이 낫습니다.
  if (!size_width || !size_height) {
    return { ...DEFAULT_SIZE, corrected: false };
  }

  // 표지를 못 받았거나 픽셀을 못 읽은 책. 심판이 없으니 알라딘을 믿습니다.
  if (!cover_width || !cover_height) {
    return { width: size_width, height: size_height, corrected: false };
  }

  const coverRatio = cover_height / cover_width;
  if (Math.abs(coverRatio - 1) <= SQUARE_TOLERANCE) {
    return { width: size_width, height: size_height, corrected: false };
  }

  const long = Math.max(size_width, size_height);
  const short = Math.min(size_width, size_height);

  // 이미지가 세로형이면 긴 쪽이 세로, 가로형이면 짧은 쪽이 세로.
  const height = coverRatio > 1 ? long : short;
  const width = coverRatio > 1 ? short : long;

  return { width, height, corrected: height !== size_height };
}

/** §5 표지 격자: `높이 = size_height × 0.7`. */
export const HEIGHT_PER_MM = 0.7;

/** design.md §표지 격자: 셀 폭. 표지를 이보다 넓게 쓰지 않습니다. */
export const CELL_WIDTH = 148;

/**
 * 표지 상자 (design.md §표지 격자). 높이 = 판형 높이 × 0.7, 폭 = 높이 × 이미지 비율.
 * 폭이 CELL_WIDTH를 넘으면 높이도 같은 비율로 함께 줄입니다(폭만 깎으면 이미지가 눌림).
 */
export function coverBox(book: SizeInput) {
  const size = bookSize(book);
  const height = size.height * HEIGHT_PER_MM;

  // 이미지 픽셀이 없는 책은 모양을 정해줄 심판이 없으니 판형 비율로 대신합니다.
  const ratio =
    book.cover_width && book.cover_height
      ? book.cover_width / book.cover_height
      : size.width / size.height;

  const width = height * ratio;
  const scale = width > CELL_WIDTH ? CELL_WIDTH / width : 1;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
