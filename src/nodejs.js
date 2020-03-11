'use strict'
const http = require('http')
const https = require('https')
const { URL } = require('url')
const isStream = require('is-stream')
const caseless = require('caseless')
const bytes = require('bytesish')
const bent = require('./core')
const zlib = require('zlib')
const { PassThrough } = require('stream')
const { getBuffer, getEncoding } = require('./common')

const compression = {}

/* istanbul ignore else */
if (zlib.createBrotliDecompress) compression.br = () => zlib.createBrotliDecompress()
/* istanbul ignore else */
if (zlib.createGunzip) compression.gzip = () => zlib.createGunzip()
/* istanbul ignore else */
if (zlib.createInflate) compression.deflate = () => zlib.createInflate()

const acceptEncoding = Object.keys(compression).join(', ')

const getResponse = resp => {
  const ret = new PassThrough()
  ret.statusCode = resp.statusCode
  ret.statusMessage = resp.statusMessage
  ret.headers = resp.headers
  ret._response = resp
  if (ret.headers['content-encoding']) {
    const encodings = ret.headers['content-encoding'].split(', ').reverse()
    while (encodings.length) {
      const enc = encodings.shift()
      if (compression[enc]) {
        resp = resp.pipe(compression[enc]())
      } else {
        break
      }
    }
  }
  return resp.pipe(ret)
}

class StatusError extends Error {
  constructor (res, body, ...params) {
    super(...params)

    Error.captureStackTrace(this, StatusError)
    this.message = `Incorrect statusCode: ${res.statusCode}`
    this.statusCode = res.statusCode
    this.responseBody = body || res
  }
}

const mkrequest = (statusCodes, method, encoding, headers, baseurl) => (_url, body = null, _headers = {}) => {
  _url = baseurl + (_url || '')
  const parsed = new URL(_url)
  let h
  let locEncode = getEncoding(encoding, false)

  if (parsed.protocol === 'https:') {
    h = https
  } else if (parsed.protocol === 'http:') {
    h = http
  } else {
    throw new Error(`Unknown protocol, ${parsed.protocol}`)
  }
  const request = {
    path: parsed.pathname + parsed.search,
    port: parsed.port,
    method: method,
    headers: { ...(headers || {}), ..._headers },
    hostname: parsed.hostname
  }
  if (parsed.username || parsed.password) {
    request.auth = [parsed.username, parsed.password].join(':')
  }
  const c = caseless(request.headers)
  if (locEncode === 'json') {
    if (!c.get('accept')) {
      c.set('accept', 'application/json')
    }
  }
  if (!c.has('accept-encoding')) {
    c.set('accept-encoding', acceptEncoding)
  }
  return new Promise((resolve, reject) => {
    const req = h.request(request, async res => {
      const isErr = !statusCodes.has(res.statusCode)
      let ret = null

      locEncode = getEncoding(encoding, isErr)

      res.status = res.statusCode
      res = getResponse(res)

      // If the encoding type has not been specified, return the native response
      if (!locEncode && !isErr) return resolve(res)
      if (!locEncode && isErr) return reject(new StatusError(res))

      const buff = await getBuffer(res)

      if (locEncode === 'buffer') {
        ret = buff
      } else if (locEncode === 'json') {
        try {
          ret = JSON.parse(buff.toString())
        } catch (e) {
          e.message += `str"${buff.toString()}"`
          reject(e)
        }
      } else if (locEncode === 'string') {
        ret = buff.toString()
      }

      if (isErr) {
        reject(new StatusError(res, ret))
      } else {
        resolve(ret)
      }
    })
    req.on('error', reject)
    if (body) {
      if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
        body = bytes.native(body)
      }
      if (Buffer.isBuffer(body)) {
        // noop
      } else if (typeof body === 'string') {
        body = Buffer.from(body)
      } else if (isStream(body)) {
        body.pipe(req)
        body = null
      } else if (typeof body === 'object') {
        req.setHeader('content-type', 'application/json')
        body = Buffer.from(JSON.stringify(body))
      } else {
        reject(new Error('Unknown body type.'))
      }
      if (body) {
        req.setHeader('content-length', body.length)
        req.end(body)
      }
    } else {
      req.end()
    }
  })
}

module.exports = bent(mkrequest)
