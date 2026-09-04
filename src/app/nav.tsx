"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ScribbleLine from "./scribble-line";
import SearchOverlay from "./search/search-overlay";

/**
 * 상단 네비 (design.md §레이아웃 · §손으로 그은 선).
 * 활성 표시는 손으로 그은 선이고, 네비의 선만 먹색입니다.
 */

const ITEMS = [
  { href: "/shelf", label: "책장" },
  { href: "/underlines", label: "밑줄" },
] as const;

export default function Nav() {
  const pathname = usePathname();
  // 검색 오버레이는 네비가 듭니다. URL을 건드리지 않아 어디서 열든 원래 자리로 돌아옵니다 (§5).
  const [searching, setSearching] = useState(false);

  // ⌘K / Ctrl+K로 어디서나 검색을 엽니다. 오버레이가 ESC 닫기를 맡습니다.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearching(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="border-line border-b">
      <nav className="flex h-13 w-full items-center gap-[22px] px-5 sm:px-7">
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

        {/* 검색은 URL을 갖지 않고 덮개로 열리지만, 자리는 책장·밑줄과 나란합니다 (§5). */}
        <button
          type="button"
          onClick={() => setSearching(true)}
          aria-haspopup="dialog"
          className="text-sub hover:text-ink flex h-full cursor-pointer items-center text-sm font-medium"
        >
          찾기
        </button>
      </nav>

      {searching && <SearchOverlay onClose={() => setSearching(false)} />}
    </header>
  );
}
