import CryptoKit
import Foundation
import NitroModules

class HybridHashToolkit: HybridHashToolkitSpec {
  private var timer: Timer?
  private var count = 0

  func add(a: Double, b: Double) throws -> Double {
    return a + b
  }

  func sha256(text: String) throws -> String {
    return Self.sha256Hex(Data(text.utf8))
  }

  func sha256Bytes(data: ArrayBuffer) throws -> String {
    // copyIfNeeded: buffer JS'e ait olabilir, bu çağrının dışında kullanmıyoruz
    return Self.sha256Hex(data.toData(copyIfNeeded: false))
  }

  // Promise.parallel: ayrı bir DispatchQueue'da çalışır, JS thread'ini bloklamaz
  func sha256Iterated(text: String, iterations: Double) throws -> Promise<String> {
    let rounds = max(Int(iterations), 1)
    return Promise.parallel {
      // İlk turda metni, sonraki her turda bir önceki hex'i hash'le
      var current = text
      for _ in 0..<rounds {
        current = Self.sha256Hex(Data(current.utf8))
      }
      return current
    }
  }

  func startTicker(intervalMs: Double, onTick: @escaping (_ count: Double) -> Void) throws {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.timer?.invalidate()
      self.count = 0
      self.timer = Timer.scheduledTimer(withTimeInterval: intervalMs / 1000, repeats: true) { [weak self] _ in
        guard let self else { return }
        self.count += 1
        onTick(Double(self.count))
      }
    }
  }

  func stopTicker() throws {
    DispatchQueue.main.async { [weak self] in
      self?.timer?.invalidate()
      self?.timer = nil
    }
  }

  // JS'ten dispose() çağrılınca ya da obje GC olunca kaynakları bırak
  func dispose() {
    let timer = self.timer
    self.timer = nil
    DispatchQueue.main.async { timer?.invalidate() }
  }

  deinit {
    dispose()
  }

  private static func sha256Hex(_ data: Data) -> String {
    return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
  }
}
