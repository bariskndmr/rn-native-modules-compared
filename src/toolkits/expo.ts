import ExpoHashToolkit from "@/modules/expo-hash-toolkit";
import type { HashToolkit } from "./types";

export const expoToolkit: HashToolkit = {
  name: "expo",
  add: (a, b) => ExpoHashToolkit.add(a, b),
  sha256: (text) => ExpoHashToolkit.sha256(text),
  sha256Iterated: (text, n) => ExpoHashToolkit.sha256Iterated(text, n),
  sha256Bytes: (data) => ExpoHashToolkit.sha256Bytes(data),
  startTicker: (intervalMs, onTick) => {
    const sub = ExpoHashToolkit.addListener("onTick", onTick);
    ExpoHashToolkit.startTicker(intervalMs);
    return () => {
      sub.remove();
      ExpoHashToolkit.stopTicker();
    };
  },
};
