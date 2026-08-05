"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addPassage } from "./actions";
import GrowTextarea from "./grow-textarea";

/**
 * 밑줄 추가 (기획서 §6 밑줄 입력 · §5).
 *
 * 문장만 있으면 저장됩니다. 쪽수와 코멘트는 선택이고, 코멘트란은 접힌 채로
 * 시작합니다 — 문장을 옮겨 적는 것만으로도 큰 노동이라 필수 항목을 늘리지 않습니다.
 * 모바일·웹 모두 목록 끝의 흐름에 놓입니다 — 하단 고정은 어지러워 걷어냈습니다.
 *
 * 새 밑줄도 **색 위에 쓰는** 감각으로 둡니다 — 세리프 15px. accent 색은 이 폼이 아니라
 * 상세의 오른쪽 필드가 두르므로(design.md §레이아웃) 여기선 배경을 칠하지 않습니다.
 * 투명 위로 필드의 색이 비칩니다. 손그림 선은 저장돼 카드가 될 때 생기므로 입력 중엔
 * 긋지 않습니다(id가 아직 없음). 코멘트는 내 글이라 색 없이 산세리프로 흐릅니다.
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
      {/* 배경·좌우 여백은 상세의 필드가 줍니다. 문장은 세리프 15px로 색 위에 씁니다. */}
      <div className="block">
        <GrowTextarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="좋았던 문장"
          className="placeholder:text-sub/70 text-ink min-h-[56px] w-full bg-transparent font-serif text-[15px] leading-[1.75] outline-none"
        />

        {/* 색 카드 위 컨트롤 칩. 손그림 선은 저장 후 생기므로 여기선 없습니다. */}
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
