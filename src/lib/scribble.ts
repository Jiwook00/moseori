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

/** 시작·끝점을 흔드는 폭 (px). design.md: ±2px. */
const END_JITTER = 2;
/**
 * 안쪽 마디점이 위아래로 흔들리는 폭 (px). design.md §손으로 그은 선.
 * 마디마다 번갈아 이만큼(× 0.6~1) 흔들어 손그림 물결을 만듭니다. 이보다 크면
 * 위아래 폭이 커져 지저분해집니다.
 */
const WAVE_AMPLITUDE = 2.5;

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

/** 물결 한 마디의 목표 길이 (px). 마디 수는 폭 ÷ 이 값입니다. */
const WAVE_LENGTH = 160;

/**
 * 시드와 폭으로 손으로 그은 선의 path를 만듭니다.
 *
 * **폭 끝까지(0→width) 죽 이어지는 하나의 선입니다.** 문장과 출처를 가르는
 * 구분선 자리라 중간에 끊기면 안 됩니다 (design.md §문장 카드의 밑줄).
 *
 * **잔물결의 진폭은 design.md 그대로**(제어점 ±2 / 끝점 ±3) 두고 **빈도만 폭에
 * 비례**시킵니다. 마디 수를 `폭 ÷ WAVE_LENGTH`로 잡으므로, 짧은 네비 라벨은 한
 * 마디로 담백하고 긴 카드 구분선은 시안처럼 여러 번 물결칩니다 — 굴곡의 밀도가
 * 폭과 무관하게 유지됩니다. 마디마다 위아래로 번갈아 흔들어 확실히 물결지게 하되
 * 크기는 시드로 조금씩 달라져 도장처럼 보이지 않습니다.
 *
 * 마디들은 Catmull-Rom을 3차 베지어로 바꿔 매끄럽게 잇습니다 — 각 마디점을
 * 정확히 지나므로 진폭이 노드 값(±2/±3) 밖으로 튀지 않고, 손으로 그은 듯 흐릅니다.
 *
 * @param seed 대상의 id나 라벨. 같은 시드는 항상 같은 선입니다
 * @param width 요소의 실제 폭 (px)
 * @param height SVG 높이 (px). 선은 이 안의 중앙을 지납니다
 */
export function scribblePath(seed: string, width: number, height: number) {
  const random = randomFrom(seedToInt(seed));
  const jitter = (amount: number) => (random() * 2 - 1) * amount;

  const mid = height / 2;
  const segments = Math.max(1, Math.round(width / WAVE_LENGTH));

  // 마디점의 y. 끝점은 ±3 안에서 자유롭게, 안쪽은 위아래로 번갈아 ±2 안에서.
  const ys: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    if (i === 0 || i === segments) {
      ys.push(mid + jitter(END_JITTER));
    } else {
      const sign = i % 2 === 0 ? 1 : -1;
      const magnitude = WAVE_AMPLITUDE * (0.6 + 0.4 * random());
      ys.push(mid + sign * magnitude);
    }
  }

  // Catmull-Rom 접선용 팬텀 노드는 양 끝을 그대로 복제해 끝을 매끄럽게 둡니다.
  const yAt = (i: number) => ys[Math.max(0, Math.min(segments, i))];
  const xAt = (i: number) => (i * width) / segments;
  const dx = width / segments;
  const round = (n: number) => Math.round(n * 100) / 100;

  let path = `M 0 ${round(ys[0])}`;
  for (let i = 0; i < segments; i += 1) {
    const c1x = xAt(i) + dx / 3;
    const c2x = xAt(i + 1) - dx / 3;
    const c1y = ys[i] + (yAt(i + 1) - yAt(i - 1)) / 6;
    const c2y = ys[i + 1] - (yAt(i + 2) - yAt(i)) / 6;
    path += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(xAt(i + 1))} ${round(ys[i + 1])}`;
  }
  return path;
}
