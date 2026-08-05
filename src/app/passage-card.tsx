import ScribbleLine from "./scribble-line";

/**
 * 문장 카드의 내용만 (design.md §문장 카드).
 * 배경색(accent_color)·좌우 여백·링크는 컨테이너(`PassageBand`나 상세의 accent 필드)가
 * 두릅니다 — 여기는 세로 여백만 가진 순수 콘텐츠입니다.
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
  comments,
  source,
  today = false,
  draw = false,
  drawDelay = 0,
}: {
  id: string;
  body: string;
  page: number | null;
  comments: Comment[];
  source?: { title: string; author: string | null };
  /** 오늘의 밑줄 변형 (design.md §오늘의 밑줄). 문장을 16px로 키웁니다. */
  today?: boolean;
  /** 손그림 선을 그어지는 연출로 등장시킬지 (design.md §모션). 목록·상세는 false. */
  draw?: boolean;
  drawDelay?: number;
}) {
  const footer = (source || page != null) && (
    <div className="mt-[18px] flex items-baseline justify-between gap-4">
      {source ? (
        <span className="text-sub min-w-0 truncate text-xs">
          {source.title}
          {source.author ? ` · ${source.author}` : ""}
        </span>
      ) : (
        <span />
      )}
      {page != null && (
        <span className="text-sub shrink-0 text-xs">{page}쪽</span>
      )}
    </div>
  );

  return (
    <>
      <p
        className={`font-serif leading-[1.75] text-ink ${
          today ? "text-[16px]" : "text-[15px]"
        }`}
      >
        {body}
      </p>

      {/* 문장과 출처를 가르는 선. 카드당 하나 (design.md). */}
      <ScribbleLine
        seed={id}
        animate={draw}
        delay={drawDelay}
        className="mt-[7px] block"
      />

      {footer}

      {comments.length > 0 && (
        <div className="mt-[24px] flex flex-col gap-4">
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
    </>
  );
}
