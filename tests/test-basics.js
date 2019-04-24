const http = require('http')
const bent = require('../')
const bl = require('bl')
const crypto = require('crypto')
const assert = require('assert')
const tsame = require('tsame')
const { promisify } = require('util')
const { it } = require('mocha')

let paths = {}

let handler = (req, res) => {
  /* istanbul ignore if */
  if (!paths[req.url]) {
    throw new Error(`No path for URL. ${req.url}`)
  }
  paths[req.url](req, res)
}


const test = it
console.error({test, it})

const same = (x, y) => assert.ok(tsame(x, y))

const httpTest = (str, fn) => {
  test(str, async () => {
    let server = http.createServer(handler)
    await promisify(cb => server.listen(3000, cb))()
    await fn(t)
    await promisify(cb => server.close(cb))()
  })
}

paths['/basic'] = (req, res) => {
  res.end('ok')
}

httpTest('basic 200 ok', async () => {
  let request = bent('string')
  let str = await request('http://localhost:3000/basic')
  same(str, 'ok')
})

httpTest('basic 200 ok baseurl', async () => {
  let request = bent('string', 'http://localhost:3000')
  let str = await request('/basic')
  same(str, 'ok')
})

httpTest('basic 200', async () => {
  let request = bent()
  let res = await request('http://localhost:3000/basic')
  same(res.statusCode, 200)
})

httpTest('basic buffer', async () => {
  let request = bent('buffer')
  let buff = await request('http://localhost:3000/basic')
  same(buff, Buffer.from('ok'))
})

paths['/json'] = (req, res) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ok: 200}))
}

httpTest('basic json', async () => {
  let request = bent('json')
  let json = await request('http://localhost:3000/json')
  same({ok: 200}, json)
})

paths['/media-type'] = (req, res) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ok: 200, accept: req.headers.accept}))
}

httpTest('json based media type', async () => {
  let request = bent('json', { accept: 'application/vnd.something.com' })
  let json = await request('http://localhost:3000/media-type')
  same({ok: 200, accept: 'application/vnd.something.com'}, json)
})

test('basic PUT', async () => {
  let body = await promisify(cb => crypto.randomBytes(1024, cb))()
  let server = http.createServer((req, res) => {
    req.pipe(bl((err, buff) => {
      /* istanbul ignore if */
      if (err) throw err
      same(buff, body)
      res.end('ok')
    }))
  })
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('PUT', 'string')
  let str = await request('http://localhost:3000/', body)
  same(str, 'ok')
  await promisify(cb => server.close(cb))()
})

paths['/201'] = (req, res) => {
  res.statusCode = 201
  res.end('ok')
}

httpTest('status 201', async () => {
  let request = bent('string', 201)
  let str = await request('http://localhost:3000/201')
  same(str, 'ok')

  try {
    await request('http://localhost:3000/basic')
  } catch (e) {
    t.type(e, 'StatusError')
    same(e.message, 'Incorrect statusCode: 200')
  }
})

test('PUT stream', async () => {
  let body = await promisify(cb => crypto.randomBytes(1024, cb))()
  let server = http.createServer((req, res) => {
    req.pipe(bl((err, buff) => {
      /* istanbul ignore if */
      if (err) throw err
      same(buff, body)
      res.end('ok')
    }))
  })
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('PUT', 'string')
  let b = bl()
  let str = request('http://localhost:3000/', b)
  b.write(body)
  b.end()
  same(await str, 'ok')
  await promisify(cb => server.close(cb))()
})

test('PUT JSON', async () => {
  let server = http.createServer((req, res) => {
    req.pipe(bl((err, buff) => {
      /* istanbul ignore if */
      if (err) throw err
      same(JSON.parse(buff.toString()), {ok: 200})
      res.end('ok')
    }))
  })
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('PUT', 'string')
  let str = await request('http://localhost:3000/', {ok: 200})
  same(await str, 'ok')
  await promisify(cb => server.close(cb))()
})

paths['/errorResponseBody'] = (req, res) => {
  res.statusCode = 500
  res.end('hello world')
}

httpTest('500 Response body', async () => {
  let request = bent()
  let body
  try {
    await request('http://localhost:3000/errorResponseBody')
  } catch (e) {
    body = e.responseBody
  }
  let buffer = await body
  same(buffer.toString(), 'hello world')
})
