export type TickEvent = { count: number };

export interface HashToolkit {
  name: "expo" | "turbo" | "nitro";
  add(a: number, b: number): number;
  sha256(text: string): string;
  sha256Iterated(text: string, iterations: number): Promise<string>;
  sha256Bytes(data: Uint8Array): string;
  /** Returns a function that stops the ticker and removes the listener */
  startTicker(intervalMs: number, onTick: (e: TickEvent) => void): () => void;
}
