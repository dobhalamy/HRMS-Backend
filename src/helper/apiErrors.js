/* eslint-disable max-classes-per-file */
const HttpStatusCode = require('../enums/httpErrorCodes')

class BaseError extends Error {
  constructor(name, httpCode, isOperational, description) {
    super(description)
    Object.setPrototypeOf(this, new.target.prototype)

    this.name = name
    this.httpCode = httpCode
    this.isOperational = isOperational
    this.message = description

    Error.captureStackTrace(this)
  }
}
// free to extend the BaseError
class APIError extends BaseError {
  constructor(
    name,
    httpCode = HttpStatusCode.INTERNAL_SERVER,
    isOperational = true,
    description = 'internal server error',
  ) {
    super(name, httpCode, isOperational, description)
  }
}
class Unauthorized extends APIError {
  constructor(
    name = 'Unauthorized',
    httpCode = HttpStatusCode.UNAUTHORIZED,
    isOperational = false,
    description = 'User is not authorized',
  ) {
    super(name, httpCode, isOperational, description)
  }
}
class NotFound extends APIError {
  constructor(
    name = 'NotFound',
    httpCode = HttpStatusCode.NOT_FOUND,
    isOperational = false,
    description = 'Not found',
  ) {
    super(name, httpCode, isOperational, description)
  }
}
class NotAllowed extends APIError {
  constructor(
    name = 'NotAllowed',
    httpCode = HttpStatusCode.NOT_ALLOWED,
    isOperational = false,
    description = 'Not allowed',
  ) {
    super(name, httpCode, isOperational, description)
  }
}
class BadRequest extends APIError {
  constructor(
    name = 'BadRequest',
    httpCode = HttpStatusCode.BAD_REQUEST,
    isOperational = false,
    description = 'All fields are required',
  ) {
    super(name, httpCode, isOperational, description)
  }
}

module.exports = {
  APIError,
  Unauthorized,
  NotFound,
  NotAllowed,
  BadRequest,
}
