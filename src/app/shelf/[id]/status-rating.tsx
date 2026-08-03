"use client";

import { useState, useTransition } from "react";
import { STATUSES } from "@/lib/shelf/status";
import { setRating, setStatus } from "./actions";

/**
 * 상태와 별점.
 *
 * **둘은 독립입니다** (사용자 지시로 §6의 별점–완독 연동을 제거). 상태를 바꿔도
 * 별점을 묻지 않고, 별점을 매겨도 상태가 바뀌거나 반응이 뜨지 않습니다.
 */

function Star({ filled }: { filled: boolean }) {
  // 각진 별. design.md는 둥근 모서리를 금합니다.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 6 21.3l1.2-6.6L2.4 9.5l6.6-.9z"
        fill={filled ? "var(--color-ink)" : "none"}
        stroke={filled ? "var(--color-ink)" : "var(--color-line)"}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatusRating({
  shelfItemId,
  initialStatus,
  initialRating,
}: {
  shelfItemId: string;
  initialStatus: string;
  initialRating: number | null;
}) {
  const [status, setLocalStatus] = useState(initialStatus);
  const [rating, setLocalRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function chooseStatus(next: string) {
    if (next === status || pending) return;
    setError(null);
    setLocalStatus(next); // 낙관적. 실패하면 되돌립니다.
    startTransition(async () => {
      const result = await setStatus(shelfItemId, next);
      if (!result.ok) {
        setLocalStatus(status);
        setError(result.error);
      }
    });
  }

  function chooseRating(value: number) {
    if (pending) return;
    setError(null);
    const previous = rating;
    setLocalRating(value);
    startTransition(async () => {
      const result = await setRating(shelfItemId, value);
      if (!result.ok) {
        setLocalRating(previous);
        setError(result.error);
      }
    });
  }

  const shown = hover ?? rating ?? 0;

  return (
    <section className="border-line mt-12 border-t pt-8">
      {/* 상태: 배경도 밑줄도 없이 굵기와 색으로만 (design.md §상태 탭) */}
      <div className="flex flex-wrap gap-x-[22px] gap-y-2">
        {STATUSES.map(({ value, label }) => {
          const active = value === status;
          return (
            <button
              key={value}
              type="button"
              onClick={() => chooseStatus(value)}
              disabled={pending}
              aria-pressed={active}
              className={
                active
                  ? "text-[12.5px] font-semibold text-ink"
                  : "text-sub text-[12.5px]"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 별점 */}
      <div className="mt-6 flex items-center gap-3">
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseRating(value)}
              onMouseEnter={() => setHover(value)}
              disabled={pending}
              aria-label={`별점 ${value}점`}
              className="leading-none"
            >
              <Star filled={value <= shown} />
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sub mt-4 text-xs">{error}</p>}
    </section>
  );
}
