import NitroHashToolkit from "@native-modules-playground/nitro-hash-toolkit";
import type { HashToolkit } from "./types";

export const nitroToolkit: HashToolkit = {
  name: "nitro",
  add: (a, b) => NitroHashToolkit.add(a, b),
  sha256: (text) => NitroHashToolkit.sha256(text),
  sha256Iterated: (text, n) => NitroHashToolkit.sha256Iterated(text, n),
  sha256Bytes: (data) => {
    // ArrayBuffer is passed to native without copying. A Uint8Array can be a view
    // over part of a larger buffer, so only pass .buffer when it covers the whole thing
    const whole =
      data.byteOffset === 0 && data.byteLength === data.buffer.byteLength;
    return NitroHashToolkit.sha256Bytes(
      (whole ? data.buffer : data.slice().buffer) as ArrayBuffer,
    );
  },
  startTicker: (intervalMs, onTick) => {
    NitroHashToolkit.startTicker(intervalMs, (count) => onTick({ count }));
    return () => NitroHashToolkit.stopTicker();
  },
};
