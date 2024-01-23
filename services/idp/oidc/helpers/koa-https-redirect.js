export default async (ctx, next) => {
  if (ctx.secure) {
    await next()
  } else if (ctx.method === 'GET' || ctx.method === 'HEAD') {
    ctx.status = 303
    ctx.redirect(ctx.href.replace(/^http:\/\//i, 'https://'))
  } else {
    ctx.body = {
      error: 'invalid_request',
      error_description: 'do yourself a favor and only use https'
    }
    ctx.status = 400
  }
}
