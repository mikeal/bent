const bent = require('../')
const tsame = require('tsame')
const assert = require('assert')
const { it } = require('mocha')

const test = it
const same = (x, y) => assert.ok(tsame(x, y))

const ttype = (e, str) => same(e.constructor.name, str)

test('Invalid encoding', async () => {
  try {
    bent('blah')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, `Unknown encoding, blah`)
  }
})

test('double method', async () => {
  try {
    bent('GET', 'PUT')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, `Can't set method to PUT, already set to GET.`)
  }
})

test('double headers', async () => {
  try {
    bent({}, {})
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Cannot set headers twice.')
  }
})

test('unknown protocol', async () => {
  try {
    let request = bent()
    request('ftp://host.com')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, `Unknown protocol, ftp:`)
  }
})

test('Invalid type', async () => {
  try {
    bent(true)
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, `Unknown type: boolean`)
  }
})

test('Invalid body', async () => {
  let r = bent('PUT')
  try {
    await r('http://localhost:3000', true)
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Unknown body type.')
  }
})
