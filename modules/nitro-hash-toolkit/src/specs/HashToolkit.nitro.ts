import { type HybridObject } from 'react-native-nitro-modules'

export interface HashToolkit extends HybridObject<{
  ios: 'swift'
  android: 'kotlin'
}> {
  add(a: number, b: number): number
  sha256(text: string): string
  sha256Iterated(text: string, iterations: number): Promise<string>
  sha256Bytes(data: ArrayBuffer): string
  startTicker(intervalMs: number, onTick: (count: number) => void): void
  stopTicker(): void
}
