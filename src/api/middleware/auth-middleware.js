const jwt = require("jsonwebtoken")
const { Unauthorized, APIError } = require("../../helper/apiErrors")
const HttpStatusCode = require("../../enums/httpErrorCodes")
const MessageTag = require("../../enums/messageNums")

// middleware to check if jwt is valid or not for user request
const isUserAuthenticated = (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization
    const jwtToken = authHeader && authHeader.split(" ")[1]
    if (jwtToken == null) throw new Unauthorized()
     jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => { 
      if (err) {
        throw new APIError("Forbidden", HttpStatusCode.FORBIDDEN, false, MessageTag.INVALID_TOKEN)
      }
      req.user = user
      next()
    })
  } catch (error) {
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      status: error?.isOperational || false,
      message: error?.message,
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    })
  }
}
module.exports = {
  isUserAuthenticated,
}
