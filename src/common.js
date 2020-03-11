'use strict'
/**
 * The types of encoding states which can be defined for the success or failure from a request.
 */
const stateEncode = ['onSuccessEncode', 'onErrorEncode']

/**
 * Makes a buffer from a response stream.
 *
 * @param {stream} stream a response stream to read as a buffer
 */
const getBuffer = stream => new Promise((resolve, reject) => {
  const parts = []
  stream.on('error', reject)
  stream.on('end', () => resolve(Buffer.concat(parts)))
  stream.on('data', d => parts.push(d))
})

/**
 * Gets the encoding type which matches the 'stateEncode' object.
 *
 * @param {object|string} encoding a string or an object which contains properties which match stateEncode
 * @param {boolean} isError if the encoding state is or is not an error
 */
const getEncoding = (encoding, isError) => {
  return typeof encoding === 'object' ? isError ? encoding[stateEncode[1]] : encoding[stateEncode[0]] : encoding
}

module.exports = {
  getBuffer,
  getEncoding,
  stateEncode
}
