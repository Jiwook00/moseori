import Nav from "../nav";

/**
 * 책장과 책 상세가 공유하는 틀. 상단 네비는 로그인한 사람만 봅니다 —
 * 랜딩(`/`)에는 네비가 없습니다 (§5).
 *
 * 인증 화면이 늘어나면(밑줄·아카이브·설정) route group으로 묶는 게 맞습니다.
 * 지금은 화면이 둘이라 여기와 `/underlines`에서 각각 씁니다.
 */
export default function ShelfLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
