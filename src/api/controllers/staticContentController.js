const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest } = require('../../helper/apiErrors')
const { logger } = require('../../helper/logger')
const db = require('../models/index')
const { getRequestUserId } = require('../../helper')
const StaticContent = db.staticContent

const updateStaticContent = async (req, res) => {
  const { empId, title, content } = req.body

  try {
    if (!empId || !title || !content) {
      throw new BadRequest()
    }
    const [updatedContent, created] = await StaticContent.findOrCreate({
      where: { title },
      defaults: {
        content,
        createdBy: getRequestUserId(req),
        createdAt: new Date(),
      },
    })
    if (!created) {
      await updatedContent.update(
        {
          content,
          updatedBy: getRequestUserId(req),
          updatedAt: new Date(),
        },
        {
          where: {
            title: title,
          },
        },
      )
    }
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: updatedContent,
      statusCode: HttpStatusCode.OK,
    })
    logger.info(
      {
        controller: 'staticContentController',
        method: 'updateStaticContent',
      },
      {
        empId: `employeeId${empId}`,
        msg: 'static Content updated successfully',
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'staticContentController',
        method: 'updateStaticContent',
      },
      {
        empId: `employId: ${empId}`,
        msg: `Catch error:${error?.msg}`,
      },
    )
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}

const getStaticContent = async (req, res) => {
  const { empId, title } = req.query
  try {
    if (!empId || !title) {
      throw new BadRequest()
    }
    const getContent = await StaticContent.findAll({
      where: {
        title,
      },
    })
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'successfully get staticContent',
      data: getContent,
      statusCode: HttpStatusCode.OK,
    })
    logger.info(
      {
        controller: 'staticContentController',
        method: 'getStaticContent',
      },
      {
        empId: `employeeId${empId}`,
        msg: 'static content get successfully',
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'getStaticContent',
        method: 'get static Content',
      },
      {
        empId: `employId: ${empId}`,
        msg: `Catch error:${error?.msg}`,
      },
    )
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}

module.exports = {
  updateStaticContent,
  getStaticContent,
}
