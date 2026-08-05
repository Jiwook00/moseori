import ScribbleLine from "./scribble-line";

/**
 * 문장 카드의 **내용** (design.md §문장 카드).
 *
 * 구성은 문장 →(7px)→ 손으로 그은 선 →(18px)→ 출처와 쪽수 →(24px)→ 코멘트 →(4px)→ 날짜.
 * 손으로 그은 선은 문장과 출처를 가르는 자리에 하나. passage id를 시드로 삼아
 * 매번 다른 파형을 결정적으로 그립니다(같은 문장은 언제 봐도 같은 선).
 *
 * **배경색(accent_color)·여백·링크는 이 컴포넌트가 갖지 않습니다.** 밑줄이 주인공인
 * 화면은 색을 카드가 아니라 **밴드/필드(컨테이너)**가 씁니다 (design.md §레이아웃).
 * - 밑줄 목록: `PassageBand`가 화면 폭 accent 밴드를 두르고 이 내용을 담습니다.
 * - 책 상세: 오른쪽 accent 필드가 색을 두르고, 문장 사이는 직선 구분선 없이
 *   여백과 손그림 선으로만 나뉩니다(사용자 결정).
 * 그래서 여기는 세로 여백만 있는 순수 콘텐츠입니다 — 위/아래 간격은 컨테이너가 줍니다.
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
  /** 밑줄 목록에서만. 출처(책·저자)를 쪽수와 양끝 정렬로 왼쪽에 둡니다. */
  source?: { title: string; author: string | null };
  /**
   * 오늘의 밑줄 변형 (design.md §오늘의 밑줄). 문장을 16px로 키웁니다.
   * 여백은 컨테이너가 정하므로 여기서는 글자 크기만 바뀝니다.
   */
  today?: boolean;
  /**
   * 손그림 선을 그어지는 연출로 등장시킬지 (design.md §모션).
   * 목록·상세는 `false` — 처음부터 완성된 전폭 선으로 봅니다(사용자 지시).
   */
  draw?: boolean;
  /** 그어지는 연출을 쓸 때 순차 등장 지연(초). draw가 false면 무시됩니다. */
  drawDelay?: number;
}) {
  // 출처가 있으면 왼쪽에 책 제목·저자, 없으면 쪽수만 오른쪽에.
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

      {/* 문장과 출처를 가르는 자리. 카드당 선은 정확히 하나 (design.md). */}
      <ScribbleLine
        seed={id}
        animate={draw}
        delay={drawDelay}
        className="mt-[7px] block"
      />

      {footer}

      {/*
        코멘트는 출처와 다른 층입니다 (design.md). 세로선 대신 여백으로 나눕니다 —
        위의 출처 줄과 색·크기 대비가 층을 만듭니다.
      */}
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
