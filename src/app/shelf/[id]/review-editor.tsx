"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteReview, saveReview } from "./actions";
import GrowTextarea from "./grow-textarea";

/**
 * 리뷰 에디터 (기획서 §6). 세 상태로 나눕니다 — 비어 있음(한 줄 권유)·읽기(정착)·쓰기.
 * 리뷰는 내 글이라 accent 색 없이 종이 위에 산세리프로 흐릅니다(밑줄과 물성으로 구분).
 * 서식은 `**굵게**`와 줄바꿈뿐이라 에디터 라이브러리 없이 textarea와 작은 렌더러로 냅니다.
 */
export default function ReviewEditor({
  shelfItemId,
  initialBody,
}: {
  shelfItemId: string;
  initialBody: string;
}) {
  const [savedBody, setSavedBody] = useState(initialBody);
  const [draft, setDraft] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = draft !== savedBody;
  const canSave = draft.trim().length > 0 && dirty && !pending;

  function startEditing() {
    setDraft(savedBody);
    setError(null);
    setConfirming(false);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(savedBody);
    setError(null);
    setEditing(false);
  }

  function save() {
    if (!canSave) return;
    setError(null);
    const snapshot = draft;
    startTransition(async () => {
      const result = await saveReview(shelfItemId, snapshot);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedBody(snapshot);
      setEditing(false);
    });
  }

  function remove() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(shelfItemId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedBody("");
      setDraft("");
      setEditing(false);
      setConfirming(false);
    });
  }

  return (
    <section className="border-line mt-10 border-t pt-8">
      {/* 상세의 '밑줄' 라벨과 짝을 맞춰 12px(text-xs). 다른 섹션 라벨은 10.5px 규격 유지. */}
      <p className="text-sub text-xs">리뷰</p>

      {editing ? (
        <>
          <GrowTextarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onModEnter={save}
            placeholder="이 책에 대해 남기고 싶은 말"
            autoFocus
            className="placeholder:text-sub/70 text-ink mt-4 min-h-[112px] w-full bg-transparent text-[15px] leading-[1.7] outline-none"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="border-line border px-4 py-1.5 text-xs disabled:opacity-40"
            >
              {pending ? "저장 중" : "저장"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={pending}
              className="text-sub hover:text-ink text-xs disabled:opacity-40"
            >
              취소
            </button>
            {error && <span className="text-sub text-xs">{error}</span>}
          </div>
        </>
      ) : savedBody ? (
        <div className="group relative">
          {/* 밑줄과 같은 조작(passage-item.tsx): 본문을 눌러 고치기, ×는 형제로 띄웁니다. */}
          <button
            type="button"
            onClick={startEditing}
            aria-label="이 리뷰 고치기"
            className="mt-4 block w-full cursor-text text-left text-[15px] leading-[1.7] text-ink"
          >
            {renderReview(savedBody)}
          </button>

          {/* 오른쪽 위. 호버 없는 기기에서는 계속 보입니다. ×는 아이콘이 아니라 글자입니다. */}
          <div className="absolute top-0 right-0 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            {confirming ? (
              <span className="flex items-center gap-3">
                <span className="text-sub">지울까요?</span>
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="hover:text-ink disabled:opacity-40"
                >
                  지움
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="text-sub hover:text-ink"
                >
                  취소
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                aria-label="이 리뷰 지우기"
                className="text-sub hover:text-ink px-1 text-base leading-none"
              >
                ×
              </button>
            )}
          </div>

          {error && <p className="text-sub mt-2 text-xs">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="text-sub hover:text-ink mt-4 text-sm"
        >
          이 책에 대해 남기기
        </button>
      )}
    </section>
  );
}

/** 리뷰 서식 렌더 (§6 서브셋). 줄 단위로 나눠 줄바꿈을 살리고 `**...**`만 굵게로 바꿉니다. */
function renderReview(body: string) {
  return body.split("\n").map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(/(\*\*.+?\*\*)/g).map((part, partIndex) => {
        const bold = /^\*\*(.+?)\*\*$/.exec(part);
        return bold ? (
          <strong key={partIndex} className="font-semibold">
            {bold[1]}
          </strong>
        ) : (
          <Fragment key={partIndex}>{part}</Fragment>
        );
      })}
    </Fragment>
  ));
}
