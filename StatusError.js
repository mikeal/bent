class StatusError extends Error {
  constructor (status, ...params) {
    super(...params)

    Error.captureStackTrace(this, StatusError)
    this.message = `Incorrect statusCode: ${status}`
    this.statusCode = status
  }
}

module.exports = StatusError
