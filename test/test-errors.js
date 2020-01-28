'use strict'
/* globals it */
const bent = require('../')
const tsame = require('tsame')
const assert = require('assert')

const test = it
const same = (x, y) => assert.ok(tsame(x, y))

const ttype = (e, str) => same(e.constructor.name, str)

test('Invalid encoding', done => {
  try {
    bent('blah')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Unknown encoding, blah')
    done()
  }
})

test('double method', done => {
  try {
    bent('GET', 'PUT')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Can\'t set method to PUT, already set to GET.')
    done()
  }
})

test('double headers', done => {
  try {
    bent({}, {})
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Cannot set headers twice.')
    done()
  }
})

test('unknown protocol', async () => {
  try {
    const request = bent()
    await request('ftp://host.com')
    throw new Error('Should have already failed')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Unknown protocol, ftp:')
  }
})

test('Invalid type', done => {
  try {
    bent(true)
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Unknown type: boolean')
    done()
  }
})

test('Invalid body', async () => {
  const r = bent('PUT')
  try {
    await r('http://localhost:3000', true)
    throw new Error('Should have failed')
  } catch (e) {
    ttype(e, 'Error')
    same(e.message, 'Unknown body type.')
  }
})

test('Invalid json', async () => {
  const r = bent('GET', 'json')
  try {
    await r('https://echo-server.mikeal.now.sh/src/echo.js?body=[asdf]')
    throw new Error('Should have failed')
  } catch (e) {
    assert.ok(e.message.startsWith('Unexpected token a in JSON'))
  }
})
