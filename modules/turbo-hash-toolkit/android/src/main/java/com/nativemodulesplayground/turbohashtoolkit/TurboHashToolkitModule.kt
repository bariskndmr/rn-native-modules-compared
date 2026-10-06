package com.nativemodulesplayground.turbohashtoolkit

import com.facebook.react.bridge.ReactApplicationContext

class TurboHashToolkitModule(reactContext: ReactApplicationContext) :
  NativeTurboHashToolkitSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeTurboHashToolkitSpec.NAME
  }
}
