import * as querystring from 'node:querystring'
import { inspect } from 'node:util'

const isEmpty = (value) => {
  return (
    value == null ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}
const keys = new Set()
const debug = (obj) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc, [key, value]) => {
      keys.add(key)
      if (isEmpty(value)) return acc
      acc[key] = inspect(value, { depth: null })
      return acc
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value
      }
    }
  )

export default debug
