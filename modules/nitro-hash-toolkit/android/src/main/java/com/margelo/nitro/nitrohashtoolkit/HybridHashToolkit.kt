package com.margelo.nitro.nitrohashtoolkit

import android.os.Handler
import android.os.Looper
import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.core.ArrayBuffer
import com.margelo.nitro.core.Promise
import java.security.MessageDigest

private val HEX = "0123456789abcdef".toCharArray()

// C++ tarafı bu sınıfı JNI ile reflection üzerinden oluşturur → R8 silmesin
@DoNotStrip
@Keep
class HybridHashToolkit : HybridHashToolkitSpec() {
  private val handler = Handler(Looper.getMainLooper())
  private var tick: Runnable? = null
  private var count = 0

  override fun add(a: Double, b: Double): Double = a + b

  override fun sha256(text: String): String =
    sha256Hex(text.toByteArray(Charsets.UTF_8))

  override fun sha256Bytes(data: ArrayBuffer): String =
    sha256Hex(data.toByteArray())

  // Promise.parallel: ayrı bir thread'de çalışır, JS thread'ini bloklamaz
  override fun sha256Iterated(text: String, iterations: Double): Promise<String> {
    val rounds = maxOf(iterations.toInt(), 1)
    return Promise.parallel {
      // İlk turda metni, sonraki her turda bir önceki hex'i hash'le
      var current = text
      repeat(rounds) {
        current = sha256Hex(current.toByteArray(Charsets.UTF_8))
      }
      current
    }
  }

  override fun startTicker(intervalMs: Double, onTick: (count: Double) -> Unit) {
    val delay = intervalMs.toLong()
    handler.post {
      stopTick()
      count = 0
      val runnable = object : Runnable {
        override fun run() {
          count += 1
          onTick(count.toDouble())
          handler.postDelayed(this, delay)
        }
      }
      tick = runnable
      handler.postDelayed(runnable, delay)
    }
  }

  override fun stopTicker() {
    handler.post { stopTick() }
  }

  // JS'ten dispose() çağrılınca ya da obje GC olunca kaynakları bırak
  override fun dispose() {
    handler.post { stopTick() }
    super.dispose()
  }

  private fun stopTick() {
    tick?.let { handler.removeCallbacks(it) }
    tick = null
  }

  private fun sha256Hex(data: ByteArray): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(data)
    val out = CharArray(digest.size * 2)
    for (i in digest.indices) {
      val v = digest[i].toInt() and 0xff
      out[i * 2] = HEX[v ushr 4]
      out[i * 2 + 1] = HEX[v and 0x0f]
    }
    return String(out)
  }
}
