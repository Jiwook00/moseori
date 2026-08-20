"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

/**
 * 내용에 따라 높이가 저절로 늘어나는 textarea. 최소 높이는 `className`의 `min-h-*`가 정합니다.
 * `autoFocus`를 주면 커서를 글 끝에 둡니다 — 고치러 들어올 때 이어 쓰는 자리로 바로 가도록.
 * ref는 안쪽 textarea를 그대로 넘겨줍니다 (쪽수 칸에서 ↑로 문장 끝에 돌아오기 등).
 */
const GrowTextarea = forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea"> & {
    onModEnter?: () => void;
    onArrowDownAtLastLine?: () => void;
  }
>(function GrowTextarea(
  {
    value,
    className,
    autoFocus,
    onModEnter,
    onArrowDownAtLastLine,
    onKeyDown,
    ...props
  },
  forwardedRef,
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current!, []);

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
        // 시각적 마지막 줄에서 ↓ → 다음 칸(쪽수)으로. 위 줄에서는 원래대로 줄 이동.
        if (
          onArrowDownAtLastLine &&
          event.key === "ArrowDown" &&
          caretOnLastVisualLine(event.currentTarget)
        ) {
          event.preventDefault();
          onArrowDownAtLastLine();
        }
        onKeyDown?.(event);
      }}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      {...props}
    />
  );
});

export default GrowTextarea;

/**
 * 커서가 시각적으로 마지막 줄에 있는지. textarea는 커서 좌표 API가 없어, 같은 폭·활자로
 * 접힘까지 재현한 숨은 div에 커서 위치와 글 끝을 각각 표시해 세로 위치를 비교합니다.
 * 자동 줄바꿈된 긴 한 문장도 "보이는 마지막 줄"을 기준으로 판정합니다.
 */
function caretOnLastVisualLine(el: HTMLTextAreaElement): boolean {
  const { selectionStart, selectionEnd, value } = el;
  if (selectionStart !== selectionEnd) return false;

  const cs = getComputedStyle(el);
  const mirror = document.createElement("div");
  const s = mirror.style;
  for (const prop of MIRROR_STYLE_PROPS) {
    s.setProperty(prop, cs.getPropertyValue(prop));
  }
  s.position = "absolute";
  s.top = "0";
  s.left = "-9999px";
  s.visibility = "hidden";
  s.height = "auto";
  s.whiteSpace = "pre-wrap";
  s.overflowWrap = "break-word";
  // 접힘 폭 = 안쪽 콘텐츠 폭. clientWidth(테두리·스크롤바 제외)에 padding을 포함시킵니다.
  s.boxSizing = "border-box";
  s.width = `${el.clientWidth}px`;

  const caret = document.createElement("span");
  const end = document.createElement("span");
  mirror.appendChild(document.createTextNode(value.slice(0, selectionStart)));
  mirror.appendChild(caret);
  mirror.appendChild(document.createTextNode(value.slice(selectionStart)));
  mirror.appendChild(end);

  document.body.appendChild(mirror);
  const onLast = caret.offsetTop === end.offsetTop;
  document.body.removeChild(mirror);
  return onLast;
}

const MIRROR_STYLE_PROPS = [
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "letter-spacing",
  "line-height",
  "text-transform",
  "text-indent",
  "word-spacing",
  "tab-size",
];
