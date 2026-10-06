import { NativeModule, requireNativeModule } from 'expo';

import { ExpoHashToolkitModuleEvents } from './ExpoHashToolkit.types';

declare class ExpoHashToolkitModule extends NativeModule<ExpoHashToolkitModuleEvents> {
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<ExpoHashToolkitModule>('ExpoHashToolkit');
