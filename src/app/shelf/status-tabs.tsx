import Link from "next/link";
import { STATUSES, type ShelfStatus } from "@/lib/shelf/status";

/**
 * 상태 탭 (design.md §상태 탭).
 *
 * 수평 나열, 간격 22px. 각 항목은 `이름 + 개수`.
 * 활성은 600에 먹, 비활성은 400에 보조.
 * **밑줄이나 배경으로 표시하지 않습니다** — 손으로 그은 선은 네비의 것입니다.
 *
 * 열린 탭은 URL(`?status=`)에 둡니다. 서버에서 그대로 읽으면 되고, 뒤로 가기와
 * 새로고침이 공짜로 따라옵니다.
 */
export default function StatusTabs({
  active,
  counts,
}: {
  active: ShelfStatus;
  counts: Record<ShelfStatus, number>;
}) {
  return (
    <nav className="flex gap-[22px]">
      {STATUSES.map(({ value, label }) => {
        const isActive = value === active;
        return (
          <Link
            key={value}
            href={`/shelf?status=${value}`}
            aria-current={isActive ? "page" : undefined}
            className={`text-[12.5px] ${
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
