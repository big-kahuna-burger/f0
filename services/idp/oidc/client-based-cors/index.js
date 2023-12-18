import { errors } from 'oidc-provider'

export const CORS_PROP = 'urn:f0:ACO'

const isOrigin = (value) => {
  if (typeof value !== 'string') {
    return false
  }
  try {
    const { origin } = new URL(value)
    return value === origin
  } catch (err) {
    return false
  }
}

export const corsPropValidator = (value, metadata) => {
  if (value === undefined) {
    metadata[CORS_PROP] = []
    return metadata
  }
  // validate an array of Origin strings
  if (!Array.isArray(value) || !value.every(isOrigin)) {
    throw new errors.InvalidClientMetadata(
      `${CORS_PROP} must be an array of origins`
    )
  }
}
