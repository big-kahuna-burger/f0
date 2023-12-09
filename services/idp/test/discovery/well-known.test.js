'use strict'

import { test } from 'tap'
import { build } from '../helper.js'

test('.well-known is working', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/.well-known/openid-configuration'
  })

  t.equal(res.payload, 'this is an example')
})