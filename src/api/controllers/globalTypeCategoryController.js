const { isEmpty } = require('lodash')
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const ObjectHelper = require('../../helper')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { Op } = require('sequelize')
const { MessageTag } = require('../../enums/messageNums')

const GlobalTypeCategory = db.globalTypeCategory

const addGlobalTypeCategory = async (req, res) => {
  const globalTypeCategoryParam = req?.body
  if (!isEmpty(globalTypeCategoryParam)) {
    const displayName = globalTypeCategoryParam?.name
    logger.warn({
      controller: 'globalTypeCategory',
      method: 'addGlobalTypeCategory',
      payload: displayName,
      msg: 'Add global type category started',
    })
    const uniqueValue = globalTypeCategoryParam?.uniqueValue?.replace(/ /g, '_').toLowerCase()
    try {
      if (!displayName) throw new Error(MessageTag.ALL_REQ)
      const isExists = await GlobalTypeCategory.findOne({
        where: {
          [Op.or]: [{ uniqueValue }, { displayName }],
        },
      })
      if (!isEmpty(isExists)) {
        logger.error({
          controller: 'globalTypeCategory',
          method: 'addGlobalTypeCategory',
          payload: displayName,
          msg: 'Global type category already exists',
        })
        res.status(HttpStatusCode.CONFLICT).json({
          status: false,
          message: MessageTag.EXIST_GTC,
          statusCode: HttpStatusCode.CONFLICT,
        })
        return
      }
      await GlobalTypeCategory.create({
        displayName,
        uniqueValue,
        createdBy: ObjectHelper.getRequestUserId(req),
        createdAt: new Date(),
      })
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: MessageTag.GTC_ADD,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'globalTypeCategory',
        method: 'addGlobalTypeCategory',
        data: isExists,
        msg: `Global category added: ${displayName}`,
      })
    } catch (error) {
      logger.error({
        controller: 'globalTypeCategory',
        method: 'addGlobalTypeCategory',
        payload: displayName,
        msg: `Catch error: ${error?.message}`,
      })
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}

const updateGlobalTypeCategory = async (req, res) => {
  const { id } = req.params
  const globalTypeCategoryParam = req?.body
  if (!isEmpty(globalTypeCategoryParam)) {
    const displayName = globalTypeCategoryParam?.name
    const uniqueValue = displayName?.replace(/ /g, '_').toLowerCase()
    logger.warn({
      controller: 'globalTypeCategory',
      method: 'updateGlobalTypeCategory',
      payload: displayName,
      msg: 'Update global type category started',
    })

    try {
      if (!displayName) throw new Error(MessageTag.ALL_REQ)
      const isExists = await GlobalTypeCategory.findOne({
        where: { displayName, uniqueValue },
      })
      if (!isEmpty(isExists) && isExists?.id != id) {
        logger.error({
          controller: 'globalTypeCategory',
          method: 'updateGlobalTypeCategory',
          payload: displayName,
          msg: 'Global type category already exists',
        })
        res.status(HttpStatusCode.CONFLICT).json({
          status: false,
          message: MessageTag.EXIST_GTC,
          statusCode: HttpStatusCode.CONFLICT,
        })
        return
      }

      await GlobalTypeCategory.update(
        {
          displayName,
          updatedBy: ObjectHelper.getRequestUserId(req),
          updatedAt: new Date(),
        },
        {
          where: {
            id,
          },
        },
      )
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: MessageTag.GTC_UPDATE,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'globalTypeCategory',
        method: 'updateGlobalTypeCategory',
        data: isExists,
        msg: `Global category updated, Id: ${id}`,
      })
    } catch (error) {
      logger.error({
        controller: 'globalTypeCategory',
        method: 'updateGlobalTypeCategory',
        payload: displayName,
        msg: `Catch error: ${error?.message}`,
      })
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}

