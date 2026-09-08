export type Rng = () => number;

export function createSeed(): number {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && "getRandomValues" in cryptoApi) {
    const values = new Uint32Array(1);
    cryptoApi.getRandomValues(values);
    return values[0] ?? Math.floor(Math.random() * 0xffffffff);
  }
  return Math.floor(Math.random() * 0xffffffff);
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seed: number, value: string): number {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
