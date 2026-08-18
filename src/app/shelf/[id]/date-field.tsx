"use client";

import { useEffect, useRef, useState } from "react";
import { seoulDate } from "@/lib/underline/today";

/**
 * 날짜 하나를 고르는 필드 + 캘린더 팝오버 (design.md 톤: 각진 모서리, 그림자 없음,
 * 강조색 대신 먹색 채움). 값은 "YYYY-MM-DD" 문자열, 비면 빈 문자열.
 * 월 이동 화살표는 아이콘을 늘리지 않으려고 글자(‹ ›)로 그립니다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseYMD(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = parseYMD(value);
  const today = parseYMD(seoulDate(new Date()))!;
  const [view, setView] = useState(() => ({
    y: selected?.y ?? today.y,
    m: selected?.m ?? today.m,
  }));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open && selected) setView({ y: selected.y, m: selected.m });
    setOpen((v) => !v);
  }

  function shiftMonth(delta: number) {
    setView(({ y, m }) => {
      const next = m + delta;
      if (next < 1) return { y: y - 1, m: 12 };
      if (next > 12) return { y: y + 1, m: 1 };
      return { y, m: next };
    });
  }

  function pick(day: number) {
    onChange(`${view.y}-${pad(view.m)}-${pad(day)}`);
    setOpen(false);
  }

  const firstWeekday = new Date(view.y, view.m - 1, 1).getDay();
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div ref={rootRef} className="relative inline-block">
      <span className="text-sub mr-1.5 text-xs">{label}</span>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="border-line bg-card text-ink border px-2.5 py-1 text-xs"
      >
        {selected ? `${selected.y}.${selected.m}.${selected.d}` : "—"}
      </button>

      {open && (
        <div className="border-line bg-card absolute top-full left-0 z-20 mt-1 w-[236px] border p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="이전 달"
              className="text-sub hover:text-ink px-1.5 text-sm leading-none"
            >
              ‹
            </button>
            <span className="text-ink text-xs">
              {view.y}년 {view.m}월
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="다음 달"
              className="text-sub hover:text-ink px-1.5 text-sm leading-none"
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="text-sub flex h-6 items-center justify-center text-[10.5px]"
              >
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} className="h-8" />;
              const isSelected =
                selected?.y === view.y &&
                selected?.m === view.m &&
                selected?.d === day;
              const isToday =
                today.y === view.y && today.m === view.m && today.d === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pick(day)}
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? "bg-ink text-paper mx-auto flex h-8 w-8 items-center justify-center text-xs"
                      : `text-ink hover:bg-paper mx-auto flex h-8 w-8 items-center justify-center text-xs ${
                          isToday ? "font-semibold" : ""
                        }`
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="border-line mt-2 flex justify-between border-t pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-sub hover:text-ink text-xs"
            >
              비우기
            </button>
            <button
              type="button"
              onClick={() => {
                const t = today;
                setView({ y: t.y, m: t.m });
                onChange(`${t.y}-${pad(t.m)}-${pad(t.d)}`);
                setOpen(false);
              }}
              className="text-sub hover:text-ink text-xs"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
