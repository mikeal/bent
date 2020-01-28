'use strict'
/* global fetch */
const core = require('./core')

class StatusError extends Error {
  constructor (res, ...params) {
    super(...params)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StatusError)
    }

    this.message = `Incorrect statusCode: ${res.status}`
    this.statusCode = res.status
    this.res = res
    this.responseBody = res.arrayBuffer()
  }
}

const mkrequest = (statusCodes, method, encoding, headers, baseurl) => async (_url, body, _headers = {}) => {
  _url = baseurl + _url
  const parsed = new URL(_url)

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Unknown protocol, ${parsed.protocol}`)
  }

  if (body) {
    if (body instanceof ArrayBuffer ||
      ArrayBuffer.isView(body) ||
      typeof body === 'string'
    ) {
      // noop
    } else if (typeof body === 'object') {
      body = JSON.stringify(body)
      if (!headers) headers = {}
      headers['Content-Type'] = 'application/json'
    } else {
      throw new Error('Unknown body type.')
    }
  }

  _headers = { ...(headers || {}), ..._headers }

  const resp = await fetch(_url, { method, headers: _headers, body })
  resp.statusCode = resp.status

  if (!statusCodes.has(resp.status)) {
    throw new StatusError(resp)
  }

  if (encoding === 'json') return resp.json()
  else if (encoding === 'buffer') return resp.arrayBuffer()
  else if (encoding === 'string') return resp.text()
  else return resp
}

module.exports = core(mkrequest)
