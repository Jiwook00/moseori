"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteReview, saveReview } from "./actions";
import GrowTextarea from "./grow-textarea";

/**
 * 리뷰 에디터 (기획서 §6).
 *
 * 밑줄은 `입력 폼 + 정착 카드`로 나뉘는데 리뷰에는 정착된 모습이 없어, 다 쓴
 * 글도 입력 폼에 갇혀 밑줄 옆에서 유독 미완성처럼 보였습니다. 그래서 세 상태로
 * 나눕니다 — 비어 있음(한 줄 권유) · 읽기(정착) · 쓰기(에디터).
 *
 * 읽기 상태의 조작은 밑줄과 같습니다(passage-item.tsx 참고): 본문을 누르면
 * 고치기로 가고(커서는 `cursor-text`), 호버하면 오른쪽 위에 `×`가 나타나 지웁니다.
 *
 * 리뷰는 내 글이라 책의 색(accent_color)을 입지 않고 종이 위에 산세리프로
 * 흐릅니다(사용자 결정). 남의 문장인 밑줄은 색 블록, 내 글인 리뷰는 색 없음 —
 * 물성으로도 둘을 가릅니다.
 *
 * 서식은 `**굵게**`와 줄바꿈뿐입니다(§6). 읽기 상태에서 렌더하므로, 저장된
 * 리뷰에 `**`가 그대로 보이던 문제가 여기서 풀립니다. 에디터 라이브러리는
 * 붙이지 않습니다 — textarea 하나와 작은 렌더러뿐입니다.
 *
 * 저장은 별점처럼 조용히 읽기 상태로 정착합니다(연출 없음, 사용자 결정).
 * 지우기는 실수로 눌리지 않도록 그 자리에서 한 번 더 묻습니다.
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
      <p className="text-sub text-[10.5px] tracking-[0.09em]">리뷰</p>

      {editing ? (
        <>
          <GrowTextarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="이 책에 대해 남기고 싶은 말"
            autoFocus
            className="border-line bg-card placeholder:text-sub/70 mt-4 min-h-[160px] w-full border p-4 text-[15px] leading-[1.7] outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
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
          {/*
            밑줄과 같은 조작(passage-item.tsx). 리뷰 본문을 통째로 눌러 고치기로
            갑니다 — 커서는 `cursor-text`라 "여기서 고칠 수 있다"는 신호가 됩니다.
            지우기(×)는 형제로 위에 띄워 버튼 중첩을 피합니다.
          */}
          <button
            type="button"
            onClick={startEditing}
            aria-label="이 리뷰 고치기"
            className="mt-4 block w-full cursor-text text-left text-[15px] leading-[1.7] text-ink"
          >
            {renderReview(savedBody)}
          </button>

          {/*
            오른쪽 위. 평소엔 숨었다가 호버·포커스에 드러납니다. 호버가 없는
            기기에서는 계속 보입니다 — 안 그러면 지울 방법이 사라집니다.
            `×`는 SVG가 아니라 글자입니다(design.md 아이콘 금지 회피).
          */}
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

/**
 * 리뷰 서식 렌더 (§6 서브셋: `**굵게**`와 줄바꿈뿐).
 *
 * 줄 단위로 나눠 줄바꿈을 살리고, 각 줄에서 `**...**`만 굵게로 바꿉니다.
 * 재독 기록("2028년, 다시 읽음")도 이 굵은 한 줄로 표현됩니다.
 */
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
