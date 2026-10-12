package com.nativemodulesplayground.turbohashtoolkit

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import java.security.MessageDigest

private val HEX = "0123456789abcdef".toCharArray()

class TurboHashToolkitModule(reactContext: ReactApplicationContext) :
  NativeTurboHashToolkitSpec(reactContext) {

  private val handler = Handler(Looper.getMainLooper())
  private var tick: Runnable? = null
  private var count = 0

  // Sync: runs on the JS thread
  override fun add(a: Double, b: Double): Double = a + b

  override fun sha256(text: String): String =
    sha256Hex(text.toByteArray(Charsets.UTF_8))

  // ReadableArray → ByteArray, one element at a time (the slow part)
  override fun sha256Bytes(data: ReadableArray): String {
    val bytes = ByteArray(data.size()) { i -> data.getInt(i).toByte() }
    return sha256Hex(bytes)
  }

  // Async: runs on the native modules background thread, finish with promise.resolve / reject
  override fun sha256Iterated(text: String, iterations: Double, promise: Promise) {
    var current = text
    repeat(maxOf(iterations.toInt(), 1)) {
      current = sha256Hex(current.toByteArray(Charsets.UTF_8))
    }
    promise.resolve(current)
  }

  override fun startTicker(intervalMs: Double) {
    val delay = intervalMs.toLong()
    handler.post {
      stopTick()
      count = 0
      val runnable = object : Runnable {
        override fun run() {
          count += 1
          // Events need a WritableMap, not a Kotlin Map
          emitOnTick(Arguments.createMap().apply { putInt("count", count) })
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

  // Called when the React instance is torn down (e.g. reload); Expo's OnDestroy equivalent
  override fun invalidate() {
    stopTick()
    super.invalidate()
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

  companion object {
    const val NAME = NativeTurboHashToolkitSpec.NAME
  }
}
