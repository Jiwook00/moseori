import Link from "next/link";
import ScribbleLine from "./scribble-line";

/**
 * 문장 카드 (design.md §문장 카드).
 *
 * 배경은 그 책의 accent_color, 각진 모서리. 구성은
 * 문장 →(7px)→ 손으로 그은 선 →(18px)→ 출처와 쪽수 →(24px)→ 코멘트 →(4px)→ 날짜.
 * 손으로 그은 선은 문장과 출처를 가르는 자리에 하나. passage id를 시드로 삼아
 * 매번 다른 파형을 결정적으로 그립니다(같은 문장은 언제 봐도 같은 선).
 * 코멘트는 여러 개가 시간순으로 쌓이며, 출처와 다른 층으로 보이게 여백으로 나눕니다.
 *
 * 두 화면이 같은 카드를 씁니다.
 * - 책 상세: 한 책만 보므로 `source`를 주지 않아 쪽수만. 카드는 링크가 아닙니다.
 * - 밑줄 목록: 여러 책이 섞이므로 `source`로 책 제목·저자를 보이고, `href`로 카드
 *   전체를 그 책 상세로 보냅니다(§5: 막다른 길이 되지 않게).
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
  source,
  href,
  today = false,
  draw = true,
  drawDelay = 0,
}: {
  id: string;
  body: string;
  page: number | null;
  accentColor: string | null;
  comments: Comment[];
  /** 밑줄 목록에서만. 출처(책·저자)를 쪽수와 양끝 정렬로 왼쪽에 둡니다. */
  source?: { title: string; author: string | null };
  /** 주면 카드 전체가 그 책 상세로 가는 링크가 됩니다. */
  href?: string;
  /**
   * 오늘의 밑줄 변형 (design.md §오늘의 밑줄). 여백 22/20/16, 문장 16px로
   * 키웁니다. 나머지 구성(손그림선·출처·양끝 정렬)은 일반 문장 카드와 같습니다.
   */
  today?: boolean;
  /**
   * 손그림 선을 그어지는 연출로 등장시킬지 (design.md §모션).
   * **지금은 목록·상세 모두 `false`** — 카드의 밑줄은 처음부터 완성된 전폭 선으로
   * 보여줍니다(사용자 지시). 그어지는 연출은 저장 완료 같은 순간용으로 남겨둔
   * 기능이라 prop만 유지합니다.
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

  const inner = (
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
        시안이 택한 방식이고, 위의 출처 줄과 색·크기 대비가 층을 만듭니다.
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

  const className = today
    ? "block px-[20px] pt-[22px] pb-[16px]"
    : "block px-[18px] pt-[20px] pb-[14px]";
  const style = { background: accentColor ?? "var(--color-card)" };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <article className={className} style={style}>
      {inner}
    </article>
  );
}
