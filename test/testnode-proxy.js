/* globals it */
'use strict'
const bent = require('../')
const assert = require('assert')
const tsame = require('tsame')

const tunnel = require('tunnel')

const test = it
const same = (x, y) => assert.ok(tsame(x, y))
const baseurl = 'https://echo-server.mikeal.now.sh/src'

test('basic proxy', async () => {
  const agent = tunnel.httpsOverHttp({
    proxy: {
      host: '51.254.118.169',
      port: 3128
    },
    headers: {
      'Proxy-Agent': 'tunnel'
    }
  })
  const request = bent('GET', 'json', baseurl, agent)
  const json = await request('/info.js')
  same(json.headers['x-real-ip'], '51.254.118.169')
})
