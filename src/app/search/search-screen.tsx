"use client";

import BookSearch from "./book-search";

/**
 * 검색 화면 (기획서 §5). 빈 책장이 이 화면이고, 네비의 검색도 같은 화면을 덮개로 엽니다.
 * 버튼을 거치지 않고 그 자리에서 바로 검색합니다.
 */
export default function SearchScreen({
  first = false,
  onDone,
}: {
  first?: boolean;
  /** 담기 직전에 부릅니다. 덮개가 자기를 닫는 자리. */
  onDone?: () => void;
}) {
  return (
    <section className="pt-[18vh]">
      <p className="text-[15px] leading-relaxed">
        {first ? "첫 책을 찾아보세요" : "책을 찾아보세요"}
      </p>
      <p className="text-sub mt-1.5 text-[13px] leading-relaxed">
        제목이나 저자를 적으면 됩니다
      </p>

      <div className="mt-7">
        <BookSearch autoFocus onDone={onDone} />
      </div>
    </section>
  );
}
