const http = require('http')
const https = require('https')
const url = require('url')
const caseless = require('caseless')

const resolveArgs = require('./resolveArgs')
const resolveResponse = require('./resolveResponse')

const getProtocol = (parsedProtocol) => {
  if (parsedProtocol === 'https:') {
    return https
  } else if (parsedProtocol === 'http:') {
    return http
  } else {
    throw new Error(`Unknown protocol, ${parsedProtocol}`)
  }
}

const bent = (...args) => {
  let {
    statusCodes,
    method = 'GET',
    encoding,
    headers,
    baseurl
  } = resolveArgs(args)

  if (statusCodes.size === 0) {
    statusCodes.add(200)
  }

  return (_url, body = null) => {
    _url = baseurl + _url
    const parsed = url.parse(_url)
    const protocol = getProtocol(parsed.protocol)

    const request = {
      path: parsed.path,
      port: parsed.port,
      method: method,
      headers: headers || {},
      hostname: parsed.hostname
    }

    if (encoding === 'json') {
      const c = caseless(request.headers)
      c.set('accept', 'application/json')
    }

    return resolveResponse({ request, statusCodes, encoding, body, protocol })
  }
}

module.exports = bent
