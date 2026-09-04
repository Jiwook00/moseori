"use client";

import { useEffect } from "react";
import SearchScreen from "./search-screen";

/**
 * 검색 오버레이 (기획서 §5). 종이색으로 불투명하게 덮습니다 — 반투명+블러 모달은
 * design.md §하지 말 것에 걸립니다. 닫힘은 `닫기`·`ESC`·담기 완료 셋입니다.
 * 빈 책장과 같은 화면을 그대로 띄웁니다.
 */
export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    // 덮은 동안 뒤 화면이 스크롤되지 않게 합니다.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="책 검색"
      className="bg-paper fixed inset-0 z-50 overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto w-full max-w-[720px] px-5 pb-24 sm:px-7">
        <div className="flex h-13 items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sub hover:text-ink text-[13px]"
          >
            닫기
          </button>
        </div>
        <SearchScreen onDone={onClose} />
      </div>
    </div>
  );
}
