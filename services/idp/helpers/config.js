import path from 'path'
import desm from 'desm'
import { config } from 'dotenv'
const file = `${process.env.ENV ? process.env.ENV : ''}.env`

const __dirname = desm(import.meta.url)
const { parsed, error } = config({ path: path.resolve(__dirname, '..', file) })

export { parsed, error }
