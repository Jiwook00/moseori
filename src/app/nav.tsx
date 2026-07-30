"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ScribbleLine from "./scribble-line";

/**
 * 상단 네비 (design.md §레이아웃 · §손으로 그은 선).
 *
 * 높이 52px, 아래 1px 선. 항목은 14px / 500, 활성은 먹 · 비활성은 보조.
 * **활성 표시는 손으로 그은 선입니다** — 자로 그은 직선을 활성 표시에 쓰지 않습니다.
 * 네비의 선만 먹색(#23211D)이고 나머지는 밑줄색입니다.
 *
 * 아이콘은 검색 하나뿐입니다. design.md는 섞기와 검색 둘을 허용하지만 섞기는
 * 밑줄 화면의 것이라(§5) 그 화면을 만들 때 더합니다. **아이콘을 늘리지 마세요.**
 *
 * 항목 간격 22px은 design.md에 없는 값입니다. 상태 탭과 같은 간격을 써서
 * 리듬을 맞췄습니다.
 */

const ITEMS = [
  { href: "/shelf", label: "책장" },
  { href: "/underlines", label: "밑줄" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-line border-b">
      <nav className="mx-auto flex h-13 w-full max-w-[720px] items-center gap-[22px] px-5 sm:px-7">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-full items-center text-sm font-medium ${
                active ? "text-ink" : "text-sub"
              }`}
            >
              <span className="relative">
                {item.label}
                {active && (
                  <ScribbleLine
                    seed={item.label}
                    stroke="var(--color-ink)"
                    className="absolute inset-x-0 top-full mt-[2px] block"
                  />
                )}
              </span>
            </Link>
          );
        })}

        {/*
          검색은 화면이 아니라 어디서나 열리는 오버레이입니다 (§5). 오버레이는
          아직 없어서 지금은 책장의 검색창을 펼치는 링크입니다.
        */}
        <Link
          href="/shelf?search=1"
          aria-label="책 검색"
          className="text-sub hover:text-ink ml-auto"
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx={6.8} cy={6.8} r={4.6} />
            <path d="M10.4 10.4 L14 14" />
          </svg>
        </Link>
      </nav>
    </header>
  );
}
