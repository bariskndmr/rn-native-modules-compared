import CryptoKit
import ExpoModulesCore

public class ExpoHashToolkitModule: Module {
  private var timer: Timer?
  private var count = 0
  private static let hexDigits = Array("0123456789abcdef".utf8)

  public func definition() -> ModuleDefinition {
    Name("ExpoHashToolkit")

    Events("onTick")

    // Senkron: JS thread'inde çalışır, bitene kadar JS'i bekletir
    Function("add") { (a: Double, b: Double) -> Double in
      return a + b
    }

    Function("sha256") { (text: String) -> String in
      return Self.sha256Hex(Data(text.utf8))
    }

    // JS'teki Uint8Array burada Data olarak gelir
    Function("sha256Bytes") { (data: Data) -> String in
      return Self.sha256Hex(data)
    }

    // Promise döner; varsayılan olarak JS thread'i dışında çalışır
    AsyncFunction("sha256Iterated") { (text: String, iterations: Int) -> String in
      // İlk turda metni, sonraki her turda bir önceki hex'i hash'le
      var current = text
      for _ in 0..<max(iterations, 1) {
        current = Self.sha256Hex(Data(current.utf8))
      }
      return current
    }

    Function("startTicker") { (intervalMs: Double) in
      DispatchQueue.main.async { [weak self] in
        guard let self else { return }
        self.timer?.invalidate()
        self.count = 0
        self.timer = Timer.scheduledTimer(withTimeInterval: intervalMs / 1000, repeats: true) {
          [weak self] _ in
          guard let self else { return }
          self.count += 1
          self.sendEvent("onTick", ["count": self.count])
        }
      }
    }

    Function("stopTicker") {
      DispatchQueue.main.async { [weak self] in
        self?.timer?.invalidate()
        self?.timer = nil
      }
    }

    // Modül yok edilirken çağrılır (deinit yerine bunu kullan)
    OnDestroy {
      timer?.invalidate()
      timer = nil
    }
  }

  private static func sha256Hex(_ data: Data) -> String {
    var hex = [UInt8]()
    hex.reserveCapacity(64)
    for byte in SHA256.hash(data: data) {
      hex.append(hexDigits[Int(byte >> 4)])
      hex.append(hexDigits[Int(byte & 0x0f)])
    }
    return String(decoding: hex, as: UTF8.self)
  }

}
