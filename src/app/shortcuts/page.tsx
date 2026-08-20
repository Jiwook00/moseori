"use client";

import { useRouter } from "next/navigation";
import ShortcutsHelp from "../shortcuts-help";

/**
 * 단축키 도움말은 지금 앱 안에 진입점이 없습니다(네비 `?`·`?` 키를 뺐습니다).
 * 이 경로(`/shortcuts`)로 직접 들어와야 보입니다. 활용은 나중에 — 진입점을 다시 붙이려면
 * 예전처럼 Nav에서 오버레이로 열면 됩니다(git 이력 참고). README에 링크만 남겨둡니다.
 */
export default function ShortcutsPage() {
  const router = useRouter();
  return <ShortcutsHelp onClose={() => router.push("/shelf")} />;
}
