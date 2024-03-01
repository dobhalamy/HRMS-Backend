const HttpStatusCode = require('../../enums/httpErrorCodes')

module.exports.asyncMiddleware = (callback) => {
  return async (req, res, next) => {
    try {
      await callback(req, res, next)
    } catch (error) {
      res.status(error?.httpCode || HttpStatusCode?.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message || error,
        statusCode: error?.httpCode || HttpStatusCode?.INTERNAL_SERVER,
      })
    }
  }
}
