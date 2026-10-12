import TurboHashToolkit from "@native-modules-playground/turbo-hash-toolkit";
import type { HashToolkit } from "./types";

export const turboToolkit: HashToolkit = {
  name: "turbo",
  add: (a, b) => TurboHashToolkit.add(a, b),
  sha256: (text) => TurboHashToolkit.sha256(text),
  sha256Iterated: (text, n) => TurboHashToolkit.sha256Iterated(text, n),
  // Codegen has no Uint8Array → convert to number[] (every byte is copied)
  sha256Bytes: (data) => TurboHashToolkit.sha256Bytes(Array.from(data)),
  startTicker: (intervalMs, onTick) => {
    // Typed EventEmitter: calling it adds a listener and returns a subscription
    const sub = TurboHashToolkit.onTick(onTick);
    TurboHashToolkit.startTicker(intervalMs);
    return () => {
      sub.remove();
      TurboHashToolkit.stopTicker();
    };
  },
};
