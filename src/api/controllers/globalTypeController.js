const { isEmpty } = require('lodash')
const sequelize = require('sequelize')
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const ObjectHelper = require('../../helper')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { APIError } = require('../../helper/apiErrors')
const { MessageTag } = require('../../enums/messageNums')

const GlobalTypeMapping = db.globalTypeMapping
const GlobalType = db.globalType
const GlobalTypeCategory = db.globalTypeCategory

const masterGlobalType = async (req, res) => {
  const { category } = req.params

  logger.warn(
    {
      controller: 'globalType',
      method: 'masterGlobalType',
    },
    { payload: category, msg: 'Get master global type started' },
  )

  try {
    const resultCategory = await GlobalTypeCategory.findAll({
      where: {
        where: sequelize.where(sequelize.col('uniqueValue'), '=', category),
        $and: sequelize.where(sequelize.col('isActive'), '=', '1'),
      },
    })
    if (isEmpty(resultCategory)) {
      logger.error({
        controller: 'globalType',
        method: 'masterGlobalType',
        payload: category,
        msg: 'Global type category not exists',
      })
      res.status(HttpStatusCode.NOT_FOUND).json({
        status: false,
        message: MessageTag.GTC_NOT,
        statusCode: HttpStatusCode.NOT_FOUND,
      })
      return
    }
    const result = await GlobalType.findAll({
      where: {
        where: sequelize.where(sequelize.col('globalTypeCategory_uniqeValue'), '=', category),
        $and: sequelize.where(sequelize.col('isActive'), '=', '1'),
      },
    })
    res.status(HttpStatusCode.OK).send({
      status: true,
      statusCode: HttpStatusCode.OK,
      data: result,
    })
    logger.info({
      controller: 'globalType',
      method: 'masterGlobalType',
      payload: category,
      msg: 'Master global type list: ',
    })
  } catch (error) {
    logger.error({
      controller: 'globalType',
      method: 'masterGlobalType',
      payload: category,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(400).json({ status: false, error: error?.message })
  }
}

const addGlobalType = async (req, res) => {
  const globalTypeParam = req?.body
  if (!isEmpty(globalTypeParam)) {
    const displayName = globalTypeParam?.name
    const globalTypeCategory = globalTypeParam?.globalTypeCategory
    logger.warn({
      controller: 'globalType',
      method: 'addGlobalType',
      payload: displayName,
      msg: 'Add global type started',
    })
    const uniqueValue = globalTypeParam?.uniqueValue?.replace(/ /g, '_').toLowerCase()
    try {
      if (!displayName || !globalTypeCategory) throw new Error(MessageTag.ALL_REQ)
      const isCategoryExists = await GlobalTypeCategory.findOne({
        where: {
          uniqueValue: globalTypeCategory,
        },
      })
      if (isEmpty(isCategoryExists)) {
        logger.error({
          controller: 'globalType',
          method: 'addGlobalType',
          payload: displayName,
          msg: 'Global type Category not exists',
        })
        res.status(HttpStatusCode.NOT_FOUND).json({
          status: false,
          message: MessageTag.GTC_NOT,
          statusCode: HttpStatusCode.NOT_FOUND,
        })
        return
      }
      const isExists = await GlobalType.findOne({
        where: {
          uniqueValue,
          globalTypeCategory_uniqeValue: globalTypeCategory,
        },
      })
      if (!isEmpty(isExists)) {
        logger.error({
          controller: 'globalType',
          method: 'addGlobalType',
          payload: displayName,
          msg: 'Global type already exists',
        })
        res.status(HttpStatusCode.CONFLICT).json({
          status: false,
          message: MessageTag.GLOBALTYPE_EXIST,
          statusCode: HttpStatusCode.CONFLICT,
        })
        return
      }
      const result = await GlobalType.create({
        displayName,
        uniqueValue,
        globalTypeCategory_uniqeValue: globalTypeCategory,
        createdBy: ObjectHelper.getRequestUserId(req),
        createdAt: new Date(),
      })
      const data = ObjectHelper.formatKeys(result.dataValues)
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: MessageTag.GLOBALTYPE_ADD,
        statusCode: HttpStatusCode.OK,
        data,
      })
      logger.info(
        {
          controller: 'globalType',
          method: 'addGlobalType',
        },
        {
          data: isExists,
          msg: `Global type added: ${displayName}`,
        },
      )
    } catch (error) {
      logger.error({
        controller: 'globalType',
        method: 'addGlobalType',
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

const updateGlobalType = async (req, res) => {
  const { id } = req.params
  const globalTypeParam = req?.body
  if (!isEmpty(globalTypeParam)) {
    const displayName = globalTypeParam?.name
    const uniqueValue = displayName?.replace(/ /g, '_').toLowerCase()
    const globalTypeCategory = globalTypeParam?.globalTypeCategory

    logger.warn({
      controller: 'globalType',
      method: 'updateGlobalType',
      payload: displayName,
      msg: 'Update global type started',
    })

    try {
      if (!displayName || !globalTypeCategory) throw new Error(MessageTag.ALL_REQ)

      const isCategoryExists = await GlobalTypeCategory.findOne({
        where: {
          uniqueValue: globalTypeCategory,
        },
      })
      if (isEmpty(isCategoryExists)) {
        logger.error({
          controller: 'globalType',
          method: 'updateGlobalType',
          payload: displayName,
          msg: 'Global type Category not exists',
        })
        res.status(HttpStatusCode.NOT_FOUND).json({
          status: false,
          message: MessageTag.GTC_NOT,
          statusCode: HttpStatusCode.NOT_FOUND,
        })
        return
      }

      const isExists = await GlobalType.findOne({
        where: {
          uniqueValue,
          globalTypeCategory_uniqeValue: globalTypeCategory,
        },
      })
      if (!isEmpty(isExists) && isExists?.id != id) {
        logger.error({
          controller: 'globalType',
          method: 'updateGlobalType',
          payload: displayName,
          msg: 'Global type already exists',
        })
        throw new APIError('Conflict', HttpStatusCode.CONFLICT, false, MessageTag.GLOBALTYPE_EXIST)
      }

      await GlobalType.update(
        {
          displayName,
          globalTypeCategory_uniqeValue: globalTypeCategory,
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
        message: MessageTag.GLOBALTYPE_UPDATE,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'globalType',
        method: 'updateGlobalType',
        data: isExists,
        msg: `Global type updated,Id: ${id}`,
      })
    } catch (error) {
      logger.error({
        controller: 'globalType',
        method: 'updateGlobalType',
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

const deleteGlobalType = async (req, res) => {
  const { id } = req.params
  logger.warn(
    {
      controller: 'globalType',
      method: 'deleteGlobalType',
    },
    { payload: id, msg: 'Delete global type started' },
  )

  try {
    const isExists = await GlobalType.findOne({
      where: { id },
    })
    if (isEmpty(isExists)) {
      logger.error(
        {
          controller: 'globalType',
          method: 'deleteGlobalType',
        },
        {
          payload: id,
          msg: 'Global type not exists',
        },
      )
      res.status(400).json({ status: false, error: MessageTag.GLOBALTYPE_NOT_EXIST })
      return
    }

    await GlobalType.destroy({
      where: {
        id,
      },
    })
    res.status(200).send({
      status: true,
      message: MessageTag.GLOBALTYPE_DELETE,
    })
    logger.info(
      {
        controller: 'globalType',
        method: 'deleteGlobalType',
      },
      {
        data: isExists,
        msg: `Global type deleted,Id: ${id}`,
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'globalType',
        method: 'deleteGlobalType',
      },
      {
        payload: id,
        msg: `Catch error: ${error?.message}`,
      },
    )
    res.status(400).json({ status: false, error: error?.message })
  }
}

const getGlobalType = async (req, res) => {
  const { skip = 0, limit = 0, globalTypeCategory = null } = req.query
  logger.warn({
    controller: 'globalType',
    method: 'getGlobalType',
    payload: null,
    msg: 'Get global type started',
  })

  try {
    if (globalTypeCategory) {
      const result = await GlobalType.findAll({
        where: {
          globalTypeCategory_uniqeValue: globalTypeCategory,
        },
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'DESC']],
      })
      const totalCount = await GlobalType.findAll({
        where: {
          globalTypeCategory_uniqeValue: globalTypeCategory,
        },
      })
      if(limit==0){
        res.status(200).send({
          status: true,
          data: {globalType : totalCount }
        })
      } else {
        res.status(200).send({
          status: true,
          data: {globalType: result, totalCount: totalCount?.length}
        })
      }
      // res.status(200).send({
      //   status: true,
      //   data: limit === 0? { globalType : totalCount } : {globalType: result, totalCount: totalCount?.length}
      //   // data: { globalType: result, totalCount: totalCount?.length },
      // })
    } else {
      const result = await GlobalType.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'DESC']],
      })
      const totalCount = await GlobalType.findAll()
      if(limit==0){
        res.status(200).send({
          status: true,
          data: {globalType : totalCount }
        })
      } else {
        res.status(200).send({
          status: true,
          data: {globalType: result, totalCount: totalCount?.length}
        })
      }
    }
  } catch (error) {
    logger.error({
      controller: 'globalType',
      method: 'getGlobalType',
      payload: null,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(HttpStatusCode.NOT_ALLOWED).json({ status: false, error: error?.message })
  }
}

const updateStatusGlobalType = async (req, res) => {
  const { id } = req.params
  let isActive
  const globalTypeParam = req?.body
  if (!isEmpty(globalTypeParam)) {
    if (globalTypeParam?.isActive === 1) {
      isActive = 0
    } else {
      isActive = 1
    }
    logger.warn({
      controller: 'globalType',
      method: 'updateStatusGlobalType',
      payload: globalTypeParam,
      msg: 'Update status global type started',
    })

    try {
      const isExists = await GlobalType.findOne({
        where: { id },
      })
      if (isEmpty(isExists)) {
        logger.error({
          controller: 'globalType',
          method: 'updateStatusGlobalType',
          payload: globalTypeParam,
          msg: 'Global type not exists',
        })
        res.status(400).json({ status: false, error: MessageTag.GLOBALTYPE_NOT_EXIST })
        return
      }

      await GlobalType.update(
        {
          isActive,
          updatedBy: ObjectHelper.getRequestUserId(req),
          updatedAt: new Date(),
        },
        {
          where: {
            id: id,
          },
        },
      )
      res.status(200).send({
        status: true,
        message: MessageTag.GLOBALTYPE_UPDATE,
      })
      logger.info(
        {
          controller: 'globalType',
          method: 'updateStatusGlobalType',
        },
        {
          data: isExists,
          msg: `Global type updated,Id: ${id}`,
        },
      )
    } catch (error) {
      logger.error(
        {
          controller: 'globalType',
          method: 'updateStatusGlobalType',
        },
        {
          payload: null,
          msg: `Catch error: ${error?.message}`,
        },
      )
      res.status(400).json({ status: false, error: error?.message })
    }
  }
}
const nestedGlobalType = async (req, res) => {
  const { category, parentId } = req.params

  logger.warn(
    {
      controller: 'globalType',
      method: 'masterGlobalType',
    },
    { payload: category, msg: 'Get master global type started' },
  )

  try {
    const resultCategory = await GlobalTypeCategory.findAll({
      where: {
        where: sequelize.where(sequelize.col('uniqueValue'), '=', category),
        $and: sequelize.where(sequelize.col('isActive'), '=', '1'),
      },
    })
    if (isEmpty(resultCategory)) {
      logger.error({
        controller: 'globalType',
        method: 'masterGlobalType',
        payload: category,
        msg: 'Global type category not exists',
      })
      res.status(HttpStatusCode.NOT_FOUND).json({
        status: false,
        message: MessageTag.GTC_NOT,
        statusCode: HttpStatusCode.NOT_FOUND,
      })
      return
    }
    const categoryId = resultCategory[0].id

    const resultSubCategory = await GlobalType.findAll({
      where: {
        where: sequelize.where(sequelize.col('id'), '=', parentId),
        $and: sequelize.where(sequelize.col('isActive'), '=', '1'),
      },
    })

    if (isEmpty(resultSubCategory)) {
      logger.error({
        controller: 'globalType',
        method: 'masterGlobalType',
        payload: category,
        msg: 'Global type not exists',
      })
      res.status(HttpStatusCode.NOT_FOUND).json({
        status: false,
        message: MessageTag.GLOBALTYPE_NOT_EXIST,
        statusCode: HttpStatusCode.NOT_FOUND,
      })
      return
    }
    const result = await GlobalTypeMapping.findAll({
      include: [
        {
          model: GlobalType,
          attributes: ['displayName', 'id'], // Specify which attributes to include
        },
      ],
      where: {
        parentId,
        globalTypeCategoryId: categoryId,
      },
      attributes: ['id', 'globalTypeId', 'parentId'], // Specify which attributes to include
    })
    res.status(HttpStatusCode.OK).send({
      status: true,
      statusCode: HttpStatusCode.OK,
      data: result,
    })
    logger.info({
      controller: 'globalType',
      method: 'masterGlobalType',
      payload: category,
      msg: 'Master global type list: ',
    })
  } catch (error) {
    logger.error({
      controller: 'globalType',
      method: 'masterGlobalType',
      payload: category,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(400).json({ status: false, error: error?.message })
  }
}

module.exports = {
  masterGlobalType,
  addGlobalType,
  updateGlobalType,
  deleteGlobalType,
  getGlobalType,
  updateStatusGlobalType,
  nestedGlobalType,
}
