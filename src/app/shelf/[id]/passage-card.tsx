import ScribbleLine from "@/app/scribble-line";

/**
 * 문장 카드 (design.md §문장 카드).
 *
 * 배경은 그 책의 accent_color, 각진 모서리. 구성은
 * 문장 →(7px)→ 손으로 그은 선 →(18px)→ 쪽수 →(24px)→ 코멘트 →(4px)→ 날짜.
 * 밑줄 화면과 달리 여기선 한 책만 보므로 출처의 책 제목은 생략하고 쪽수만 둡니다.
 * 코멘트는 출처와 다른 층이라 왼쪽에 짧은 세로선을 둬 구분합니다.
 */

type Comment = { id: string; body: string; created_at: string };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export default function PassageCard({
  id,
  body,
  page,
  accentColor,
  comments,
  drawDelay = 0,
}: {
  id: string;
  body: string;
  page: number | null;
  accentColor: string | null;
  comments: Comment[];
  drawDelay?: number;
}) {
  return (
    <article
      className="px-[30px] pt-[32px] pb-[26px]"
      style={{ background: accentColor ?? "var(--color-card)" }}
    >
      <p className="font-serif text-[21px] leading-[1.75] text-ink">{body}</p>

      {/* 문장과 출처를 가르는 자리. 카드당 선은 정확히 하나 (design.md). */}
      <ScribbleLine
        seed={id}
        animate
        delay={drawDelay}
        className="mt-[7px] block"
      />

      {page != null && (
        <div className="mt-[18px] flex justify-end">
          <span className="text-sub text-xs">{page}쪽</span>
        </div>
      )}

      {comments.length > 0 && (
        <div className="mt-[24px] border-line flex flex-col gap-4 border-l pl-3">
          {comments.map((comment) => (
            <div key={comment.id}>
              <p className="text-[13px] leading-[1.6] text-ink">
                {comment.body}
              </p>
              <p className="text-sub mt-1 text-[11px]">
                {formatDate(comment.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
