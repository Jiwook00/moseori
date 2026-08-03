"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addPassage } from "./actions";

/**
 * 밑줄 추가 (기획서 §6 밑줄 입력 · §5).
 *
 * 문장만 있으면 저장됩니다. 쪽수와 코멘트는 선택이고, 코멘트란은 접힌 채로
 * 시작합니다 — 문장을 옮겨 적는 것만으로도 큰 노동이라 필수 항목을 늘리지 않습니다.
 * 스크롤과 무관하게 항상 닿을 수 있도록, 모바일에서는 아래에 붙여 둡니다(§5).
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
    <form
      onSubmit={submit}
      className="border-line bg-paper sticky bottom-0 mt-10 border-t pt-5 pb-5 sm:static sm:pb-0"
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="좋았던 문장"
        rows={2}
        className="border-line bg-card placeholder:text-sub/70 w-full resize-y border p-3 font-serif text-[17px] leading-[1.7] outline-none"
      />

      <div className="mt-2 flex items-center gap-3">
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

      {showComment && (
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="이 문장에 대한 생각 (선택)"
          rows={2}
          className="border-line bg-card placeholder:text-sub/70 mt-2 w-full resize-y border p-3 text-[13px] leading-[1.6] outline-none"
        />
      )}

      {error && <p className="text-sub mt-2 text-xs">{error}</p>}
    </form>
  );
}
