const http = require('http')
const bent = require('../')
const bl = require('bl')
const crypto = require('crypto')
const {promisify} = require('util')

let paths = {}

let handler = (req, res) => {
  /* istanbul ignore if */
  if (!paths[req.url]) {
    throw new Error(`No path for URL. ${req.url}`)
  }
  paths[req.url](req, res)
}

const {test} = require('tap')

const httpTest = (str, fn) => {
  test(str, async t => {
    let server = http.createServer(handler)
    await promisify(cb => server.listen(3000, cb))()
    await fn(t)
    await promisify(cb => server.close(cb))()
  })
}

paths['/basic'] = (req, res) => {
  res.end('ok')
}

httpTest('basic 200 ok', async t => {
  t.plan(1)
  let request = bent('string')
  let str = await request('http://localhost:3000/basic')
  t.same(str, 'ok')
})

httpTest('basic 200 ok baseurl', async t => {
  t.plan(1)
  let request = bent('string', 'http://localhost:3000')
  let str = await request('/basic')
  t.same(str, 'ok')
})

httpTest('basic 200', async t => {
  t.plan(1)
  let request = bent()
  let res = await request('http://localhost:3000/basic')
  t.same(res.statusCode, 200)
})

httpTest('basic buffer', async t => {
  t.plan(1)
  let request = bent('buffer')
  let buff = await request('http://localhost:3000/basic')
  t.same(buff, Buffer.from('ok'))
})

paths['/json'] = (req, res) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ok: 200}))
}

httpTest('basic json', async t => {
  t.plan(1)
  let request = bent('json')
  let json = await request('http://localhost:3000/json')
  t.same({ok: 200}, json)
})

test('basic PUT', async t => {
  t.plan(2)
  let body = await promisify(cb => crypto.randomBytes(1024, cb))()
  let server = http.createServer((req, res) => {
    req.pipe(bl((err, buff) => {
      /* istanbul ignore if */
      if (err) throw err
      t.same(buff, body)
      res.end('ok')
    }))
  })
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('PUT', 'string')
  let str = await request('http://localhost:3000/', body)
  t.same(str, 'ok')
  await promisify(cb => server.close(cb))()
})

paths['/201'] = (req, res) => {
  res.statusCode = 201
  res.end('ok')
}

httpTest('status 201', async t => {
  t.plan(3)
  let request = bent('string', 201)
  let str = await request('http://localhost:3000/201')
  t.same(str, 'ok')

  try {
    await request('http://localhost:3000/basic')
  } catch (e) {
    t.type(e, 'StatusError')
    t.same(e.message, 'Incorrect statusCode: 200')
  }
})

test('PUT stream', async t => {
  t.plan(2)
  let body = await promisify(cb => crypto.randomBytes(1024, cb))()
  let server = http.createServer((req, res) => {
    req.pipe(bl((err, buff) => {
      /* istanbul ignore if */
      if (err) throw err
      t.same(buff, body)
      res.end('ok')
    }))
  })
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('PUT', 'string')
  let b = bl()
  let str = request('http://localhost:3000/', b)
  b.write(body)
  b.end()
  t.same(await str, 'ok')
  await promisify(cb => server.close(cb))()
})

test('PUT JSON', async t => {
  t.plan(2)
  let server = http.createServer((req, res) => {
    req.pipe(bl((err, buff) => {
      /* istanbul ignore if */
      if (err) throw err
      t.same(JSON.parse(buff.toString()), {ok: 200})
      res.end('ok')
    }))
  })
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('PUT', 'string')
  let str = await request('http://localhost:3000/', {ok: 200})
  t.same(await str, 'ok')
  await promisify(cb => server.close(cb))()
})
