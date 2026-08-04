"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * 내용에 따라 높이가 저절로 늘어나는 textarea.
 *
 * 브라우저 기본 리사이즈 손잡이(우하단 그립)를 걷어내고, 대신 입력한 만큼
 * 칸이 따라 늘어납니다 — 종이에 옮겨 적는 감각에 맞춥니다(사용자 지시).
 * 손잡이를 끌어 높이를 맞출 필요가 없습니다.
 *
 * 최소 높이는 `className`의 `min-h-*`가 정합니다. `value`가 밖에서 지워지면
 * (저장 후 초기화) 높이도 다시 최소로 돌아갑니다.
 *
 * `autoFocus`를 주면 커서를 글 **끝**에 둡니다 — 이미 쓴 글을 고치러 들어올 때
 * 이어 쓰는 자리로 바로 가도록. 브라우저 기본은 맨 앞이라 손수 옮깁니다.
 */
export default function GrowTextarea({
  value,
  className,
  autoFocus,
  ...props
}: React.ComponentPropsWithoutRef<"textarea">) {
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
    // 마운트 시 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      {...props}
    />
  );
}
