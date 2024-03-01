const { isEmpty } = require('lodash')
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const { MessageTag, StatusEnums, UserRole } = require('../../enums/messageNums')
const { getRequestUserId, getRequestEmpId, formatKeys, empAttribute } = require('../../helper')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { sendMailToEmp, sendMailToHr } = require('./mailController')
const { Op } = require('sequelize')

const DownTimeAttendance = db.downTimeAttendance
const Employee = db.employee
const MailTemplate = db.mailTemplate

const saveDownTimeTicket = async (req, res) => {
  const { departmentId, startTime, endTime, subject, description = null, date } = req.body
  const userId = getRequestUserId(req)
  const empId = getRequestEmpId(req)
  logger.warn({
    controller: 'downTimeController',
    method: 'saveDownTimeTicket',
    payload: getRequestEmpId(req),
    msg: 'Save DownTime started',
  })

  try {
    if (!startTime || !endTime || !departmentId) {
      throw new Error(MessageTag.ALL_REQ)
    }

    const isConcernUserExists = await Employee.findOne({
      where: {
        userRole: UserRole.SUPER_ADMIN,
      },
      attributes: ['userId'],
    })

    if (isEmpty(isConcernUserExists)) {
      logger.error({
        controller: 'downTimeController',
        method: 'saveDownTimeTicket',
        payload: getRequestEmpId(req),
        msg: 'Concern Person is not assigned to department',
      })
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.CONCERN_NOT_EXIST,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }

    const result = await DownTimeAttendance.create({
      userId,
      departmentId,
      departmentHead: isConcernUserExists?.userId,
      subject,
      description,
      date,
      startTime,
      endTime,
      createdBy: getRequestUserId(req),
      createdAt: new Date(),
    })
    const data = formatKeys(result?.dataValues)
    if (!isEmpty(result)) {
      const mailTemplate = 'down_time_apply'
      const templateData = await MailTemplate.findOne({
        where: { uniqueValue: mailTemplate },
      })
      let templateResponse = templateData?.content
      if (templateResponse) {
        const hrDetails = await Employee.findOne({
          where: {
            userRole: UserRole.HR,
          },
        })
        const emp = await Employee.findOne({
          where: {
            userId: userId,
          },
        })
        templateResponse = templateResponse.replace('{{name}}', emp.userName)
        templateResponse = templateResponse.replace('{{startTime}}', result.startTime)
        templateResponse = templateResponse.replace('{{endTime}}', result.endTime)
        templateResponse = templateResponse.replace('{{empId}}', empId)
        templateResponse = templateResponse.replace('{{subject}}', result.subject)

        const subject = 'Leave Applied'
        sendMailToHr(hrDetails.userEmail, subject, templateResponse)
      }
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: MessageTag.DOWN_TIME_MARKED,
        data,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'downTimeController',
        method: 'saveDownTimeTicket',
        data: result,
        msg: `Down Time Marked for: ${empId}`,
      })
    }
  } catch (error) {
    logger.error({
      controller: 'downTimeController',
      method: 'saveDownTimeTicket',
      payload: getRequestEmpId(req),
      msg: `Catch error: ${error?.message}`,
    })
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      status: error?.isOperational || false,
      message: error?.message,
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    })
  }
}

const getDownTimeList = async (req, res) => {
  const { status = 0, skip, limit, employeeFilter } = req?.query || null
  logger.warn({
    controller: 'downTimeController',
    method: 'getDownTimeList',
    msg: 'Get Down Time List started',
  })
  const userId = getRequestUserId(req)
  const superAdminData = await Employee.findOne({
    where: {
      userRole: UserRole.SUPER_ADMIN,
    },
    attributes: ['userId'],
  })
  const loggendInUser = await Employee.findOne({
    where: {
      userId,
    },
    attributes: ['userRole'],
  })

  const isConcernUser = await Employee.findOne({
    where: {
      userId,
    },
    attributes: ['userRole', 'userId'],
  })
  let query = `SELECT down_time_attendance.id, down_time_attendance.userId, down_time_attendance.departmentHead,
    down_time_attendance.startTime, down_time_attendance.endTime, down_time_attendance.status, 
    down_time_attendance.departmentId, down_time_attendance.description, down_time_attendance.subject,
    down_time_attendance.remark,down_time_attendance.date , vp_users.userName, vp_users.isConcernPerson, globaltypes.displayName as departmentName
    FROM down_time_attendance 
    JOIN vp_users ON down_time_attendance.userId = vp_users.userId
    JOIN globaltypes ON down_time_attendance.departmentId = globaltypes.id
    WHERE `

  try {
    query += `down_time_attendance.status=${status}`
    if (employeeFilter) {
      query += ` && down_time_attendance.userId='${employeeFilter}'`
    }
    if (userId && isConcernUser.userRole === UserRole.SUPER_ADMIN) {
      query += ` && down_time_attendance.departmentHead='${isConcernUser.userId}'`
    } else if (userId && loggendInUser.userRole === UserRole.HR) {
      query += ` && down_time_attendance.departmentHead='${superAdminData.userId}'`
    } else if (userId) {
      query += ` && down_time_attendance.userId='${userId}'`
    }
    const [result] = await db.sequelize.query(
      query + ` ORDER BY down_time_attendance.id DESC LIMIT ${skip}, ${limit}`,
    )
    const countQuery = `SELECT COUNT(*) AS count FROM (${query}) as subquery`
    const [totalCount] = await db.sequelize.query(countQuery)
    res.status(HttpStatusCode.OK).send({
      status: true,
      data: { downTime: result, totalCount: totalCount[0]?.count },
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'downTimeController',
      method: 'getDownTimeList',
      msg: 'Down Time List: ',
    })
  } catch (error) {
    logger.error({
      controller: 'downTimeController',
      method: 'getDownTimeList',
      msg: `Catch error: ${error?.message}`,
    })
    res.status(HttpStatusCode.BAD_REQUEST).json({
      status: false,
      message: error?.message,
      statusCode: HttpStatusCode.BAD_REQUEST,
    })
  }
}

