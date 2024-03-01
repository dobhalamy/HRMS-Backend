const { MessageTag, RoleEnums } = require('../../enums/messageNums')
const db = require('../models/index')
const { getRequestUserId, getRequestUserRole } = require('../../helper')
const { asyncMiddleware } = require('../middleware/async-middleware')
const { Op } = require('sequelize')
const { logger } = require('../../helper/logger')
const { isEmpty } = require('lodash')
const HttpStatusCode = require('../../enums/httpErrorCodes')

const Employee = db.employee
const RygStatus = db.rygStatus
const GlobalType = db.globalType

const getListOfRYGEmployees = asyncMiddleware(async (req, res) => {
  const { StatusFilter = null, EmployeeFilter = null, skip = 0, limit = 0 } = req.query
  const userRole = getRequestUserRole(req)

  let whereCondition = {}
  let whereRYGCondition = {}
  if (userRole != RoleEnums?.HR && userRole != RoleEnums?.SUPERADMIN) {
    res.status(HttpStatusCode.BAD_REQUEST).json({
      status: false,
      message: 'Invalid Request',
      statusCode: HttpStatusCode.BAD_REQUEST,
    })
    logger.error({
      controller: 'rygStatusController',
      method: 'getListOfRYGEmployee',
      payload: `User with role ${userRole} attempted to access getListOfRYGEmployees.`,
      msg: `error ${error}`
    })
    return
  }

  whereCondition.isDeleted = 0

  if (StatusFilter) {
    whereRYGCondition.status = StatusFilter
  }
  if (EmployeeFilter) {
    whereCondition.userId = EmployeeFilter
  }
  try {
    const RYGtableAttributes = ['id', 'status', 'subStatus', 'remarks']
    const EmployeetableAttributes = ['userId', 'empId', 'userName', 'userRole', 'depId', 'userProcess']
    let employee = []

    employee = await Employee.findAll({
      include: [
        {
          model: GlobalType,
          as: 'processName',
          attributes: ['displayName'],
          required: false,
        },
        {
          model: RygStatus,

          attributes: RYGtableAttributes, // Specify which attributes to include
          where: Object.keys(whereRYGCondition).length > 0 ? whereRYGCondition : null,
          include: [{ model: db.globalType }],
        },
      ],
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      where: Object.keys(whereCondition).length > 0 ? whereCondition : null,
      attributes: EmployeetableAttributes,
      order: [['userId', 'DESC']],
    })

    logger.info({
      controller: 'rygStatusController',
      method: 'getListOfRYGEmployee',
      payload: `employees with filters: StatusFilter=${StatusFilter}, EmployeeFilter=${EmployeeFilter},`,
      msg: `Retrieved ${employee.length} `
    })

    employee.map(async (item) => {
      const status = item?.RYGstatus?.status
      if (status) {
        let globalType = await GlobalType.findOne({ where: { id: status } })

        if (globalType && globalType.displayName) {
          const displayName = globalType.displayName
          item.RYGstatus['dataValues']['statusDisplay'] = displayName
        }
      }
    })

    const totalEmpCount = await Employee.findAll({
      include: [
        {
          model: RygStatus,
          attributes: RYGtableAttributes,
          where: Object.keys(whereRYGCondition).length > 0 ? whereRYGCondition : null,
          include: [
            {
              model: GlobalType,
            },
          ],
        },
      ],
      where: whereCondition,
      attributes: EmployeetableAttributes,
    })

    if (employee) {
      if (limit == 0) {
        res.status(200).json({
          status: true,
          data: { employee: totalEmpCount, totalCount: totalEmpCount?.length },
          message: 'success',
        })
        logger.info({
          controller: 'rygStatusController',
          method: 'getListOfRYGEmployee',
          payload: `Total count: ${totalEmpCount?.length}`,
          msg: `Retrieved employees.`
        })
      } else {
        res.status(200).json({
          status: true,
          data: { employee: employee, totalCount: totalEmpCount?.length },
          message: 'success',
        })
        logger.info({
          controller: 'rygStatusController',
          method: 'getListOfRYGEmployee',
          payload: ` Count: ${employee.length}, Total count: ${totalEmpCount?.length}`,
          msg: `Retrieved employees.`
        })
      }
    }
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error,
    })
    logger.error(`Error in getListOfRYGEmployees: ${error.message}`);
  }
})

const updateRYGstatus = async (req, res) => {
  const { empId = null, status, subStatus, remarks = null } = req.body
  let rygResult
  logger.warn({
    controller: 'rygStatusController',
    method: 'updateRYGstatus',
    payload: req?.body,
    msg: 'Update RYG Status started',
  })

  try {
    if (!empId || !status || !subStatus) {
      throw new Error(MessageTag.ALL_REQ)
    }

    const isExists = await Employee.findOne({
      where: {
        [Op.and]: [{ isDeleted: 0 }, { userId: empId }],
      },
    })
    if (isEmpty(isExists)) {
      logger.error({
        controller: 'rygStatusController',
        method: 'updateRYGstatus',
        payload: req?.body,
        msg: 'Employee Not Found',
      })
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.USER_NOT_EXIST,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }
    const isRYGExists = await RygStatus.findOne({
      where: {
        [Op.and]: [{ empId: empId }],
      },
    })
    if (isEmpty(isRYGExists)) {
      rygResult = await RygStatus.create({
        empId,
        status,
        subStatus,
        remarks,
        createdBy: getRequestUserId(req),
        createdAt: new Date(),
        updatedBy: getRequestUserId(req),
        updatedAt: new Date(),
      })
    } else {
      rygResult = await RygStatus.update(
        {
          status,
          subStatus,
          remarks,
          updatedBy: getRequestUserId(req),
          updatedAt: new Date(),
        },
        {
          where: {
            empId,
          },
        },
      )
    }
    if (!isEmpty(rygResult)) {
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: MessageTag.RYG_UPDATED,
        statusCode: HttpStatusCode.OK,
      })

      logger.info({
        controller: 'rygStatusController',
        method: 'updateRYGstatus',
        data: isExists,
        msg: `RYG Status Updated for: ${empId}`,
      })
    }
  } catch (error) {
    logger.error({
      controller: 'rygStatusController',
      method: 'updateRYGstatus',
      payload: req?.body,
      msg: `Catch error: ${error?.message}`,
    })
    if (error?.httpCode) {
      res.status(error?.httpCode).json({
        status: error?.isOperational,
        message: error?.message,
        statusCode: error?.httpCode,
      })
    }
    res.status(HttpStatusCode.INTERNAL_SERVER).json({
      status: false,
      message: error?.message,
      statusCode: HttpStatusCode.INTERNAL_SERVER,
    })
  }
}

module.exports = {
  getListOfRYGEmployees,
  updateRYGstatus,
}
