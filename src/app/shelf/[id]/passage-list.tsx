"use client";

import { useOptimistic } from "react";
import AddPassage from "./add-passage";
import PassageItem from "./passage-item";

export type Comment = { id: string; body: string; created_at: string };

export type PassageWithComments = {
  id: string;
  body: string;
  page: number | null;
  created_at: string;
  comments: Comment[];
};

export type OptimisticAction =
  | { type: "add"; passage: PassageWithComments }
  | { type: "update"; id: string; body: string; page: number | null }
  | { type: "delete"; id: string }
  | { type: "addComment"; passageId: string; comment: Comment }
  | {
      type: "updateComment";
      passageId: string;
      commentId: string;
      body: string;
    }
  | { type: "deleteComment"; passageId: string; commentId: string };

// 서버 조회와 같은 정렬(쪽수 오름차순·null은 뒤, 같으면 생성순)로 낙관적 항목을 제자리에 꽂습니다.
function byReadingOrder(
  a: PassageWithComments,
  b: PassageWithComments,
): number {
  if (a.page == null && b.page != null) return 1;
  if (a.page != null && b.page == null) return -1;
  if (a.page != null && b.page != null && a.page !== b.page) {
    return a.page - b.page;
  }
  return a.created_at.localeCompare(b.created_at);
}

function reduce(
  state: PassageWithComments[],
  action: OptimisticAction,
): PassageWithComments[] {
  switch (action.type) {
    case "add":
      return [...state, action.passage].sort(byReadingOrder);
    case "update":
      return state
        .map((p) =>
          p.id === action.id
            ? { ...p, body: action.body, page: action.page }
            : p,
        )
        .sort(byReadingOrder);
    case "delete":
      return state.filter((p) => p.id !== action.id);
    case "addComment":
      return state.map((p) =>
        p.id === action.passageId
          ? { ...p, comments: [...p.comments, action.comment] }
          : p,
      );
    case "updateComment":
      return state.map((p) =>
        p.id === action.passageId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === action.commentId ? { ...c, body: action.body } : c,
              ),
            }
          : p,
      );
    case "deleteComment":
      return state.map((p) =>
        p.id === action.passageId
          ? {
              ...p,
              comments: p.comments.filter((c) => c.id !== action.commentId),
            }
          : p,
      );
  }
}

/**
 * 밑줄 목록과 입력폼을 한 클라이언트 상태로 묶습니다. 무료 Supabase 왕복을 기다리지 않고
 * 방금 그은 밑줄을 즉시 그리기 위해서입니다 — 저장이 끝나면 revalidate된 진짜 데이터로 바뀌고,
 * 실패하면 낙관적 항목이 스스로 사라집니다.
 */
export default function PassageList({
  shelfItemId,
  accentColor,
  passages,
}: {
  shelfItemId: string;
  accentColor: string | null;
  passages: PassageWithComments[];
}) {
  const [optimistic, applyOptimistic] = useOptimistic(passages, reduce);

  return (
    <>
      {/* 상세 맨 윗줄에서 왼쪽 '책장' 링크와 짝지어 같은 크기(text-xs)로 둡니다. */}
      <p className="text-sub text-xs">
        밑줄{optimistic.length > 0 ? ` ${optimistic.length}` : ""}
      </p>

      {optimistic.length === 0 ? (
        <p className="text-sub mt-4 text-sm">
          아직 밑줄이 없습니다. 좋았던 문장을 그어보세요.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          {optimistic.map((passage) => (
            <PassageItem
              key={passage.id}
              passage={passage}
              accentColor={accentColor}
              applyOptimistic={applyOptimistic}
            />
          ))}
        </div>
      )}

      <AddPassage shelfItemId={shelfItemId} applyOptimistic={applyOptimistic} />
    </>
  );
}
