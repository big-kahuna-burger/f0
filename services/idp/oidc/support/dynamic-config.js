import { getConfig, initializeKeys } from '../helpers/keys.js'
let config = await getConfig()

if (!config) {
  await initializeKeys()
  config = await getConfig()
}

if (!config) {
  throw new Error('failed to initialize config')
}

export default config