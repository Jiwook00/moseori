/**
 * 오늘의 밑줄 선택 (기획서 §6). 두 규칙을 결합합니다 — (1) user_id+날짜 시드로 하루 고정,
 * (2) 오래 안 본 것(last_shown_at) 우선. 시드는 "그날의 첫 선택"만 정하고, 하루 고정은
 * "오늘 이미 보여준 게 있으면 그대로 다시"가 지킵니다(찍으면 후보 풀이 바뀌므로).
 * 날짜 경계는 Asia/Seoul 기준입니다 — 서버(Vercel)는 UTC라 명시하지 않으면 어긋납니다.
 */

export type Candidate = {
  id: string;
  last_shown_at: string | null;
  created_at: string;
};

export type Pick = {
  id: string;
  /** 이번에 처음 고른 것이면 true — 호출부가 last_shown_at을 찍습니다. */
  stamp: boolean;
};

/** 밑줄이 이 수 미만이면 오늘의 밑줄을 표시하지 않습니다 (§6). */
export const MIN_PASSAGES = 3;

/** Date → Asia/Seoul 기준 "YYYY-MM-DD". en-CA 로캘이 ISO 형식을 줍니다. */
export function seoulDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
}

/** 문자열 시드 → 32bit (FNV-1a). 결정적 인덱스용. */
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** created_at 오름차순, 동률이면 id로. 불변값이라 시드 인덱스가 안정합니다. */
function byCreated(a: Candidate, b: Candidate): number {
  if (a.created_at !== b.created_at) {
    return a.created_at < b.created_at ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** 오래 안 본 것 우선: last_shown_at 없는 것 → 오래된 것 → created_at. */
function byStaleness(a: Candidate, b: Candidate): number {
  if (!a.last_shown_at && !b.last_shown_at) return byCreated(a, b);
  if (!a.last_shown_at) return -1;
  if (!b.last_shown_at) return 1;
  if (a.last_shown_at !== b.last_shown_at) {
    return a.last_shown_at < b.last_shown_at ? -1 : 1;
  }
  return byCreated(a, b);
}

/**
 * 오늘 보여줄 밑줄 하나를 고릅니다. 3개 미만이면 null.
 *
 * @param passages 살아있는 밑줄 전부 (deleted_at IS NULL)
 * @param userId   시드의 절반
 * @param now      기준 시각 (테스트에서 주입)
 */
export function chooseTodaysPassage(
  passages: Candidate[],
  userId: string,
  now: Date = new Date(),
): Pick | null {
  if (passages.length < MIN_PASSAGES) return null;

  const today = seoulDate(now);

  // 오늘 이미 보여준 것이 있으면 그대로 다시 (하루 고정).
  const shownToday = passages
    .filter(
      (p) => p.last_shown_at && seoulDate(new Date(p.last_shown_at)) === today,
    )
    .sort((a, b) => (a.last_shown_at! < b.last_shown_at! ? 1 : -1));
  if (shownToday.length > 0) return { id: shownToday[0].id, stamp: false };

  // 오래 안 본 것 절반을 후보로 두고, 그 안에서 시드로 고릅니다.
  const window = [...passages]
    .sort(byStaleness)
    .slice(0, Math.max(1, Math.ceil(passages.length / 2)));
  const pool = window.sort(byCreated);
  const index = hashSeed(`${userId}:${today}`) % pool.length;
  return { id: pool[index].id, stamp: true };
}
