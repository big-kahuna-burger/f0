import { errors } from 'oidc-provider'

export const CORS_PROP = 'urn:f0:ACO'
export const F0_TYPE_PROP = 'urn:f0:type'

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

export const urnF0TypeValidator = (value, metadata) => {
  if (value === undefined) {
    metadata[F0_TYPE_PROP] = 'web'
    return metadata
  }
  if (
    value !== 'spa' &&
    value !== 'native' &&
    value !== 'web' &&
    value !== 'm2m'
  ) {
    throw new errors.InvalidClientMetadata(
      'urn:f0:type must be one of: spa, native, web, m2m'
    )
  }
}
