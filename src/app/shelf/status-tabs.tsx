import Link from "next/link";
import { STATUSES, type ShelfStatus } from "@/lib/shelf/status";

/**
 * 상태 탭 (design.md §상태 탭). 열린 탭은 URL(`?status=`)에 둬 서버에서 그대로 읽습니다.
 * 좁은 화면에서 넘치면 줄바꿈 대신 가로 스크롤로 담습니다(음수 마진으로 여백까지 씀).
 */
export default function StatusTabs({
  active,
  counts,
}: {
  active: ShelfStatus;
  counts: Record<ShelfStatus, number>;
}) {
  return (
    <nav className="-mx-5 flex gap-[22px] overflow-x-auto px-5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {STATUSES.map(({ value, label }) => {
        const isActive = value === active;
        return (
          <Link
            key={value}
            href={`/shelf?status=${value}`}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 text-[12.5px] ${
              isActive ? "text-ink font-semibold" : "text-sub font-normal"
            }`}
          >
            {label}
            <span className="text-sub ml-[5px] text-[11px] font-normal">
              {counts[value]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
