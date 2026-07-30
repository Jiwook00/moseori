"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { scribblePath } from "@/lib/scribble";

/**
 * 손으로 그은 선 (design.md §손으로 그은 선).
 *
 * **폭을 재고 나서 그립니다.** viewBox를 고정해두고 CSS로 늘리면 폭이 넓은 요소만
 * 굴곡이 펴지고 선 굵기도 흐트러집니다. 실제 폭을 재서 1 단위 = 1px로 그려야
 * "폭이 바뀌어도 굴곡 비율과 선 굵기가 유지"됩니다.
 *
 * 재기 전에는 아무것도 그리지 않습니다. 0폭으로 한 번 그리면 선이 튀어나오듯
 * 보입니다.
 */

/**
 * 선을 담는 높이. 시작·끝점이 ±3px, 제어점이 ±2px 흔들리므로(design.md)
 * 굵기 2px까지 합쳐 10px이면 잘리지 않습니다.
 */
const HEIGHT = 10;

export default function ScribbleLine({
  seed,
  className,
  stroke = "var(--color-underline)",
}: {
  /** 대상의 id나 라벨. 같은 시드는 항상 같은 선입니다 */
  seed: string;
  className?: string;
  /** design.md: 기본은 밑줄색, 네비는 먹색 */
  stroke?: string;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={box} aria-hidden className={className}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          fill="none"
          className="block"
        >
          <path
            d={scribblePath(seed, width, HEIGHT)}
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </span>
  );
}
