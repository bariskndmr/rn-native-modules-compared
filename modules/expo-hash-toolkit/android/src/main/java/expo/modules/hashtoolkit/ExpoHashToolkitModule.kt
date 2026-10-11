package expo.modules.hashtoolkit

import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest

class ExpoHashToolkitModule : Module() {
  private val handler = Handler(Looper.getMainLooper())
  private var tick: Runnable? = null
  private var count = 0

  override fun definition() = ModuleDefinition {
    Name("ExpoHashToolkit")

    Events("onTick")

    Function("add") { a: Double, b: Double -> a + b }

    Function("sha256") { text: String ->
      sha256Hex(text.toByteArray(Charsets.UTF_8))
    }

    // JS'teki Uint8Array burada ByteArray olarak gelir
    Function("sha256Bytes") { data: ByteArray ->
      sha256Hex(data)
    }

    AsyncFunction("sha256Iterated") { text: String, iterations: Int ->
      // İlk turda metni, sonraki her turda bir önceki hex'i hash'le
      var current = text
      repeat(maxOf(iterations, 1)) {
        current = sha256Hex(current.toByteArray(Charsets.UTF_8))
      }
      current
    }

    Function("startTicker") { intervalMs: Double ->
      val delay = intervalMs.toLong()
      handler.post {
        tick?.let { handler.removeCallbacks(it) }
        count = 0
        val runnable = object : Runnable {
          override fun run() {
            count += 1
            sendEvent("onTick", mapOf("count" to count))
            handler.postDelayed(this, delay)
          }
        }
        tick = runnable
        handler.postDelayed(runnable, delay)
      }
    }

    Function("stopTicker") {
      handler.post { stopTick() }
    }

    OnDestroy {
      stopTick()
    }
  }

  private fun stopTick() {
    tick?.let { handler.removeCallbacks(it) }
    tick = null
  }

  private fun sha256Hex(data: ByteArray): String =
    MessageDigest.getInstance("SHA-256")
      .digest(data)
      .joinToString("") { "%02x".format(it) }
}
