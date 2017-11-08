const http = require('http')
const https = require('https')
const url = require('url')
const bl = require('bl')
const isStream = require('is-stream')
const caseless = require('caseless')

const encodings = new Set(['json', 'buffer', 'string'])

class StatusError extends Error {
  constructor (status, ...params) {
    super(...params)

    Error.captureStackTrace(this, StatusError)
    this.message = `Incorrect statusCode: ${status}`
    this.statusCode = status
  }
}

const bent = (...args) => {
  let statusCodes = new Set()
  let method
  let encoding
  let headers
  let baseurl = ''

  args.forEach(arg => {
    if (typeof arg === 'string') {
      if (arg.toUpperCase() === arg) {
        if (method) {
          let msg = `Can't set method to ${arg}, already set to ${method}.`
          throw new Error(msg)
        } else {
          method = arg
        }
      } else if (arg.startsWith('http:') || arg.startsWith('https:')) {
        baseurl = arg
      } else {
        if (encodings.has(arg)) {
          encoding = arg
        } else {
          throw new Error(`Unknown encoding, ${arg}`)
        }
      }
    } else if (typeof arg === 'number') {
      statusCodes.add(arg)
    } else if (typeof arg === 'object') {
      if (headers) {
        throw new Error('Cannot set headers twice.')
      }
      headers = arg
    } else {
      throw new Error(`Unknown type: ${typeof arg}`)
    }
  })

  if (!method) method = 'GET'
  if (statusCodes.size === 0) {
    statusCodes.add(200)
  }

  return (_url, body = null) => {
    _url = baseurl + _url
    let parsed = url.parse(_url)
    let h
    if (parsed.protocol === 'https:') {
      h = https
    } else if (parsed.protocol === 'http:') {
      h = http
    } else {
      throw new Error(`Unknown protocol, ${parsed.protocol}`)
    }
    let request = {
      path: parsed.path,
      port: parsed.port,
      method: method,
      headers: headers || {},
      hostname: parsed.hostname
    }
    if (encoding === 'json') {
      let c = caseless(request.headers)
      c.set('accept', 'application/json')
    }
    return new Promise((resolve, reject) => {
      let req = h.request(request, res => {
        if (!statusCodes.has(res.statusCode)) {
          return reject(new StatusError(res.statusCode))
        }
        if (!encoding) return resolve(res)
        else {
          res.pipe(bl((err, buff) => {
            /* istanbul ignore if */
            if (err) return reject(err)
            /* We already guard against these
               above so that we get an early error. */
            /* istanbul ignore else */
            if (encoding === 'buffer') {
              resolve(buff)
            } else if (encoding === 'json') {
              resolve(JSON.parse(buff.toString()))
            } else if (encoding === 'string') {
              resolve(buff.toString())
            }
          }))
        }
      })
      req.on('error', reject)
      if (body) {
        if (Buffer.isBuffer(body)) {
          req.end(body)
        } else if (isStream(body)) {
          body.pipe(req)
        } else if (typeof body === 'object') {
          req.end(JSON.stringify(body))
        } else {
          reject(new Error('Unknown body type.'))
        }
      } else {
        req.end()
      }
    })
  }
}

module.exports = bent
