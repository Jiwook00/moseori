"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * 내용에 따라 높이가 저절로 늘어나는 textarea. 최소 높이는 `className`의 `min-h-*`가 정합니다.
 * `autoFocus`를 주면 커서를 글 끝에 둡니다 — 고치러 들어올 때 이어 쓰는 자리로 바로 가도록.
 */
export default function GrowTextarea({
  value,
  className,
  autoFocus,
  onModEnter,
  onKeyDown,
  ...props
}: React.ComponentPropsWithoutRef<"textarea"> & {
  onModEnter?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    // border-box라 scrollHeight(테두리 제외)에 테두리 높이를 더해야 안 잘립니다.
    const border = el.offsetHeight - el.clientHeight;
    el.style.height = `${el.scrollHeight + border}px`;
  }, [value]);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    // 커서를 글 끝으로. focus()가 맨 앞에 두는 걸 덮어씁니다.
    const end = el.value.length;
    el.setSelectionRange(end, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onKeyDown={(event) => {
        // ⌘↵ / Ctrl+↵으로 저장. 줄바꿈은 그냥 Enter에 남깁니다.
        if (
          onModEnter &&
          event.key === "Enter" &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          onModEnter();
        }
        onKeyDown?.(event);
      }}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      {...props}
    />
  );
}
