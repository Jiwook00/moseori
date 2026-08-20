"use client";

import { useEffect } from "react";

/**
 * 단축키 도움말 (옵션 B). 검색과 같은 종이색 전면 오버레이 위에 종이 카드 하나.
 * 지금은 앱 안에 진입점이 없고 `/shortcuts`로 직접 들어와야 보입니다(활용은 나중에).
 * 닫힘은 `닫기`·`ESC`·카드 바깥 셋입니다.
 */
export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="단축키"
      onClick={onClose}
      className="bg-paper fixed inset-0 z-50 flex items-center justify-center px-5"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-card border-line w-full max-w-[430px] border p-6 sm:p-7"
      >
        <div className="flex items-baseline">
          <h2 className="text-ink text-sm font-semibold">단축키</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sub hover:text-ink ml-auto text-xs"
          >
            닫기
          </button>
        </div>

        <Group label="어디서나">
          <Row desc="책 검색 열기">
            <Key>⌘</Key>
            <Plus />
            <Key>K</Key>
          </Row>
          <Row desc="닫기">
            <Key>Esc</Key>
          </Row>
        </Group>

        <Group label="밑줄을 쓰는 중">
          <Row desc="저장" hint="밑줄 · 문장 고침 · 생각 · 리뷰 · 코멘트">
            <Key>⌘</Key>
            <Plus />
            <Key>↵</Key>
          </Row>
          <Row desc="쪽수 칸으로" hint="문장 마지막 줄에서">
            <Key>↓</Key>
          </Row>
          <Row desc="문장으로 돌아가기" hint="쪽수 칸에서">
            <Key>↑</Key>
          </Row>
        </Group>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line mt-5 border-t pt-4 first-of-type:mt-6">
      <p className="text-sub text-[10.5px] tracking-[0.09em]">{label}</p>
      <div className="mt-1">{children}</div>
    </section>
  );
}

function Row({
  desc,
  hint,
  children,
}: {
  desc: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="text-ink text-[13.5px]">
        {desc}
        {hint && (
          <span className="text-sub mt-0.5 block text-[11.5px]">{hint}</span>
        )}
      </span>
      <span className="ml-auto flex items-center gap-[5px]">{children}</span>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border-line bg-card text-ink font-sans inline-flex h-[22px] min-w-[22px] items-center justify-center border px-1.5 text-xs">
      {children}
    </kbd>
  );
}

function Plus() {
  return <span className="text-sub text-[11px]">+</span>;
}
