"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { scribblePath } from "@/lib/scribble";

/**
 * 손으로 그은 선 (design.md §손으로 그은 선).
 * 요소 폭을 재고 나서 1 단위 = 1px로 그립니다 — viewBox를 고정하고 CSS로 늘리면
 * 폭이 넓은 요소만 굴곡이 펴집니다. 재기 전에는 아무것도 그리지 않습니다.
 */

const HEIGHT = 12;

export default function ScribbleLine({
  seed,
  className,
  stroke = "var(--color-underline)",
  animate = false,
  delay = 0,
}: {
  /** 대상의 id나 라벨. 같은 시드는 항상 같은 선입니다. */
  seed: string;
  className?: string;
  stroke?: string;
  /** 나타날 때 왼→오른쪽으로 그어집니다 (design.md §모션). 네비 활성 표시는 끕니다. */
  animate?: boolean;
  delay?: number;
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
            // pathLength로 정규화해 실제 길이와 무관하게 dashoffset 1→0.
            pathLength={animate ? 1 : undefined}
            className={animate ? "scribble-draw" : undefined}
            style={animate ? { animationDelay: `${delay}s` } : undefined}
          />
        </svg>
      )}
    </span>
  );
}
