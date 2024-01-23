export function accountMAP(acct) {
  return Object.entries(acct).reduce((acc, [key, value]) => {
    acc[snakeCase(key)] = value
    return acc
  }, {})
}

export function resourceServerMap(rsData) {
  return rsData
}

const snakeCase = (str = '') =>
  str.replace(/([A-Z][a-z])/g, (x) => `_${x}`.toLowerCase()).replace(/^_+/, '')
