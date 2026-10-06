package expo.modules.hashtoolkit

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoHashToolkitModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoHashToolkit")

    Events("onChange")

    Function("hello") {
      "Hello world! 👋"
    }

    AsyncFunction("setValueAsync") { value: String ->
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }
  }
}