const updateDownTimeStatus = async (req, res) => {
  const { id } = req.params
  const downTimeParam = req?.body
  const userId = getRequestUserId(req)
  const isHr = await Employee.findOne({
    where: {
      userId,
      userRole: UserRole.HR,
    },
  })

  if (!isEmpty(downTimeParam)) {
    const status = downTimeParam?.status
    const remark = downTimeParam?.remark
    logger.warn({
      controller: 'downTimeController',
      method: 'updateDownTimeStatus',
      msg: 'Update down time status started',
    })

    try {
      let superAdminUserId = null
      if (isHr) {
        const superAdminData = await Employee.findOne({
          where: {
            userRole: UserRole.SUPER_ADMIN,
          },
        })
        superAdminUserId = superAdminData.userId
      } else {
        superAdminUserId = userId
      }
      const isDownTimeExists = await DownTimeAttendance.findOne({
        where: {
          [Op.and]: [
            { id: id },
            { status: StatusEnums?.PENDING },
            { departmentHead: superAdminUserId },
          ],
        },
      })

      if (isEmpty(isDownTimeExists)) {
        logger.error({
          controller: 'downTimeController',
          method: 'updateDownTimeStatus',
          payload: downTimeParam,
          msg: 'Down Time Attendance not exists',
        })
        res.status(HttpStatusCode.BAD_REQUEST).json({
          status: false,
          message: MessageTag.DOWN_TIME_NOT_EXIST,
          statusCode: HttpStatusCode.BAD_REQUEST,
        })
        return
      }

      const updateResult = await DownTimeAttendance.update(
        {
          status,
          remark,
          updatedBy: getRequestUserId(req),
          updatedAt: new Date(),
        },
        {
          where: {
            id: id,
          },
        },
      )
      if (updateResult) {
        const empDataResponse = await Employee.findOne({
          where: { userId: isDownTimeExists?.userId },
          attributes: empAttribute,
        })

        const mailTemplate = 'down_time_approve_reject'
        const templateData = await MailTemplate.findOne({
          where: { uniqueValue: mailTemplate },
        })
        let templateResponse = templateData?.content
        if (templateResponse) {
          templateResponse = templateResponse.replace('{{name}}', empDataResponse.userName)
          templateResponse = templateResponse.replace(
            '{{status}}',
            status === StatusEnums.APPROVED ? 'Approved' : 'Rejected',
          )
          templateResponse = templateResponse.replace('{{empId}}', empDataResponse?.empId)

          templateResponse = templateResponse.replace('{{startDate}}', isDownTimeExists?.startTime)
          templateResponse = templateResponse.replace('{{endDate}}', isDownTimeExists?.endTime)

          const subject =
            status === StatusEnums.APPROVED ? 'Down Time Approved.' : 'Down Time Rejected'
          sendMailToEmp(empDataResponse?.userEmail, subject, templateResponse)
        }
      }
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: status === StatusEnums.APPROVED ? 'Down Time Approved.' : 'Down Time Rejected',
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'downTimeController',
        method: 'updateDownTimeStatus',
        data: isDownTimeExists,
        msg: `Down Time updated,Id: ${id}`,
      })
    } catch (error) {
      logger.error({
        controller: 'downTimeController',
        method: 'updateDownTimeStatus',
        payload: null,
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

const deleteDownTimeRequest = async (req, res) => {
  const { id } = req.params
  logger.warn({
    controller: 'downTimeController',
    method: 'deleteDownTimeRequest',
    payload: id,
    msg: 'Delete down time started',
  })

  try {
    const isDownTimeExists = await DownTimeAttendance.findOne({
      where: {
        [Op.and]: [{ id: id }, { status: StatusEnums?.PENDING }],
      },
    })
    if (isEmpty(isDownTimeExists)) {
      logger.error({
        controller: 'downTimeController',
        method: 'deleteDownTimeRequest',
        payload: id,
        msg: 'Down Time not exists',
      })
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.DOWN_TIME_NOT_EXIST,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }

    await DownTimeAttendance.destroy({
      where: {
        [Op.and]: [{ id: id }, { status: StatusEnums?.PENDING }],
      },
    })
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: MessageTag.DOWN_TIME_DELETED,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'downTimeController',
      method: 'deleteDownTimeRequest',
      msg: `Down time request deleted,Id: ${id}`,
    })
  } catch (error) {
    logger.error({
      controller: 'downTimeController',
      method: 'deleteDownTimeRequest',
      payload: id,
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
module.exports = {
  saveDownTimeTicket,
  getDownTimeList,
  updateDownTimeStatus,
  deleteDownTimeRequest,
}
