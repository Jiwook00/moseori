"use client";

import { useState, useTransition } from "react";
import { deleteReview, saveReview } from "./actions";
import GrowTextarea from "./grow-textarea";

/**
 * 리뷰 에디터 (기획서 §6).
 *
 * textarea 하나가 전부입니다. 에디터 라이브러리를 붙이지 않습니다.
 * **굵게 버튼은 두지 않습니다**(사용자 지시) — 서식이 필요하면 본문에 `**`를
 * 직접 씁니다. 리뷰는 내 글이라 산세리프입니다(§타이포).
 *
 * 수정은 그냥 고쳐 쓰고 저장하는 것이고, 삭제는 아래 "지우기"입니다.
 * 지우기는 실수로 눌리지 않도록 그 자리에서 한 번 더 묻습니다.
 */
export default function ReviewEditor({
  shelfItemId,
  initialBody,
}: {
  shelfItemId: string;
  initialBody: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = body !== savedBody;

  function save() {
    if (pending || !dirty) return;
    setError(null);
    setConfirming(false);
    const snapshot = body;
    startTransition(async () => {
      const result = await saveReview(shelfItemId, snapshot);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedBody(snapshot);
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
      setBody("");
      setSavedBody("");
      setConfirming(false);
    });
  }

  return (
    <section className="border-line mt-10 border-t pt-8">
      <p className="text-sub mb-3 text-[10.5px] tracking-[0.09em]">리뷰</p>

      <GrowTextarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="이 책에 대해 남기고 싶은 말"
        className="border-line bg-card placeholder:text-sub/70 min-h-[160px] w-full border p-4 text-[15px] leading-[1.7] outline-none"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="border-line border px-4 py-1.5 text-xs disabled:opacity-40"
        >
          {pending ? "저장 중" : "저장"}
        </button>
        {!dirty && savedBody && !pending && (
          <span className="text-sub text-xs">저장됨</span>
        )}
        {error && <span className="text-sub text-xs">{error}</span>}

        {savedBody &&
          (confirming ? (
            <span className="ml-auto flex items-center gap-3 text-xs">
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
              className="text-sub hover:text-ink ml-auto text-xs"
            >
              지우기
            </button>
          ))}
      </div>
    </section>
  );
}
