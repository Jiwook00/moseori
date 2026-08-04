"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePassage, updatePassage } from "./actions";
import GrowTextarea from "./grow-textarea";

/**
 * 책 상세의 밑줄 한 칸. 문장 카드를 감싸 고치기·지우기를 답니다.
 *
 * 카드 자체(`PassageCard`)는 서버 컴포넌트 그대로 `children`으로 받습니다.
 *
 * **평소에는 조작 요소가 보이지 않습니다**(사용자 지시). 카드에 마우스를 올리면
 * 오른쪽 위 모서리에 닫기 표시(`×`)가 나타나고, 카드를 누르면 고치기 화면으로
 * 바뀝니다. 호버가 없는 기기에서는 `×`를 항상 보입니다 — 안 그러면 지울 방법이
 * 사라집니다.
 *
 * `×`는 SVG 아이콘이 아니라 글자입니다. design.md "하지 말 것"의 아이콘 금지에
 * 걸리는 자리라, 활자로 그려 활자 규격 안에 두었습니다.
 *
 * 고치기 모드에서는 카드 자리에 밑줄 추가와 같은 모양의 입력을 놓습니다.
 * 코멘트는 이번 범위 밖이라 고치기 모드에서 보이지 않습니다 — 코멘트는 지워지지
 * 않고 그대로 남습니다.
 */
export default function PassageItem({
  id,
  body: initialBody,
  page: initialPage,
  children,
}: {
  id: string;
  body: string;
  page: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
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
    startTransition(async () => {
      const result = await updatePassage(id, {
        body,
        page: page.trim() ? Number(page.trim()) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePassage(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form onSubmit={submit}>
        <GrowTextarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          aria-label="문장"
          className="border-line bg-card placeholder:text-sub/70 min-h-[82px] w-full border p-3 font-serif text-[17px] leading-[1.7] outline-none"
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
    <div className="group relative">
      {/*
        카드 전체가 고치기로 가는 버튼입니다. 상세의 문장 카드는 링크가 아니라
        (PassageCard에 href를 주지 않습니다) 안에 다른 조작 요소가 없으므로
        통째로 감싸도 중첩 문제가 없습니다. 지우기(×)는 형제로 위에 띄웁니다.
      */}
      <button
        type="button"
        onClick={openEditor}
        aria-label="이 밑줄 고치기"
        className="block w-full cursor-text text-left"
      >
        {children}
      </button>

      {/*
        오른쪽 위 모서리. 카드 안쪽 여백(30/32px) 안에 들어앉아 문장 첫 줄을
        밀지 않습니다. 호버가 없는 기기에서는 계속 보입니다.
      */}
      <div className="absolute top-[10px] right-[12px] text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
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
            aria-label="이 밑줄 지우기"
            className="text-sub hover:text-ink px-1 text-base leading-none"
          >
            ×
          </button>
        )}
      </div>

      {error && <p className="text-sub mt-2 text-xs">{error}</p>}
    </div>
  );
}
