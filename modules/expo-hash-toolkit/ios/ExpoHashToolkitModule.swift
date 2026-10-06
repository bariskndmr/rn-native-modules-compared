import ExpoModulesCore

public class ExpoHashToolkitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoHashToolkit")

    Events("onChange")

    Function("hello") {
      return "Hello world! 👋"
    }

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}