const deleteGlobalTypeCategory = async (req, res) => {
  const { id } = req.params
  logger.warn(
    {
      controller: 'globalTypeCategory',
      method: 'deleteGlobalTypeCategory',
    },
    { payload: id, msg: 'Delete global type category started' },
  )

  try {
    const isExists = await GlobalTypeCategory.findOne({
      where: { id },
    })
    if (isEmpty(isExists)) {
      logger.error({
        controller: 'globalTypeCategory',
        method: 'deleteGlobalTypeCategory',
        payload: id,
        msg: 'Global type category not exists',
      })
      res.status(419).json({ status: false, error: MessageTag.GTC_NOT })
      return
    }

    await GlobalTypeCategory.destroy({
      where: {
        id,
      },
    })
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: MessageTag.GTC_DELETE,
    })
    logger.info({
      controller: 'globalTypeCategory',
      method: 'deleteGlobalTypeCategory',
      data: isExists,
      msg: `Global category deleted,Id: ${id}`,
    })
  } catch (error) {
    logger.error({
      controller: 'globalTypeCategory',
      method: 'deleteGlobalTypeCategory',
      payload: id,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(419).json({ status: false, error: error?.message })
  }
}

const getGlobalTypeCategory = async (req, res) => {
  const { skip = 0, limit = 0 } = req.query

  logger.warn({
    controller: 'globalTypeCategory',
    method: 'getGlobalTypeCategory',
    payload: `requested employee id:${ObjectHelper.getRequestUserId(req)}`,
    msg: 'Get global type category started',
  })

  try {
    const result = await GlobalTypeCategory.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      order: [['id', 'DESC']],
    })
    const totalCount = await GlobalTypeCategory.findAll()

    if (result) {
      if (!skip) {
        res.status(HttpStatusCode.OK).send({
          status: true,
          message: MessageTag.GTC_LIST,
          data: { globalTypeCategory: totalCount, totalCount: totalCount?.length },
        })
      } else {
        res.status(HttpStatusCode.OK).send({
          status: true,
          message: MessageTag.GTC_LIST,
          data: { globalTypeCategory: result, totalCount: totalCount?.length },
        })
      }
    }
  } catch (error) {
    logger.error({
      controller: 'globalTypeCategory',
      method: 'getGlobalTypeCategory',
      payload: `requested employee id:${ObjectHelper.getRequestUserId(req)}`,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(HttpStatusCode.NOT_ALLOWED).json({ status: false, error: error?.message })
  }
}

const updateStatusGlobalTypeCategory = async (req, res) => {
  const { id } = req.params
  let isActive
  const globalTypeCategoryParam = req?.body
  if (!isEmpty(globalTypeCategoryParam)) {
    if (globalTypeCategoryParam?.isActive === 1) {
      isActive = 0
    } else {
      isActive = 1
    }
    logger.warn({
      controller: 'globalTypeCategory',
      method: 'updateStatusGlobalTypeCategory',
      payload: globalTypeCategoryParam,
      msg: 'Update status global type category started',
    })

    try {
      const isExists = await GlobalTypeCategory.findOne({
        where: { id },
      })
      if (isEmpty(isExists)) {
        logger.error({
          controller: 'globalTypeCategory',
          method: 'updateStatusGlobalTypeCategory',
          payload: globalTypeCategoryParam,
          msg: 'Global type category not exists',
        })
        res.status(419).json({ status: false, error: MessageTag.GTC_NOT })
        return
      }

      const result = await GlobalTypeCategory.update(
        {
          isActive,
          updatedBy: '1',
          updatedAt: new Date(),
        },
        {
          where: {
            id,
          },
        },
      )
      if (result) {
        res.status(HttpStatusCode.OK).send({
          status: true,
          message: MessageTag.GTC_UPDATE,
        })
        logger.info({
          controller: 'globalTypeCategory',
          method: 'updateStatusGlobalTypeCategory',
          data: isExists,
          msg: `Global category updated,Id: ${id}`,
        })
      }
    } catch (error) {
      logger.error({
        controller: 'globalTypeCategory',
        method: 'updateStatusGlobalTypeCategory',
        payload: `requested employee id:${ObjectHelper.getRequestUserId(req)}`,
        msg: `Catch error: ${error?.message}`,
      })
      res.status(419).json({ status: false, error: error?.message })
    }
  }
}
module.exports = {
  addGlobalTypeCategory,
  updateGlobalTypeCategory,
  deleteGlobalTypeCategory,
  getGlobalTypeCategory,
  updateStatusGlobalTypeCategory,
}
