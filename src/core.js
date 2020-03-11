'use strict'
const encodings = new Set(['json', 'buffer', 'string'])

const { stateEncode } = require('./common')

const checkEncoding = (val, state) => {
  if (val !== undefined && !encodings.has(val)) {
    throw new Error(state !== undefined ? `Unknown encoding '${val}' in state '${state}'.` : `Unknown encoding, ${val}`)
  }

  return val
}

module.exports = mkrequest => (...args) => {
  const statusCodes = new Set()
  let method
  let encoding
  let headers
  let baseurl = ''

  args.forEach(arg => {
    if (typeof arg === 'string') {
      if (arg.toUpperCase() === arg) {
        if (method) {
          const msg = `Can't set method to ${arg}, already set to ${method}.`
          throw new Error(msg)
        } else {
          method = arg
        }
      } else if (arg.startsWith('http:') || arg.startsWith('https:')) {
        baseurl = arg
      } else {
        if (encoding) {
          throw new Error('Cannot set encoding twice.')
        } else {
          encoding = checkEncoding(arg)
        }
      }
    } else if (typeof arg === 'number') {
      statusCodes.add(arg)
    } else if (typeof arg === 'object') {
      if (arg[stateEncode[0]] !== undefined || arg[stateEncode[1]] !== undefined) {
        if (encoding) {
          throw new Error('Cannot set encoding twice.')
        }

        stateEncode.forEach(st => {
          checkEncoding(arg[st], st)
        })

        encoding = arg
      } else {
        if (headers) {
          throw new Error('Cannot set headers twice.')
        }
        headers = arg
      }
    } else {
      throw new Error(`Unknown type: ${typeof arg}`)
    }
  })

  if (!method) method = 'GET'
  if (statusCodes.size === 0) {
    statusCodes.add(200)
  }

  return mkrequest(statusCodes, method, encoding, headers, baseurl)
}
