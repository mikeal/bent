/* globals atob, it */
'use strict'
const bent = require('../')
const assert = require('assert')
const tsame = require('tsame')
const { PassThrough } = require('stream')

const test = it

const same = (x, y) => assert.ok(tsame(x, y))

const baseurl = 'https://echo-server.mikeal.now.sh/src'
const u = path => baseurl + path

const enc = str => (new TextEncoder()).encode(str).buffer
const dec = str => Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer
const decode = arr => (new TextDecoder('utf-8')).decode(arr)

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
  if (buff instanceof ArrayBuffer) {
    same(buff, enc('ok'))
  } else {
    same(buff, Buffer.from('ok'))
  }
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
  let body
  if (process.browser) {
    body = enc(Math.random().toString())
  } else {
    body = Buffer.from(Math.random().toString())
  }
  const json = await request(u('/info.js'), body)
  if (process.browser) {
    same(dec(json.base64), body)
  } else {
    same(Buffer.from(json.base64, 'base64'), body)
  }
})

test('base PUT string', async () => {
  const request = bent('PUT', 'json')
  const json = await request(u('/info.js'), 'teststring')
  if (process.browser) {
    same(atob(json.base64), 'teststring')
  } else {
    same(Buffer.from(json.base64, 'base64').toString(), 'teststring')
  }
})

test('status 201', async () => {
  const request = bent('string', 201)
  const str = await request(u('/echo.js?statusCode=201&body=ok'))
  same(str, 'ok')

  try {
    await request(u('/echo.js?body=ok'))
    throw new Error('Call should have thrown.')
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
  let res
  if (process.browser) {
    res = JSON.parse(atob(info.base64))
  } else {
    res = JSON.parse(Buffer.from(info.base64, 'base64').toString())
  }
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
  if (process.browser) {
    same(decode(buffer), 'ok')
  } else {
    same(buffer.toString(), 'ok')
  }
})

if (process.browser) {
  test('override headers', async () => {
    const request = bent('string', { Accept: 'application/json' })
    let info = await request(u('/info.js'), null, { Accept: 'application/xml' })
    info = JSON.parse(info)
    same(info.headers.accept, 'application/xml')
  })
} else {
  test('override headers', async () => {
    const request = bent('json', { 'X-Default': 'ok', 'X-Override-Me': 'not overriden' })
    const info = await request(u('/info.js'), null, { 'X-Override-Me': 'overriden', 'X-New': 'ok' })
    same(info.headers['x-default'], 'ok')
    same(info.headers['x-override-me'], 'overriden')
    same(info.headers['x-new'], 'ok')
  })
}
