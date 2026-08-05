import Link from "next/link";
import PassageCard from "./passage-card";

/**
 * 밑줄 한 줄의 **accent 카드 스킨** (design.md §문장 카드).
 *
 * `PassageCard`(내용)에 그 책의 `accent_color` 배경과 카드 여백을 입힙니다.
 * **밑줄 목록**과 **오늘의 밑줄**이 씁니다 — 읽기 폭 720 카드를 왼쪽 거터에 정렬해
 * 스크롤하다 색이 바뀌면 책이 바뀐 것입니다(기획서 §5). `href`를 주면 카드 전체가
 * 그 책 상세로 가는 링크입니다.
 *
 * (책 상세의 밑줄은 이 스킨이 아니라 오른쪽 accent **필드**가 색을 두릅니다 —
 * 한 책 한 색이라 이어진 필드가 맞고 카드로 나누지 않습니다. design.md §책 상세.)
 */
export default function PassageBand({
  accentColor,
  href,
  today = false,
  ...card
}: {
  accentColor: string | null;
  href?: string;
} & React.ComponentProps<typeof PassageCard>) {
  const style = { background: accentColor ?? "var(--color-card)" };
  // 오늘의 밑줄은 문장 16px에 맞춰 여백을 조금 키웁니다 (design.md §오늘의 밑줄).
  const className = today
    ? "block px-[20px] pt-[22px] pb-[16px]"
    : "block px-[18px] pt-[20px] pb-[14px]";
  const content = <PassageCard today={today} {...card} />;

  return href ? (
    <Link href={href} className={className} style={style}>
      {content}
    </Link>
  ) : (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
