'use strict'
const bent = require('../')
const assert = require('assert')
const tsame = require('tsame')
const { PassThrough } = require('stream')
const { it } = require('mocha')

const test = it

const same = (x, y) => assert.ok(tsame(x, y))

const baseurl = 'https://echo-server.mikeal.now.sh/src'
const u = path => baseurl + path

test('basic 200 ok', async () => {
  const request = bent('string')
  const str = await request(u('/echo.js?body=ok'))
  same(str, 'ok')
})

test('basic 200 ok baseurl', async () => {
  const request = bent('string', baseurl)
  const str = await request('/echo.js?body=ok')
  same(str, 'ok')
})

test('basic 200', async () => {
  const request = bent()
  const res = await request(u('/echo.js?body=ok'))
  same(res.statusCode, 200)
})

test('basic buffer', async () => {
  const request = bent('buffer')
  const buff = await request(u('/echo.js?body=ok'))
  same(buff, Buffer.from('ok'))
})

test('basic json', async () => {
  const request = bent('json')
  const json = await request(u('/info.js'))
  same(json.method, 'GET')
})

test('json based media type', async () => {
  const request = bent('json', { accept: 'application/vnd.something.com' })
  const json = await request(u('/info.js'))
  same(json.headers.accept, 'application/vnd.something.com')
})

test('basic PUT', async () => {
  const request = bent('PUT', 'json')
  const body = Buffer.from(Math.random().toString())
  const json = await request(u('/info.js'), body)
  same(Buffer.from(json.base64, 'base64'), body)
})

test('status 201', async () => {
  const request = bent('string', 201)
  const str = await request(u('/echo.js?statusCode=201&body=ok'))
  same(str, 'ok')

  try {
    await request(u('/echo.js?body=ok'))
  } catch (e) {
    same(e.message, 'Incorrect statusCode: 200')
  }
})

test('PUT stream', async () => {
  const body = Buffer.from(Math.random().toString())
  const request = bent('PUT', 'json')
  const b = new PassThrough()
  const res = request(u('/info.js'), b)
  b.end(body)
  const info = await res
  same(info.method, 'PUT')
  // Unfortunately, we can't test this against lamda cause it doesn't support
  // transfer-encoding: chunked.
  // t.same(Buffer.from(info.base64, 'base64'), body)
})

test('PUT JSON', async () => {
  const request = bent('PUT', 'json')
  const info = await request(u('/info.js'), { ok: 200 })
  const res = JSON.parse(Buffer.from(info.base64, 'base64').toString())
  same(res, { ok: 200 })
  same(info.headers['content-type'], 'application/json')
})

test('500 Response body', async () => {
  const request = bent()
  let body
  try {
    await request(u('/echo.js?statusCode=500&body=ok'))
  } catch (e) {
    body = e.responseBody
  }
  const buffer = await body
  same(buffer.toString(), 'ok')
})
