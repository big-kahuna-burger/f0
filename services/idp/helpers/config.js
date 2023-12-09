import { config } from 'dotenv'
import path from 'path'
import desm from 'desm'
const file = `${(process.env.ENV ? process.env.ENV : '')}.env`

const __dirname = desm(import.meta.url)
const { parsed, error } = config({ path: path.resolve(__dirname, '..', file)})
if (error) {
  throw error
}
export { parsed, error }