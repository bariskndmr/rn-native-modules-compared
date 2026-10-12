import { NitroModules } from 'react-native-nitro-modules'
import type { HashToolkit } from './specs/HashToolkit.nitro'

// The name must match the "autolinking" key in nitro.json
const NitroHashToolkit =
  NitroModules.createHybridObject<HashToolkit>('HashToolkit')

export default NitroHashToolkit
export type { HashToolkit }
