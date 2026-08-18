"use client";

import { useOptimistic } from "react";
import PassageCard from "@/app/passage-card";
import AddPassage from "./add-passage";
import PassageItem from "./passage-item";

export type PassageWithComments = {
  id: string;
  body: string;
  page: number | null;
  created_at: string;
  comments: { id: string; body: string; created_at: string }[];
};

export type OptimisticAction =
  | { type: "add"; passage: PassageWithComments }
  | { type: "update"; id: string; body: string; page: number | null }
  | { type: "delete"; id: string };

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
  }
}

/**
 * 밑줄 목록과 입력폼을 한 클라이언트 상태로 묶습니다. 무료 Supabase 왕복을 기다리지 않고
 * 방금 그은 밑줄을 즉시 그리기 위해서입니다 — 저장이 끝나면 revalidate된 진짜 데이터로 바뀌고,
 * 실패하면 낙관적 항목이 스스로 사라집니다.
 */
export default function PassageList({
  shelfItemId,
  passages,
}: {
  shelfItemId: string;
  passages: PassageWithComments[];
}) {
  const [optimistic, applyOptimistic] = useOptimistic(passages, reduce);

  return (
    <>
      <p className="text-sub text-[10.5px] tracking-[0.09em]">
        밑줄{optimistic.length > 0 ? ` ${optimistic.length}` : ""}
      </p>

      {optimistic.length === 0 ? (
        <p className="text-sub mt-4 text-sm">
          아직 밑줄이 없습니다. 좋았던 문장을 그어보세요.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {optimistic.map((passage) => (
            <PassageItem
              key={passage.id}
              id={passage.id}
              body={passage.body}
              page={passage.page}
              applyOptimistic={applyOptimistic}
            >
              <PassageCard
                id={passage.id}
                body={passage.body}
                page={passage.page}
                comments={passage.comments}
                draw={false}
              />
            </PassageItem>
          ))}
        </div>
      )}

      <AddPassage shelfItemId={shelfItemId} applyOptimistic={applyOptimistic} />
    </>
  );
}
