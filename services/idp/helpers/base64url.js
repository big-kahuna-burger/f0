export const encode = input => Buffer.from(input).toString('base64url')
export const decode = input => Buffer.from(input, 'base64')