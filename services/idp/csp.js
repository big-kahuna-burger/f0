import { randomBytes } from 'node:crypto'
const nonce = () => randomBytes(12).toString('hex')
const CSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      'https://unpkg.com',
      (_, res) => {
        res.scriptNonce = nonce()
        return `'nonce-${res.scriptNonce}'`
      }
    ],
    formAction: null,
    styleSrc: [
      "'self'",
      'https:',
      "'unsafe-inline'",
      (_, res) => {
        res.styleNonce = nonce()
        return `'nonce-${res.styleNonce}'`
      }
    ],
    imgSrc: ["'self'", 'data:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    scriptSrcAttr: ["'self'", "'unsafe-inline'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}
export default Object.freeze(CSP)
