"use client";

import { useRef, useState, useTransition } from "react";
import { saveReview } from "./actions";

/**
 * 리뷰 에디터 (기획서 §6).
 *
 * textarea에 "굵게" 버튼 하나. 에디터 라이브러리를 붙이지 않습니다.
 * 지원하는 서식은 `**굵게**`와 줄바꿈, 그게 전부입니다. 리뷰는 내 글이라
 * 산세리프입니다(§타이포).
 */
export default function ReviewEditor({
  shelfItemId,
  initialBody,
}: {
  shelfItemId: string;
  initialBody: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = body !== savedBody;

  function applyBold() {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = body.slice(start, end);
    const next = body.slice(0, start) + `**${selected}**` + body.slice(end);
    setBody(next);
    // 선택이 있었으면 그 바깥을, 없었으면 별표 사이에 커서를 둡니다.
    const caret = selected ? start + 2 + selected.length + 2 : start + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selected ? caret : caret, caret);
    });
  }

  function save() {
    if (pending || !dirty) return;
    setError(null);
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

  return (
    <section className="border-line mt-10 border-t pt-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sub text-[10.5px] tracking-[0.09em]">리뷰</p>
        <button
          type="button"
          onClick={applyBold}
          className="text-sub hover:text-ink text-xs font-semibold"
          aria-label="굵게"
        >
          굵게
        </button>
      </div>

      <textarea
        ref={ref}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="이 책에 대해 남기고 싶은 말"
        rows={5}
        className="border-line bg-card placeholder:text-sub/70 w-full resize-y border p-4 text-[15px] leading-[1.7] outline-none"
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
      </div>
    </section>
  );
}
