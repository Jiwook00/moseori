"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addPassage } from "./actions";
import GrowTextarea from "./grow-textarea";

/**
 * 밑줄 추가 (기획서 §6 밑줄 입력 · §5). 문장만 있으면 저장되고, 쪽수·코멘트는 선택
 * (코멘트란은 접힌 채 시작). 손그림 선은 저장돼 카드가 될 때 생기므로 입력 중엔 없습니다.
 */
export default function AddPassage({ shelfItemId }: { shelfItemId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !body.trim()) return;
    setError(null);
    const pageNum = page.trim() ? Number(page.trim()) : null;
    startTransition(async () => {
      const result = await addPassage(shelfItemId, {
        body,
        page: pageNum,
        comment: showComment ? comment : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setPage("");
      setComment("");
      setShowComment(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-9">
      <div className="block">
        <GrowTextarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="좋았던 문장"
          className="placeholder:text-sub/70 text-ink min-h-[56px] w-full bg-transparent font-serif text-[15px] leading-[1.75] outline-none"
        />

        <div className="mt-[18px] flex items-center gap-3">
          <input
            value={page}
            onChange={(event) =>
              setPage(event.target.value.replace(/[^\d]/g, ""))
            }
            inputMode="numeric"
            placeholder="쪽"
            aria-label="쪽수 (선택)"
            className="border-line bg-card placeholder:text-sub/70 w-16 border px-2 py-1 text-xs outline-none"
          />
          {!showComment && (
            <button
              type="button"
              onClick={() => setShowComment(true)}
              className="text-sub hover:text-ink text-xs"
            >
              생각 남기기
            </button>
          )}
          <button
            type="submit"
            disabled={!body.trim() || pending}
            className="border-line ml-auto border px-4 py-1.5 text-xs disabled:opacity-40"
          >
            {pending ? "긋는 중" : "밑줄 긋기"}
          </button>
        </div>

        {/* 코멘트는 내 글 — 읽기 카드처럼 색 없이 산세리프로 카드 안에 흐릅니다. */}
        {showComment && (
          <GrowTextarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="이 문장에 대한 생각 (선택)"
            autoFocus
            className="placeholder:text-sub/70 text-ink mt-[24px] min-h-[44px] w-full bg-transparent text-[13px] leading-[1.6] outline-none"
          />
        )}
      </div>

      {error && <p className="text-sub mt-2 text-xs">{error}</p>}
    </form>
  );
}
