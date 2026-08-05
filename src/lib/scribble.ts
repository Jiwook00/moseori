/**
 * 손으로 그은 선 (design.md §손으로 그은 선). 대상의 id를 시드로 삼는 결정적 생성이라
 * 매번 다른 파형이지만 같은 대상은 언제 봐도 같은 선입니다. 좌표는 픽셀 단위로 만듭니다.
 */

/** 시작·끝점을 흔드는 폭 (px). design.md: ±2px. */
const END_JITTER = 2;
/** 안쪽 마디점이 위아래로 번갈아 흔들리는 폭 (px). design.md §손으로 그은 선. */
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
 * 시드와 폭으로 손으로 그은 선의 path를 만듭니다. 0→width로 끊김 없이 이어지는 한 줄.
 * 진폭은 고정하고 마디 수만 폭에 비례시켜(폭 ÷ WAVE_LENGTH) 굴곡 밀도를 폭과 무관하게
 * 유지합니다. 마디는 Catmull-Rom을 3차 베지어로 바꿔 각 마디점을 정확히 지나며 잇습니다.
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
