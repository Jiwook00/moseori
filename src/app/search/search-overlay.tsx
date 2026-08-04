"use client";

import { useEffect } from "react";
import BookSearch from "./book-search";

/**
 * 검색 오버레이 (기획서 §5).
 *
 * 검색은 화면이 아니라 **어디서나 열리는 오버레이**입니다. 끝나면 원래 자리로
 * 돌아옵니다 — 그래서 URL을 건드리지 않고 네비가 든 상태로만 엽니다.
 *
 * **종이색으로 불투명하게 덮습니다.** 반투명 배경에 블러를 깐 흔한 모달은
 * design.md §하지 말 것(그림자·블러·둥근 모서리)에 걸립니다. 덮개 안의 틀과
 * 입력창은 `BookSearch`의 overlay 형태가 그립니다.
 *
 * 닫힘은 `닫기` · `ESC` · 담기 완료, 셋입니다. 화면을 전부 덮으므로 "바깥"이
 * 없습니다.
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
      className="bg-paper fixed inset-0 z-50"
    >
      <BookSearch
        variant="overlay"
        autoFocus
        onDone={onClose}
        onClose={onClose}
      />
    </div>
  );
}
