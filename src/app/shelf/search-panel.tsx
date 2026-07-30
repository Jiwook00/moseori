"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SearchResult } from "@/app/api/search/route";
import { STATUSES } from "@/lib/shelf/status";

/**
 * 검색과 담기 (기획서 §5 · §7).
 *
 * **디자인 이전의 임시 UI입니다.** §5의 검색 오버레이(화면을 덮고, 커서가 들어가
 * 있고, 세 번의 탭)는 다음 세션입니다. 지금은 API가 실제로 도는지 눈으로 보기 위한
 * 최소한의 형태입니다. 활자·간격은 Tailwind 기본 스케일 위의 임시값입니다.
 */

export default function SearchPanel() {
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
      if (body.results.length === 0) setMessage("결과가 없습니다");
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
      // 담으면 목록으로 돌아가지 않고 그 책의 상세로 갑니다 (§5).
      startTransition(() => router.push(`/shelf/${body.shelfItemId}`));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className="mt-10">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="책 제목이나 저자"
          aria-label="책 검색"
          className="border-line placeholder:text-sub/70 bg-card flex-1 border px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={searching}
          className="border-line border px-4 py-2 text-sm disabled:opacity-50"
        >
          {searching ? "찾는 중" : "찾기"}
        </button>
      </form>

      {message && <p className="text-sub mt-4 text-xs">{message}</p>}

      {results && results.length > 0 && (
        <ul className="mt-8 flex flex-col gap-8">
          {results.map((result) => (
            <li key={result.aladinItemId} className="flex gap-4">
              {result.cover && (
                /*
                 * 검색 결과는 next/image를 쓰지 않습니다. 아직 담지 않은 책이라
                 * 표지의 실제 픽셀 크기를 모르는데, next/image는 width·height를
                 * 요구합니다. 아무 값이나 적으면 비율이 틀리고(문고본·사진집·
                 * gif 표지가 다 다릅니다) 개발 콘솔에 경고가 쌓입니다.
                 * 담긴 뒤에는 book.cover_width / cover_height가 있으므로
                 * 그때부터 next/image를 씁니다.
                 */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.cover}
                  alt=""
                  className="w-[72px] self-start"
                />
              )}
              <div className="flex-1">
                <p className="text-sm leading-snug">{result.title}</p>
                <p className="text-sub mt-1 text-xs">
                  {[result.author, result.publisher, result.pubDate]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {result.shelfItemId ? (
                  <p className="text-sub mt-3 text-xs">
                    이미 서재에 있어요 ·{" "}
                    <a
                      href={`/shelf/${result.shelfItemId}`}
                      className="underline underline-offset-4"
                    >
                      보러 가기
                    </a>
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUSES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        disabled={addingId === result.aladinItemId}
                        onClick={() => add(result, value)}
                        className="border-line border px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
