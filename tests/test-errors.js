const bent = require('../')
const {test} = require('tap')

test('Invalid encoding', t => {
  t.plan(2)
  try {
    bent('blah')
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.message, `Unknown encoding, blah`)
  }
})

test('double method', t => {
  t.plan(2)
  try {
    bent('GET', 'PUT')
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.message, `Can't set method to PUT, already set to GET.`)
  }
})

test('double headers', t => {
  t.plan(2)
  try {
    bent({}, {})
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.message, 'Cannot set headers twice.')
  }
})

test('unknown protocol', t => {
  t.plan(2)
  try {
    let request = bent()
    request('ftp://host.com')
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.message, `Unknown protocol, ftp:`)
  }
})

test('Invalid type', t => {
  t.plan(2)
  try {
    bent(true)
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.message, `Unknown type: boolean`)
  }
})

test('Invalid body', async t => {
  t.plan(2)
  let r = bent('PUT')
  try {
    await r('http://localhost:3000', true)
  } catch (e) {
    t.type(e, 'Error')
    t.same(e.message, 'Unknown body type.')
  }
})
