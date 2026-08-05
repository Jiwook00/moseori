import Nav from "../nav";

/** 책장·책 상세가 공유하는 틀. 네비는 인증 화면에만 있어 랜딩(`/`)에는 없습니다 (§5). */
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
