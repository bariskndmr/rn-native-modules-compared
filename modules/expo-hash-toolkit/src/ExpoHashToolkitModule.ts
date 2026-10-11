import { NativeModule, requireNativeModule } from "expo";

export type TickEvent = { count: number };

type ExpoHashToolkitEvents = {
  onTick(event: TickEvent): void;
};

declare class ExpoHashToolkitModule extends NativeModule<ExpoHashToolkitEvents> {
  add(a: number, b: number): number;
  sha256(text: string): string;
  sha256Bytes(data: Uint8Array): string;
  sha256Iterated(text: string, iterations: number): Promise<string>;
  startTicker(intervalMs: number): void;
  stopTicker(): void;
}

export default requireNativeModule<ExpoHashToolkitModule>("ExpoHashToolkit");
