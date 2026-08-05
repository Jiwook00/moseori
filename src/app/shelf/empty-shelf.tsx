import BookSearch from "@/app/search/book-search";

/**
 * 빈 책장 (기획서 §5 빈 상태). 탭도 격자도 없이 검색이 화면의 주인입니다.
 * 버튼을 거치지 않고 그 자리에서 바로 검색합니다.
 */
export default function EmptyShelf() {
  return (
    <section className="pt-[18vh]">
      <p className="text-[15px] leading-relaxed">첫 책을 찾아보세요</p>
      <p className="text-sub mt-1.5 text-[13px] leading-relaxed">
        제목이나 저자를 적으면 됩니다
      </p>

      <div className="mt-7">
        <BookSearch autoFocus />
      </div>
    </section>
  );
}
