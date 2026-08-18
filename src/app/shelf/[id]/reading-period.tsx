"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { seoulDate } from "@/lib/underline/today";
import { setReadingDates } from "./actions";
import DateField from "./date-field";

/**
 * 읽은 기간. started_at/finished_at을 그대로 쓰되 직접 고칠 수 있습니다.
 * 날짜를 고르면 바로 저장합니다 — 저장 버튼이 없습니다.
 * 표시는 Asia/Seoul 기준 — 서버(Vercel)는 UTC라 명시하지 않으면 날짜가 밀립니다.
 */

type SeoulYMD = { y: number; m: number; d: number };

function seoulParts(iso: string): SeoulYMD {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** 시작·완독을 "2026.3.2 – 4.18"로. 같은 해면 뒤쪽 연도를 생략합니다. */
function formatRange(started: string | null, finished: string | null): string {
  const s = started ? seoulParts(started) : null;
  const f = finished ? seoulParts(finished) : null;
  const full = (p: SeoulYMD) => `${p.y}.${p.m}.${p.d}`;
  const short = (p: SeoulYMD) => `${p.m}.${p.d}`;
  if (s && f) return `${full(s)} – ${s.y === f.y ? short(f) : full(f)}`;
  if (s) return `${full(s)} –`;
  if (f) return `– ${full(f)}`;
  return "";
}

const toInput = (iso: string | null) => (iso ? seoulDate(new Date(iso)) : "");
const toStamp = (date: string) => (date ? `${date}T12:00:00+09:00` : null);

export default function ReadingPeriod({
  shelfItemId,
  initialStarted,
  initialFinished,
}: {
  shelfItemId: string;
  initialStarted: string | null;
  initialFinished: string | null;
}) {
  const [started, setStarted] = useState(initialStarted);
  const [finished, setFinished] = useState(initialFinished);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setEditing(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [editing]);

  /** 고른 즉시 저장합니다. 한쪽 필드만 바뀌고 나머지는 그대로 넘깁니다. */
  function commit(nextStart: string, nextFinish: string) {
    const startedAt = nextStart || null;
    const finishedAt = nextFinish || null;
    setStarted(toStamp(nextStart));
    setFinished(toStamp(nextFinish));

    if (startedAt && finishedAt && startedAt > finishedAt) {
      setError("시작한 날이 다 읽은 날보다 뒤입니다");
      return;
    }
    setError(null);

    const prev = { started, finished };
    startTransition(async () => {
      const result = await setReadingDates(shelfItemId, {
        startedAt,
        finishedAt,
      });
      if (!result.ok) {
        setStarted(prev.started);
        setFinished(prev.finished);
        setError(result.error);
      }
    });
  }

  const range = formatRange(started, finished);

  if (editing) {
    return (
      <div ref={rootRef} className="mt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <DateField
            label="시작"
            value={toInput(started)}
            onChange={(v) => commit(v, toInput(finished))}
          />
          <DateField
            label="완독"
            value={toInput(finished)}
            onChange={(v) => commit(toInput(started), v)}
          />
        </div>
        {error && <p className="text-sub mt-2 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setEditing(true);
        }}
        disabled={pending}
        className="text-sub text-xs"
      >
        {range || "읽은 기간 남기기"}
      </button>
      {error && <p className="text-sub mt-2 text-xs">{error}</p>}
    </div>
  );
}
