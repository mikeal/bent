const bent = require('../')
const { PassThrough } = require('stream')

const { test } = require('tap')

const baseurl = 'https://echo-server.mikeal.now.sh/src'
const u = path => baseurl + path

test('basic 200 ok', async t => {
  let request = bent('string')
  let str = await request(u('/echo.js?body=ok'))
  t.same(str, 'ok')
})

test('basic 200 ok baseurl', async t => {
  let request = bent('string', baseurl)
  let str = await request('/echo.js?body=ok')
  t.same(str, 'ok')
})

test('basic 200', async t => {
  let request = bent()
  let res = await request(u('/echo.js?body=ok'))
  t.same(res.statusCode, 200)
})

test('basic buffer', async t => {
  let request = bent('buffer')
  let buff = await request(u('/echo.js?body=ok'))
  t.same(buff, Buffer.from('ok'))
})

test('basic json', async t => {
  let request = bent('json')
  let json = await request(u('/info.js'))
  t.same(json.method, 'GET')
})

test('json based media type', async t => {
  let request = bent('json', { accept: 'application/vnd.something.com' })
  let json = await request(u('/info.js'))
  t.same(json.headers.accept, 'application/vnd.something.com')
})

test('basic PUT', async t => {
  let request = bent('PUT', 'json')
  let body = Buffer.from(Math.random().toString())
  let json = await request(u('/info.js'), body)
  t.same(Buffer.from(json.base64, 'base64'), body)
})

test('status 201', async t => {
  let request = bent('string', 201)
  let str = await request(u('/echo.js?statusCode=201&body=ok'))
  t.same(str, 'ok')

  try {
    await request(u('/echo.js?body=ok'))
  } catch (e) {
    t.type(e, 'StatusError')
    t.same(e.message, 'Incorrect statusCode: 200')
  }
})

test('PUT stream', async t => {
  let body = Buffer.from(Math.random().toString())
  let request = bent('PUT', 'json')
  let b = new PassThrough()
  let res = request(u('/info.js'), b)
  b.end(body)
  let info = await res
  t.same(info.method, 'PUT')
  // Unfortunately, we can't test this against lamda cause it doesn't support
  // transfer-encoding: chunked.
  // t.same(Buffer.from(info.base64, 'base64'), body)
})

test('PUT JSON', async t => {
  let request = bent('PUT', 'json')
  let info = await request(u('/info.js'), { ok: 200 })
  let res = JSON.parse(Buffer.from(info.base64, 'base64').toString())
  t.same(res, { ok: 200 })
  t.same(info.headers['content-type'], 'application/json')
})

test('500 Response body', async t => {
  let request = bent()
  let body
  try {
    await request(u('/echo.js?statusCode=500&body=ok'))
  } catch (e) {
    body = e.responseBody
  }
  let buffer = await body
  t.same(buffer.toString(), 'ok')
})
