import Link from "next/link";
import PassageCard from "./passage-card";

/**
 * `PassageCard`에 그 책의 accent_color 배경과 카드 여백을 입힌 스킨 (design.md §문장 카드).
 * 밑줄 목록과 오늘의 밑줄이 씁니다. `href`를 주면 카드 전체가 그 책 상세로 가는 링크입니다.
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
