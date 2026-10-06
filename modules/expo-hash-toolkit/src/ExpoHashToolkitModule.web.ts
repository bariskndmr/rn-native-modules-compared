import { registerWebModule, NativeModule } from 'expo';

import { ExpoHashToolkitModuleEvents } from './ExpoHashToolkit.types';

// ExpoHashToolkitModule is not available on the web platform.
class ExpoHashToolkitModule extends NativeModule<ExpoHashToolkitModuleEvents> {}

export default registerWebModule(ExpoHashToolkitModule, 'ExpoHashToolkitModule');
