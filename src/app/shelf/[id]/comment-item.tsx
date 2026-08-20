"use client";

import { useState, useTransition } from "react";
import { deleteComment, updateComment } from "./actions";
import GrowTextarea from "./grow-textarea";
import type { Comment, OptimisticAction } from "./passage-list";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

/**
 * 쌓인 생각 하나. 문장 편집기 안에서만 씁니다 — 누르면 그 자리에서 고치고, 편집기 안
 * 2단계 확인으로 지웁니다 (밑줄·리뷰 편집과 같은 결). created_at은 고쳐도 그대로입니다.
 */
export default function CommentItem({
  passageId,
  comment,
  applyOptimistic,
}: {
  passageId: string;
  comment: Comment;
  applyOptimistic: (action: OptimisticAction) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEditor() {
    setValue(comment.body);
    setError(null);
    setConfirming(false);
    setEditing(true);
  }

  function submit() {
    const text = value.trim();
    if (pending || !text) return;
    setError(null);
    setEditing(false);

    startTransition(async () => {
      applyOptimistic({
        type: "updateComment",
        passageId,
        commentId: comment.id,
        body: text,
      });
      const result = await updateComment(comment.id, text);
      if (!result.ok) {
        setEditing(true);
        setError(result.error);
      }
    });
  }

  function remove() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({
        type: "deleteComment",
        passageId,
        commentId: comment.id,
      });
      const result = await deleteComment(comment.id);
      if (!result.ok) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="bg-card border-line border p-4">
        <GrowTextarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onModEnter={submit}
          aria-label="생각"
          autoFocus
          className="placeholder:text-sub/70 text-ink min-h-[40px] w-full bg-transparent text-[13px] leading-[1.6] outline-none"
        />
        <div className="mt-2 flex items-center gap-3 text-xs">
          {error && <span className="text-sub">{error}</span>}
          {confirming ? (
            <span className="flex items-center gap-3">
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
              className="text-sub hover:text-ink"
            >
              지움
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sub hover:text-ink ml-auto"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || pending}
            className="border-line border px-3 py-1 disabled:opacity-40"
          >
            고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openEditor}
      aria-label="이 생각 고치기"
      className="block cursor-text text-left"
    >
      <p className="text-ink text-[13px] leading-[1.6] whitespace-pre-wrap">
        {comment.body}
      </p>
      <p className="text-sub mt-1 text-[11px]">
        {formatDate(comment.created_at)}
      </p>
    </button>
  );
}
