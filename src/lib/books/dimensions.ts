/**
 * 판형 (기획서 §5).
 *
 * §5는 표지 크기를 이렇게 정했습니다 —
 * **높이만 판형에서 가져오고 폭은 이미지 실제 비율로** 계산합니다.
 * "판형이 정하는 건 크기고, 모양은 이미지가 정합니다."
 *
 * 문제가 하나 있습니다. **알라딘의 `sizeWidth` / `sizeHeight`는 가로·세로가
 * 뒤바뀐 채 오는 책이 있습니다.** 세션 3 표본 18권 중 5권이 그랬습니다 —
 * 세로로 긴 문고본 『소설을 살다』가 "가로 178 × 세로 110"으로 옵니다.
 * `size_height`를 그대로 믿으면 높이가 `110 × 0.7 = 77px`이 되어 **실제 책보다
 * 납작하게** 보입니다. 가로로 긴 책이 있는 건 문제가 아닙니다. 그건 그대로
 * 보여주는 게 맞습니다. 문제는 알라딘이 어느 값이 세로인지를 틀리게 준다는 것입니다.
 *
 * 그래서 **표지 이미지의 방향을 심판으로 씁니다.** 이미지가 세로형이면 판형의 큰
 * 값이 세로, 가로형이면 작은 값이 세로입니다. 진짜 가로형 책은 이미지도 가로형이라
 * 그대로 남고, 잘못 들어온 값만 바로잡힙니다. 정사각형에 가까운 사진집은 어느 쪽으로
 * 계산해도 같습니다.
 *
 * 순수 함수입니다. 알라딘이 준 값은 `book`에 원본으로 남아 있고 보정은 여기서만
 * 일어납니다.
 */

/** 판형 데이터가 없는 책의 기본값 (§5). */
export const DEFAULT_SIZE = { width: 152, height: 225 } as const;

/**
 * 세로/가로 비가 이 안에 들면 정사각형으로 봅니다.
 * 『이해선 사진집』은 판형 257×257, 표지 이미지 200×207입니다 — 이런 책에
 * 방향을 따지는 건 의미가 없습니다.
 */
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

/**
 * §5 표지 격자의 셀 높이. `높이 = size_height × 0.7`.
 * 폭은 여기서 정하지 않습니다 — 이미지 비율이 정합니다 (§5).
 */
export const HEIGHT_PER_MM = 0.7;

export function coverSlotHeight(book: SizeInput) {
  return Math.round(bookSize(book).height * HEIGHT_PER_MM);
}
