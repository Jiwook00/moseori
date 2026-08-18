"use client";

import { useState, useTransition } from "react";
import ScribbleLine from "@/app/scribble-line";
import { deletePassage, updatePassage } from "./actions";
import GrowTextarea from "./grow-textarea";
import type { OptimisticAction } from "./passage-list";

/**
 * 책 상세의 밑줄 한 칸. 문장 카드(`children`)를 감싸 고치기·지우기를 답니다.
 * 조작 요소는 평소 숨었다가 호버 시 나타나고(호버 없는 기기는 항상 보임), 카드를
 * 누르면 그 자리에서 고칩니다 — 읽기와 같은 세리프·손그림 선 위에 투명 textarea만 얹어,
 * 상세 필드의 accent 색이 그대로 비칩니다.
 */
export default function PassageItem({
  id,
  body: initialBody,
  page: initialPage,
  applyOptimistic,
  children,
}: {
  id: string;
  body: string;
  page: number | null;
  applyOptimistic: (action: OptimisticAction) => void;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [page, setPage] = useState(
    initialPage != null ? String(initialPage) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEditor() {
    setBody(initialBody);
    setPage(initialPage != null ? String(initialPage) : "");
    setError(null);
    setConfirming(false);
    setEditing(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !body.trim()) return;
    setError(null);

    const pageNum = page.trim() ? Number(page.trim()) : null;
    const snapshot = { body, page };

    // 카드를 즉시 새 값으로 바꾸고 편집기를 닫는다. 실패하면 아래에서 편집기를 되연다.
    setEditing(false);
    startTransition(async () => {
      applyOptimistic({ type: "update", id, body: body.trim(), page: pageNum });

      const result = await updatePassage(id, {
        body: snapshot.body,
        page: pageNum,
      });
      if (!result.ok) {
        setBody(snapshot.body);
        setPage(snapshot.page);
        setEditing(true);
        setError(result.error);
      }
    });
  }

  function remove() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id });

      const result = await deletePassage(id);
      if (!result.ok) setError(result.error);
    });
  }

  if (editing) {
    return (
      // 읽기 카드와 같은 세로 리듬(세리프 15px/1.75, 선 mt-[7px], footer mt-[18px]).
      <form onSubmit={submit} className="block">
        <GrowTextarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          aria-label="문장"
          autoFocus
          className="placeholder:text-sub/70 text-ink min-h-[44px] w-full bg-transparent font-serif text-[15px] leading-[1.75] outline-none"
        />

        {/* 읽기 카드와 같은 자리의 손그림 선. 같은 시드라 같은 파형입니다. */}
        <ScribbleLine seed={id} className="mt-[7px] block" />

        {/* 색 카드 위 컨트롤 칩(쪽수·제거·취소·고침). footer 자리(mt-[18px])에 둡니다. */}
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
          {error && <span className="text-sub text-xs">{error}</span>}
          {confirming ? (
            <span className="flex items-center gap-3 text-xs">
              <span className="text-sub">지울까요?</span>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="text-sub hover:text-ink disabled:opacity-40"
              >
                지움
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-sub hover:text-ink"
              >
                아니오
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-sub hover:text-ink text-xs"
            >
              제거
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sub hover:text-ink ml-auto text-xs"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!body.trim() || pending}
            className="border-line border px-4 py-1.5 text-xs disabled:opacity-40"
          >
            {pending ? "고치는 중" : "고침"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="relative">
      {/* 문장 전체가 고치기 버튼. 지우기는 편집기 안에서 합니다. */}
      <button
        type="button"
        onClick={openEditor}
        aria-label="이 밑줄 고치기"
        className="block w-full cursor-text text-left"
      >
        {children}
      </button>

      {error && <p className="text-sub mt-2 text-xs">{error}</p>}
    </div>
  );
}
