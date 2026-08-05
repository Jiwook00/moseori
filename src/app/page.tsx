import { SignInButton } from "./sign-in-button";

/** 랜딩 (기획서 §5). 미인증 전용 — 로그인한 사람은 proxy가 /shelf로 보냅니다. */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-5 py-20 sm:px-7">
      <p className="text-sub text-[10.5px] tracking-[0.09em]">모서리</p>

      <h1 className="mt-6 text-2xl leading-[1.6]">
        읽은 책을 기록하고,
        <br />
        좋았던 문장에 밑줄을 긋습니다.
      </h1>

      <p className="text-sub mt-5 text-sm leading-[1.7]">
        접어둔 페이지 모서리에서.
        <br />
        쪽수와 그때의 생각까지 같이 남깁니다.
      </p>

      <div className="mt-10">
        <SignInButton />
      </div>

      <p className="text-sub mt-4 text-xs">가입 절차는 없습니다.</p>

      {error === "auth" ? (
        <p className="text-sub mt-6 text-xs">
          로그인이 끝나지 않았습니다. 다시 시도해 주세요.
        </p>
      ) : null}
    </main>
  );
}
