"use client";

import { useRef, useState, useTransition } from "react";
import ScribbleLine from "@/app/scribble-line";
import { addComment, deletePassage, updatePassage } from "./actions";
import CommentItem from "./comment-item";
import GrowTextarea from "./grow-textarea";
import type {
  Comment,
  OptimisticAction,
  PassageWithComments,
} from "./passage-list";

/**
 * 책 상세의 밑줄 한 칸. 읽기 표시를 직접 구성합니다(문장 카드를 통째로 쓰지 않는 이유:
 * 문장과 각 생각을 **따로** 눌러 고쳐야 하므로 클릭 대상이 하나여선 안 됩니다).
 * `/underlines`·오늘의 밑줄은 여전히 읽기 전용 `PassageCard`를 씁니다.
 *
 * 저장은 셋으로 갈립니다 — 문장 "고침", 생각 "남기기", 생각 각각의 "고침/지움"(CommentItem).
 * 세로 리듬(세리프 15px/1.75, 선 mt-[7px], footer mt-[18px], 코멘트 mt-[24px])은
 * `PassageCard`와 맞춰 화면을 오가도 문장이 흔들리지 않게 합니다.
 */
export default function PassageItem({
  passage,
  accentColor,
  applyOptimistic,
}: {
  passage: PassageWithComments;
  accentColor: string | null;
  applyOptimistic: (action: OptimisticAction) => void;
}) {
  const { id, comments } = passage;
  const initialPageStr = passage.page != null ? String(passage.page) : "";

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [body, setBody] = useState(passage.body);
  const [page, setPage] = useState(initialPageStr);
  const [adding, setAdding] = useState(false);
  const [thought, setThought] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 문장칸 ↕ 쪽수칸을 방향키로 오갑니다 (밑줄 남기기와 같은 결).
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pageRef = useRef<HTMLInputElement>(null);

  function focusBodyEnd() {
    const el = bodyRef.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }

  const dirty = body.trim() !== passage.body || page !== initialPageStr;

  function openEditor() {
    setBody(passage.body);
    setPage(initialPageStr);
    setError(null);
    setConfirming(false);
    setEditing(true);
  }

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (pending || !body.trim()) return;
    setError(null);

    const pageNum = page.trim() ? Number(page.trim()) : null;
    const snapshot = { body, page };

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

  function saveThought() {
    const text = thought.trim();
    if (pending || !text) return;
    setError(null);
    setThought("");
    setAdding(false);

    startTransition(async () => {
      const now = new Date().toISOString();
      const comment: Comment = {
        id: `optimistic-${crypto.randomUUID()}`,
        body: text,
        created_at: now,
      };
      applyOptimistic({ type: "addComment", passageId: id, comment });

      const result = await addComment(id, text);
      if (!result.ok) {
        setThought(text);
        setAdding(true);
        setError(result.error);
      }
    });
  }

  return (
    <div
      className="group px-[20px] pt-[22px] pb-[16px]"
      style={{ background: accentColor ?? "var(--color-card)" }}
    >
      {editing ? (
        <form onSubmit={submit}>
          <GrowTextarea
            ref={bodyRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onModEnter={() => submit()}
            onArrowDownAtLastLine={() => pageRef.current?.focus()}
            aria-label="문장"
            autoFocus
            className="placeholder:text-sub/70 text-ink min-h-[44px] w-full bg-transparent font-serif text-[15px] leading-[1.75] outline-none"
          />

          {/* 읽기와 같은 자리의 손그림 선. 같은 시드라 같은 파형입니다. */}
          <ScribbleLine seed={id} className="mt-[7px] block" />

          {/* 쪽수·취소·고침만 한 줄. 고침은 문장이 바뀌었을 때만. */}
          <div className="mt-[18px] flex items-center gap-3">
            <input
              ref={pageRef}
              value={page}
              onChange={(event) =>
                setPage(event.target.value.replace(/[^\d]/g, ""))
              }
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  focusBodyEnd();
                } else if (event.key === "Enter") {
                  // 고침 버튼이 dirty 아닐 때 disabled라 폼 암묵 제출이 막힙니다.
                  // 바꾼 게 없어도 Enter로 편집을 닫습니다.
                  event.preventDefault();
                  if (!body.trim()) return;
                  if (dirty) submit();
                  else setEditing(false);
                }
              }}
              inputMode="numeric"
              placeholder="쪽"
              aria-label="쪽수 (선택)"
              className="border-line bg-card placeholder:text-sub/70 w-16 border px-2 py-1 text-xs outline-none"
            />
            {error && <span className="text-sub text-xs">{error}</span>}
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sub hover:text-ink ml-auto text-xs"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!body.trim() || !dirty || pending}
              className="border-line border px-4 py-1.5 text-xs disabled:opacity-40"
            >
              {pending ? "고치는 중" : "고침"}
            </button>
          </div>

          {/* 파괴적 동작은 편집 줄에서 갈라 아래에 옅게 둡니다. */}
          <div className="mt-3 text-xs">
            {confirming ? (
              <span className="flex items-center gap-3">
                <span className="text-sub">이 밑줄을 지울까요?</span>
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
                className="text-sub/70 hover:text-ink"
              >
                이 밑줄 지우기
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          {/* 문장만 편집기 진입점. 클릭하면 문장 끝에 커서가 갑니다(GrowTextarea). */}
          <button
            type="button"
            onClick={openEditor}
            aria-label="이 밑줄 고치기"
            className="block w-full cursor-text text-left"
          >
            <p className="text-ink font-serif text-[15px] leading-[1.75] whitespace-pre-wrap">
              {passage.body}
            </p>
          </button>

          <ScribbleLine seed={id} className="mt-[7px] block" />

          {passage.page != null && (
            <div className="mt-[18px] flex items-baseline justify-end">
              <span className="text-sub shrink-0 text-xs">
                {passage.page}쪽
              </span>
            </div>
          )}
        </>
      )}

      {/* 생각들 — 읽기·편집 어느 상태든 아래에 흐릅니다. 각각 눌러 고칩니다(§4 여러 개). */}
      {comments.length > 0 && (
        <div className="mt-[24px] flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              passageId={id}
              comment={comment}
              applyOptimistic={applyOptimistic}
            />
          ))}
        </div>
      )}

      {/* 새 생각 입력 — 종이 면으로 띄워 '쌓인 생각'과 '쓰는 중'을 색으로 가릅니다. */}
      {adding && (
        <div className="bg-card border-line mt-6 border p-5">
          <GrowTextarea
            value={thought}
            onChange={(event) => setThought(event.target.value)}
            onModEnter={saveThought}
            placeholder="이 문장에 생각 남기기"
            autoFocus
            className="placeholder:text-sub/70 text-ink min-h-[44px] w-full bg-transparent text-[13px] leading-[1.6] outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            {error && <span className="text-sub text-xs">{error}</span>}
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setThought("");
                setError(null);
              }}
              className="text-sub hover:text-ink ml-auto text-xs"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveThought}
              disabled={!thought.trim() || pending}
              className="border-line border px-4 py-1.5 text-xs disabled:opacity-40"
            >
              남기기
            </button>
          </div>
        </div>
      )}

      {/* 생각 남기기 — 생각들 맨 아래(시간순 자리). 평소엔 옅다가 카드에 손을 얹으면 진해집니다. */}
      {!adding && !editing && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAdding(true);
          }}
          className="text-sub/55 group-hover:text-sub hover:!text-ink mt-4 text-xs transition-colors"
        >
          생각 남기기
        </button>
      )}

      {error && !editing && !adding && (
        <p className="text-sub mt-2 text-xs">{error}</p>
      )}
    </div>
  );
}
