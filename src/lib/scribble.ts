/**
 * 손으로 그은 선 (design.md §손으로 그은 선).
 *
 * 이 앱의 서명입니다. 세 곳에 씁니다 — 문장 카드의 구분선, 상단 네비의 활성 표시,
 * 저장 완료 같은 순간의 반응. 지금 쓰이는 곳은 네비뿐이고 나머지는 이 함수를
 * 그대로 씁니다.
 *
 * 두 가지를 동시에 지켜야 합니다.
 *
 * 1. **매번 다른 파형.** 같은 path를 재사용하면 손으로 그은 게 아니라 도장을 찍은
 *    것처럼 보입니다.
 * 2. **같은 대상은 언제 봐도 같은 선.** 그래서 난수가 아니라 대상의 id를 시드로 삼는
 *    결정적 생성입니다. 렌더마다 흔들리면 그건 손이 아니라 경련입니다.
 *
 * 좌표는 **픽셀 단위 그대로** 만듭니다. viewBox를 요소 폭과 같게 두면
 * 1 단위 = 1px이 되어 가로로 늘어나지 않습니다. design.md가 "요소 폭을 재서 path를
 * 생성하는 방식이 안전합니다"라고 적은 이유입니다 — viewBox를 고정하고 늘리면
 * 폭이 넓은 항목만 굴곡이 펴집니다.
 */

/** 시작·끝점을 흔드는 폭 (px). design.md: ±3px. */
const END_JITTER = 3;
/** 제어점 y를 흔드는 폭 (px). design.md: ±2px. 그 이상은 장난스러워집니다. */
const CONTROL_JITTER = 2;

/** 문자열 시드 → 32bit (xmur3). */
function seedToInt(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 결정적 난수 (mulberry32). 0 이상 1 미만. */
function randomFrom(state: number) {
  let s = state;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 시드와 폭으로 손으로 그은 선의 path를 만듭니다.
 *
 * 제어점 개수는 폭과 무관하게 둘로 고정하고 위치만 폭에 비례시킵니다.
 * 굴곡의 **비율**이 유지되어야 하기 때문입니다 (design.md).
 *
 * @param seed 대상의 id나 라벨. 같은 시드는 항상 같은 선입니다
 * @param width 요소의 실제 폭 (px)
 * @param height SVG 높이 (px). 선은 이 안의 중앙을 지납니다
 */
export function scribblePath(seed: string, width: number, height: number) {
  const random = randomFrom(seedToInt(seed));
  const jitter = (amount: number) => (random() * 2 - 1) * amount;

  const mid = height / 2;
  const y0 = mid + jitter(END_JITTER);
  const y1 = mid + jitter(CONTROL_JITTER);
  const y2 = mid + jitter(CONTROL_JITTER);
  const y3 = mid + jitter(END_JITTER);

  const round = (n: number) => Math.round(n * 100) / 100;

  return [
    `M 0 ${round(y0)}`,
    `C ${round(width / 3)} ${round(y1)}`,
    `${round((width * 2) / 3)} ${round(y2)}`,
    `${round(width)} ${round(y3)}`,
  ].join(" ");
}
