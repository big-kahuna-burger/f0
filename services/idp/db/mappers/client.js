import { DEFAULT_CLIENT_INCLUDE } from '../../helpers/validation-constants.js'

export const clientXMap = (x, fields = DEFAULT_CLIENT_INCLUDE) => {
  const mapped = Object.assign(
    Object.fromEntries(fields.map((f) => [f, x[f] || x.payload[f]])),
    {
      connections: x.ClientConnection?.map((cc) => ({
        ...cc.connection,
        readonly: cc.readonly
      }))
    }
  )

  return mapped
}
