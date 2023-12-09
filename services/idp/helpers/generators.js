import { randomBytes } from 'node:crypto'

import base64url from './base64url.js'

export const random = (bytes = 32) => base64url.encode(randomBytes(bytes))