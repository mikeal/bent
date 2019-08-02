'use strict'
const http = require('http')
const https = require('https')
const { URL } = require('url')
const isStream = require('is-stream')
const caseless = require('caseless')
const bent = require('./core')

class StatusError extends Error {
  constructor (res, ...params) {
    super(...params)

    Error.captureStackTrace(this, StatusError)
    this.message = `Incorrect statusCode: ${res.statusCode}`
    this.statusCode = res.statusCode
    this.responseBody = new Promise((resolve) => {
      const buffers = []
      res.on('data', chunk => buffers.push(chunk))
      res.on('end', () => resolve(Buffer.concat(buffers)))
    })
  }
}

const getBuffer = stream => new Promise((resolve, reject) => {
  const parts = []
  stream.on('error', reject)
  stream.on('end', () => resolve(Buffer.concat(parts)))
  stream.on('data', d => parts.push(d))
})

const mkrequest = (statusCodes, method, encoding, headers, baseurl) => (_url, body = null) => {
  _url = baseurl + _url
  const parsed = new URL(_url)
  let h
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
    headers: headers || {},
    hostname: parsed.hostname
  }
  if (encoding === 'json') {
    const c = caseless(request.headers)
    if (!c.get('accept')) {
      c.set('accept', 'application/json')
    }
  }
  return new Promise((resolve, reject) => {
    const req = h.request(request, async res => {
      res.status = res.statusCode
      if (!statusCodes.has(res.statusCode)) {
        return reject(new StatusError(res))
      }
      if (!encoding) return resolve(res)
      else {
        const buff = await getBuffer(res)
        /* istanbul ignore else */
        if (encoding === 'buffer') {
          resolve(buff)
        } else if (encoding === 'json') {
          let ret
          try {
            ret = JSON.parse(buff.toString())
            resolve(ret)
          } catch (e) {
            e.message += `str"${buff.toString()}"`
            reject(e)
          }
        } else if (encoding === 'string') {
          resolve(buff.toString())
        }
      }
    })
    req.on('error', reject)
    if (body) {
      if (Buffer.isBuffer(body) || typeof body === 'string') {
        req.end(body)
      } else if (isStream(body)) {
        body.pipe(req)
      } else if (typeof body === 'object') {
        req.setHeader('content-type', 'application/json')
        req.end(JSON.stringify(body))
      } else {
        reject(new Error('Unknown body type.'))
      }
    } else {
      req.end()
    }
  })
}

module.exports = bent(mkrequest)
