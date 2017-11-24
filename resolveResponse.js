const bl = require('bl')
const isStream = require('is-stream')
const StatusError = require('./StatusError')

const resolveResponse = ({ request, statusCodes, encoding, body, protocol }) => {
  return new Promise((resolve, reject) => {
    let req = protocol.request(request, res => {
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

module.exports = resolveResponse
