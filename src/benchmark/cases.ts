import type { HashToolkit } from "@/toolkits/types";

export type BenchCase = {
  id: string;
  label: string;
  /** What this case actually measures */
  hint: string;
  unit: "ms" | "ticks";
  run: (toolkit: HashToolkit) => Promise<number>;
};

const ADD_CALLS = 10_000;
const SHA_CALLS = 1_000;
const BYTES_SIZE = 1024 * 1024;
const BYTES_CALLS = 5;
const ITERATIONS = 100_000;
const TICK_INTERVAL_MS = 10;
const TICK_WINDOW_MS = 1_000;

let bytes: Uint8Array | undefined;
function megabyte() {
  if (!bytes) {
    bytes = new Uint8Array(BYTES_SIZE);
    for (let i = 0; i < BYTES_SIZE; i++) bytes[i] = i & 0xff;
  }
  return bytes;
}

// Runs fn once as a warm-up (first call may do lazy native init), then times `times` calls
function timeSync(times: number, fn: () => void) {
  fn();
  const start = performance.now();
  for (let i = 0; i < times; i++) fn();
  return performance.now() - start;
}

export const benchCases: BenchCase[] = [
  {
    id: "add",
    label: `add × ${ADD_CALLS.toLocaleString()}`,
    hint: "Pure call overhead: almost no native work",
    unit: "ms",
    run: async (t) => timeSync(ADD_CALLS, () => t.add(1, 2)),
  },
  {
    id: "sha256",
    label: `sha256 × ${SHA_CALLS.toLocaleString()}`,
    hint: "Short string in, string out",
    unit: "ms",
    run: async (t) => timeSync(SHA_CALLS, () => t.sha256("hello world")),
  },
  {
    id: "bytes",
    label: `sha256Bytes 1 MB × ${BYTES_CALLS}`,
    hint: "Binary transfer: number[] copy vs ArrayBuffer",
    unit: "ms",
    run: async (t) => {
      const data = megabyte();
      return timeSync(BYTES_CALLS, () => t.sha256Bytes(data));
    },
  },
  {
    id: "iterated",
    label: `sha256Iterated ${ITERATIONS.toLocaleString()}`,
    hint: "Async: JS frames should keep counting",
    unit: "ms",
    run: async (t) => {
      const start = performance.now();
      await t.sha256Iterated("hello world", ITERATIONS);
      return performance.now() - start;
    },
  },
  {
    id: "ticker",
    label: `ticker ${TICK_INTERVAL_MS} ms for 1 s`,
    hint: `Events received (ideal ≈ ${TICK_WINDOW_MS / TICK_INTERVAL_MS})`,
    unit: "ticks",
    run: (t) =>
      new Promise((resolve) => {
        let ticks = 0;
        const stop = t.startTicker(TICK_INTERVAL_MS, () => ticks++);
        setTimeout(() => {
          stop();
          resolve(ticks);
        }, TICK_WINDOW_MS);
      }),
  },
];

/** sha256("hello") and sha256Bytes(UTF-8 of "hello") must agree across every toolkit */
export function hashesMatch(toolkits: HashToolkit[]) {
  const sample = new Uint8Array([104, 101, 108, 108, 111]);
  const hashes = toolkits.flatMap((t) => [t.sha256("hello"), t.sha256Bytes(sample)]);
  return hashes.every((h) => h === hashes[0]);
}
