const https = require('https')
const fs = require('fs')
const path = require('path')
const bent = require('../')
const {test} = require('tap')
const {promisify} = require('util')

const options = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
}

test('basic https', async t => {
  t.plan(2)
  let server = https.createServer(options,
    /* istanbul ignore next */ () => {}
  )
  await promisify(cb => server.listen(3000, cb))()
  let request = bent('string')
  try {
    await request('https://localhost:3000/')
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.code, 'DEPTH_ZERO_SELF_SIGNED_CERT')
  }
  await promisify(cb => server.close(cb))()
})
