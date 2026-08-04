import BookSearch from "@/app/search/book-search";

/**
 * 빈 책장 (기획서 §5 빈 상태).
 *
 * "검색창 말고 아무것도 두지 않습니다. 오늘의 밑줄 자리도 비웁니다. 여기서 뭘 해야
 * 하는지 1초 안에 안 보이면 사용자는 나갑니다."
 *
 * 그래서 탭도 격자도 없고, 검색이 화면의 주인입니다. 오버레이를 여는 버튼을 한 번 더
 * 두지 않고 **그 자리에서 바로 검색**합니다 — 첫 방문자 여정(§5)의 다섯 단계에서
 * 탭 하나를 아낍니다.
 *
 * 한 권이라도 담기면 이 화면은 두 번 다시 나오지 않습니다.
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
