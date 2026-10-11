import {
  CodegenTypes,
  TurboModuleRegistry,
  type TurboModule,
} from "react-native";

export type TickEvent = {
  count: number;
};

export interface Spec extends TurboModule {
  // Sync: runs on the JS thread and returns directly
  add(a: number, b: number): number;
  sha256(text: string): string;

  // Async: native gets resolve/reject
  sha256Iterated(text: string, iterations: number): Promise<string>;

  // Codegen has no Uint8Array/ArrayBuffer → plain number array (each byte is copied)
  sha256Bytes(data: ReadonlyArray<number>): string;

  startTicker(intervalMs: number): void;
  stopTicker(): void;

  // Typed event emitter (RN 0.76+), replaces NativeEventEmitter
  readonly onTick: CodegenTypes.EventEmitter<TickEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("TurboHashToolkit");
