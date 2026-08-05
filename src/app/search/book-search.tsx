"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import ScribbleLine from "@/app/scribble-line";
import type { SearchResult } from "@/app/api/search/route";
import { STATUSES } from "@/lib/shelf/status";

/**
 * 책 검색과 담기 (기획서 §5 · §7). 검색 오버레이와 빈 책장이 이 컴포넌트를 함께 쓰고,
 * `variant`로 껍데기만 다릅니다. 담으면 목록이 아니라 그 책 상세로 갑니다.
 */

/** 담을 때 고를 상태. `덮어둠`은 뺍니다 (읽다 멈춘 책의 상태라 담을 때 고를 일이 없음). */
const ADD_STATUSES = STATUSES.filter(({ value }) => value !== "set_aside");

export default function BookSearch({
  variant = "inline",
  autoFocus = false,
  onDone,
  onClose,
}: {
  /** `inline`은 흐름 안에(빈 책장), `overlay`는 입력창을 위에 고정한 덮개 틀. */
  variant?: "inline" | "overlay";
  autoFocus?: boolean;
  /** 담기 직전에 부릅니다. 오버레이가 자기를 닫는 자리. */
  onDone?: () => void;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
      );
      const body = await response.json();
      if (!response.ok) {
        setResults(null);
        setMessage(body.error ?? "검색에 실패했습니다");
        return;
      }
      setResults(body.results);
      if (body.results.length === 0) setMessage("찾는 책이 없습니다");
    } finally {
      setSearching(false);
    }
  }

  async function add(result: SearchResult, status: string) {
    setAddingId(result.aladinItemId);
    setMessage(null);
    try {
      const response = await fetch("/api/shelf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aladinItemId: result.aladinItemId, status }),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "담지 못했습니다");
        return;
      }
      onDone?.();
      startTransition(() => router.push(`/shelf/${body.shelfItemId}`));
    } finally {
      setAddingId(null);
    }
  }

  const form = (
    <form onSubmit={search} className="flex min-w-0 flex-1 items-center">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="책 제목이나 저자"
        aria-label="책 검색"
        autoFocus={autoFocus}
        className="placeholder:text-sub/70 min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none"
      />
      <button
        type="submit"
        disabled={searching}
        className="text-sub hover:text-ink shrink-0 pl-3 text-[13px] disabled:opacity-50"
      >
        {searching ? "찾는 중" : "찾기"}
      </button>
    </form>
  );

  const body = (
    <>
      {message && <p className="text-sub mt-5 text-[13px]">{message}</p>}

      {results && results.length > 0 && (
        <ul className="mt-9 flex flex-col gap-9">
          {results.map((result) => {
            const adding = addingId === result.aladinItemId;

            // 아직 담지 않은 책이라 표지 픽셀 크기를 몰라 next/image를 쓸 수 없습니다.
            const cover = result.cover ? (
              // self-start가 없으면 items-stretch에 눌려 표지 비율이 망가집니다.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.cover}
                alt=""
                className="w-[64px] shrink-0 self-start"
              />
            ) : (
              <span className="border-line h-[92px] w-[64px] shrink-0 self-start border" />
            );

            const meta = [result.author, result.publisher, result.pubDate]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={result.aladinItemId}>
                {result.shelfItemId ? (
                  <div className="flex gap-5">
                    {cover}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug">{result.title}</p>
                      <p className="text-sub mt-1.5 text-[12px] leading-relaxed">
                        {meta}
                      </p>
                      <p className="text-sub mt-3 text-[12px]">
                        이미 서재에 있어요 ·{" "}
                        <a
                          href={`/shelf/${result.shelfItemId}`}
                          className="underline underline-offset-4"
                        >
                          보러 가기
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-5">
                    {cover}

                    {/* 상태 셋을 처음부터 꺼내 둡니다 — 검색 → 상태 고르기, 두 번의 탭. */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug">{result.title}</p>
                      <p className="text-sub mt-1.5 text-[12px] leading-relaxed">
                        {meta}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {ADD_STATUSES.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            disabled={adding}
                            onClick={() => add(result, value)}
                            className="border-line hover:border-ink border px-2.5 py-1.5 text-[12px] disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (variant === "overlay") {
    return (
      <div className="flex h-full flex-col">
        {/* 네비와 같은 높이·같은 컨테이너. 덮개가 열려도 틀이 흔들리지 않습니다. */}
        <div className="border-line shrink-0 border-b">
          <div className="mx-auto flex h-13 w-full max-w-[720px] items-center px-5 sm:px-7">
            {form}
            <button
              type="button"
              onClick={onClose}
              className="text-sub hover:text-ink shrink-0 pl-5 text-[13px]"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[720px] px-5 pb-24 sm:px-7">
            {body}
          </div>
        </div>
      </div>
    );
  }

  // 흐름 안(빈 책장)에서는 입력창 아래를 손으로 그은 선으로 받칩니다.
  return (
    <>
      <div className="flex items-center">{form}</div>
      <ScribbleLine seed="book-search" className="-mt-px block" />
      {body}
    </>
  );
}
