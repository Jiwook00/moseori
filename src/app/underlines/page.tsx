import Nav from "../nav";

/**
 * 밑줄 (기획서 §5) — **빈 스텁입니다.**
 *
 * 상단 네비에 항목이 있으므로 404가 되지 않게 자리만 만들었습니다. §5가 정한
 * 구성(세로 한 줄, 책마다 다른 배경색, 섞기 버튼)과 문장용 세리프(MaruBuri)는
 * 이 화면을 만들 때 함께 붙입니다.
 */
export default function UnderlinesPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-14 sm:px-7">
        <p className="text-sub text-[12px]">아직 준비 중입니다</p>
      </main>
    </>
  );
}
