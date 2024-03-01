const db = require('../models/index')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { logger } = require('../../helper/logger')
const { getRequestUserId } = require('../../helper')
const { isEmpty } = require('lodash')
const { Op } = require('sequelize')

const HappyToHelp = db.happyToHelp
const Employee = db.employee
const GlobalType = db.globalType
// admin
const getAllHappyToHelp = async (req, res) => {
  const { skip = 0, limit = 10 } = req.query
  const userId = getRequestUserId(req)

  try {
    if (!userId) {
      throw new BadRequest()
    }
    let allHappyToHelpList = []

    allHappyToHelpList = await HappyToHelp.findAll({
      include: [
        {
          model: GlobalType,
        },
      ],
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
    })
    allHappyToHelpList.map(async (item) => {
      const belongsTo = item?.belongsTo
      let globalType = await GlobalType.findOne({ where: { id: belongsTo } })

      if (globalType && globalType.displayName) {
        const displayName = globalType.displayName
        item['dataValues']['belongsToName'] = displayName
      }
    })
    const allH2hTotalCount = await HappyToHelp.findAll({})

    if (allHappyToHelpList) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          happyToHelpList: allHappyToHelpList,
          totalCount: allH2hTotalCount?.length,
        },
      })

      logger.info({
        controller: 'happyToHelp',
        method: 'allHappyToHelp',
        empId: `userId${userId}`,
        msg: 'allHappyToHelp data ',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'happyToHelp',
      method: 'allHappyToHelp',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.msg}`,
    })
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}
const getHappyToHelp = async (req, res) => {
  const { skip = 0, limit = 10 } = req.query
  const userId = getRequestUserId(req)

  try {
    if (!userId) {
      throw new BadRequest()
    }
    const user = await Employee.findOne({
      where: {
        userId,
      },
    })
    const communicationWith = await Employee.findAll({
      where: {
        depId: user.depId,
        isDeleted: {[Op.ne]: 1},
      },
    })
    const happyToHelpList = await HappyToHelp.findAll({
      where: { userId },
      include: [
        {
          model: GlobalType,
        },
      ],
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
    })
    const happyToHelpJSON = []
    happyToHelpList.map(async (item) => {
      const belongsTo = item?.belongsTo
      let globalType = await GlobalType.findOne({ where: { id: belongsTo } })

      if (globalType && globalType.displayName) {
        const displayName = globalType.displayName
        item['dataValues']['belongsToName'] = displayName
      }
      happyToHelpJSON.push(item)
      return item
    })
    const h2hListTotalCount = await HappyToHelp.findAll({ where: { userId } })

    if (happyToHelpList) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          happyToHelpList: happyToHelpJSON,
          totalCount: h2hListTotalCount?.length,
          communicationWith,
        },
      })

      logger.info({
        controller: 'happyToHelp',
        method: 'happyToHelp',
        empId: `userId${userId}`,
        msg: 'happyToHelp data ',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'happyToHelp',
      method: 'happyToHelp',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.message}`,
    })
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}
const addHappyToHelp = async (req, res) => {
  const { belongsTo, issue, communicationWith, mobileNo, concernOf, remark } = req.body
  const userId = getRequestUserId(req)

  try {
    if (
      !belongsTo &&
      !issue &&
      !communicationWith &&
      !mobileNo &&
      !concernOf &&
      !remark &&
      !userId
    ) {
      throw new BadRequest()
    }
    const parsedMobileNo = parseInt(mobileNo);
    const isCreated = await HappyToHelp.create({
      belongsTo,
      issue,
      communicationWith,
      mobileNo: parsedMobileNo,
      concernOf,
      remark,
      userId,
      createdBy: getRequestUserId(req),
      createdAt: new Date(),
    });
    if (!isEmpty(isCreated)) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: isCreated,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'happyToHelpController',
        method: 'happyToHelp',
        payload: isCreated,
        msg: 'happyToHelp added',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'happyToHelpController',
      method: 'happyToHelp',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.msg}`,
      mssggg: `${error}`
    })
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}
const deleteHappyToHelp = async (req, res) => {
  const { id } = req.params
  const userId = getRequestUserId(req)
  try {
    if (!id) {
      throw new BadRequest()
    }
    const deletedRows = await HappyToHelp.destroy({
      where: { id },
    })

    if (deletedRows > 0) {
      // Send success response
      res.json({
        status: true,
        message: 'Happy To Help deleted successfully',
      })
    } else {
      throw new Error('Happy To Help Not Found')
    }
  } catch (error) {
    logger.error({
      controller: 'happyToHelpController',
      method: 'happyToHelp',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.msg}`,
    })
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}
const updateHappyToHelp = async (req, res) => {
  const { id } = req.params
  const { belongsTo, issue, communicationWith, mobileNo, concernOf, remark } = req.body
  const userId = getRequestUserId(req)
  try {
    if (
      !userId &&
      !id &&
      !belongsTo &&
      !issue &&
      !communicationWith &&
      !mobileNo &&
      !concernOf &&
      !remark
    ) {
      throw new BadRequest()
    }
    const isExists = await HappyToHelp.findAll({
      where: {
        id,
      },
    })

    if (isEmpty(isExists)) {
      throw new NotFound(null, null, null, 'Happy To Help not found')
    }
    const isUpdated = await HappyToHelp.update(
      {
        id,
        belongsTo,
        issue,
        communicationWith,
        mobileNo,
        concernOf,
        remark,
        updatedAt: new Date(),
        updatedBy: getRequestUserId(req),
      },
      {
        where: {
          id,
        },
        returning: true,
      },
    )
    let updateHappyToHelpData = []
    updateHappyToHelpData = await HappyToHelp.findOne({
      where: {
        id,
      },
    })
    if (!isEmpty(isUpdated)) {
      res.status(200).json({
        status: true,
        message: 'success',
        data: updateHappyToHelpData,
      })
      logger.info({
        controller: 'happyToHelpController',
        method: 'updateHappyToHelpData',
        msg: 'Happy To Help updated successfully',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'happyToHelpController',
      method: 'updateHappyToHelpData',
      msg: `error:${error}`,
    })
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
  getAllHappyToHelp,
  addHappyToHelp,
  deleteHappyToHelp,
  getHappyToHelp,
  updateHappyToHelp,
}
