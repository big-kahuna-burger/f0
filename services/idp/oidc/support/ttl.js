const ONE_MINUTE = 60
const TEN_MINUTES = 10 * ONE_MINUTE
const ONE_HOUR = 60 * ONE_MINUTE
const DAY = 24 * ONE_HOUR
const FOURTEEN_DAYS = 14 * DAY

const ttl = {
  AccessToken: function (ctx, token, client) {
    return token.resourceServer?.accessTokenTTL || ONE_HOUR
  },
  AuthorizationCode: ONE_MINUTE,
  BackchannelAuthenticationRequest: function (ctx, request, client) {
    if (ctx?.oidc && ctx.oidc.params.requested_expiry) {
      return Math.min(TEN_MINUTES, +ctx.oidc.params.requested_expiry) // 10 minutes in seconds or requested_expiry, whichever is shorter
    }

    return TEN_MINUTES
  },
  ClientCredentials: function (ctx, token, client) {
    return token.resourceServer?.accessTokenTTL || TEN_MINUTES
  },
  DeviceCode: TEN_MINUTES,
  Grant: FOURTEEN_DAYS,
  IdToken: ONE_HOUR,
  Interaction: ONE_HOUR,
  RefreshToken: function (ctx, token, client) {
    if (
      ctx && ctx.oidc.entities.RotatedRefreshToken &&
      client.applicationType === 'web' &&
      client.clientAuthMethod === 'none' &&
      !token.isSenderConstrained()
    ) {
      // Non-Sender Constrained SPA RefreshTokens do not have infinite expiration through rotation
      return ctx.oidc.entities.RotatedRefreshToken.remainingTTL
    }

    return FOURTEEN_DAYS
  },
  Session: FOURTEEN_DAYS
}
export default ttl
