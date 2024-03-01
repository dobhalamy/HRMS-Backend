const db = require('../models/index')
const { Op } = require('sequelize')
const { logger } = require('../../helper/logger')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { getRequestUserId, getRequestEmpId } = require('../../helper')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const { isEmpty } = require('lodash')
const { ExceptionRequest, UserRole, MessageTag } = require('../../enums/messageNums')
const { exceptionDatelist, calculateTotalTimeException, utcToIst } = require('../../helper/index')

const Exception = db.exception

const GlobalType = db.globalType
const Employee = db.employee
const Attendance = db.attendanceRecord

const getAllException = async (req, res) => {
  const { status = 0, skip = 0, limit = 10 } = req.query
  const userId = getRequestUserId(req)

  try {
    if (!userId) {
      throw new BadRequest()
    }
    const allExp = await Exception.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),

      include: [
        {
          model: GlobalType,
          as: 'raisedRequest',
          attributes: ['displayName'],
          required: true,
        },
        {
          model: Employee,
          as: 'employeeName',
          attributes: ['userName'],
          required: true,
        },
      ],
      where: { exceptionStatus: status },
    })
    const allExpTotalCount = await Exception.findAll({})
    if (allExp) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          expList: allExp,
          totalCount: allExpTotalCount?.length,
        },
      })

      logger.info({
        controller: 'exception',
        method: 'getAllException',
        userId: `userId${userId}`,
        msg: 'allException data ',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'exception',
      method: 'getAllException',
      userId: `userId${userId}`,
      msg: `Catch error: ${error?.message}`,
    })
    if (error) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}
const getExceptionSingleEmp = async (req, res) => {
  const { status = 0, skip = 0, limit = 10 } = req.query
  const userId = getRequestUserId(req)

  try {
    if (!userId) {
      throw new BadRequest()
    }
    const allExp = await Exception.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      where: { userId: userId, exceptionStatus: status },

      include: [
        {
          model: GlobalType,
          as: 'raisedRequest',
          attributes: ['displayName'],
          required: true,
        },
        {
          model: Employee,
          as: 'employeeName',
          attributes: ['userName'],
          required: true,
        },
      ],
    })
    const allExpTotalCount = await Exception.findAll({
      where: { userId: userId },
    })
    if (allExp) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          expList: allExp,
          totalCount: allExpTotalCount?.length,
        },
      })

      logger.info({
        controller: 'exception',
        method: 'getAllException',
        userId: `userId${userId}`,
        msg: 'allException data ',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'exception',
      method: 'getAllException',
      userId: `userId${userId}`,
      msg: `Catch error: ${error?.message}`,
    })
    if (error) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}

const addException = async (req, res) => {
  const {
    raiseRequest,
    dateFrom,
    dateTo,
    currentAttendance,
    updateAttendance,
    accessIn,
    accessOut,
    comment,
    shiftIn,
    shiftOut,
  } = req.body

  const userId = getRequestUserId(req)
  const date = new Date()

  try {
    if (!raiseRequest || !userId || !comment) {
      throw new BadRequest()
    }
    const isExceptionExist = await Exception.findOne({
      where: {
        userId: userId,
        requestType: raiseRequest,
        [Op.or]: [
          {
            dateFrom: date,
          },
          {
            dateTo: date,
          },
          {
            [Op.and]: [
              {
                dateFrom: {
                  [Op.lte]: date,
                },
              },
              {
                dateTo: {
                  [Op.gte]: date,
                },
              },
            ],
          },
        ],
      },
    })
    if (!isEmpty(isExceptionExist)) {
      logger.error({
        controller: 'downTimeController',
        method: 'saveDownTimeTicket',
        payload: getRequestEmpId(req),
        msg: 'Down Time already marked',
      })
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.EXCEPTION_EXIST,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }

    const isCreated = await Exception.create({
      requestType: raiseRequest,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      currentAttendance,
      updateAttendance,
      accessIn,
      accessOut,
      shiftOut,
      shiftIn,
      comment,
      userId,
      createdBy: userId,
      createdAt: new Date(),
    })
    if (!isEmpty(isCreated)) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: isCreated,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'exceptionController',
        method: 'addException',
        payload: isCreated,
        msg: 'exception added',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'exceptionController',
      method: 'addException',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.msg}`,
    })
    if (error) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
    }
  }
}
const deleteException = async (req, res) => {
  const { id } = req.params
  const userId = getRequestUserId(req)
  try {
    if (!id) {
      throw new BadRequest()
    }
    const deletedRows = await Exception.destroy({
      where: { id },
    })

    if (deletedRows > 0) {
      // Send success response
      res.json({
        status: true,
        message: 'Exception deleted successfully',
      })
    } else {
      throw new Error('Exception Not Found')
    }
  } catch (error) {
    logger.error({
      controller: 'exceptionController',
      method: 'deleteException',
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
const updateException = async (req, res) => {
  const { id } = req.body
  const {
    raiseRequest,
    dateFrom,
    dateTo,
    currentAttendance,
    updateAttendance,
    accessIn,
    accessOut,
    shiftOut,
    shiftIn,
    comment,
    exceptionStatus,
    exceptionRemark,
  } = req.body

  const userId = getRequestUserId(req)
  try {
    if (!userId && !id && !raiseRequest && !dateFrom && !dateTo) {
      throw new BadRequest()
    }
    const isExists = await Exception.findAll({
      where: {
        id,
      },
    })
    const preRequestType = isExists[0]?.dataValues?.requestType

    if (isEmpty(isExists)) {
      throw new NotFound(null, null, null, 'Exception not found')
    }
    const isUpdated = await Exception.update(
      {
        id,
        requestType: raiseRequest !== null ? raiseRequest : preRequestType,
        dateFrom,
        dateTo,
        currentAttendance: currentAttendance === undefined ? null : currentAttendance,
        updateAttendance: updateAttendance === undefined ? null : updateAttendance,
        accessIn: accessIn === undefined ? null : accessIn,
        accessOut: accessOut === undefined ? null : accessOut,
        shiftOut: shiftOut === undefined ? null : shiftOut,
        shiftIn: shiftIn === undefined ? null : shiftIn,
        comment,
        exceptionStatus: exceptionStatus === undefined ? 0 : exceptionStatus,
        exceptionRemark: exceptionRemark === undefined ? null : exceptionRemark,
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
    let updateExceptionData = []
    updateExceptionData = await Exception.findOne({
      where: {
        id,
      },
    })
    if (exceptionStatus === 1) {
      const isExceptionExist = await Exception.findOne({
        where: {
          id,
          requestType: ExceptionRequest.BIOMETRIC_ISSUE,
          exceptionStatus: 1,
        },
      })
      if (!isEmpty(isExceptionExist)) {
        const user = await Employee.findOne({
          where: {
            userId: isExceptionExist.userId,
          },
        })
        if (user.userRole !== UserRole.TRAINEE) {
          const totalTime = calculateTotalTimeException(
            isExceptionExist.accessIn,
            isExceptionExist.accessOut,
          )

          if (isExceptionExist.dateFrom !== isExceptionExist.dateTo) {
            const exceptionDateList = exceptionDatelist(
              isExceptionExist.dateFrom,
              isExceptionExist.dateTo,
            )
            for (let i = 0; i < exceptionDateList.length; i += 1) {
              const isAttendanceExist = await Attendance.findOne({
                where: {
                  userId: isExceptionExist.userId,
                  isPresent: 1,
                  date: exceptionDateList[i],
                },
              })
              if (isEmpty(isAttendanceExist)) {
                await Attendance.create({
                  userId: user.userId,
                  empId: user.empId,
                  timeIn: utcToIst(isExceptionExist.accessIn),
                  timeOut: utcToIst(isExceptionExist.accessOut),
                  totalTime: totalTime,
                  date: exceptionDateList[i],
                  isPresent: 1,
                  createdAt: new Date(),
                })
              } else {
                await Attendance.update(
                  {
                    timeIn: utcToIst(isExceptionExist.accessIn),
                    timeOut: utcToIst(isExceptionExist.accessOut),
                    totalTime: totalTime,
                    updatedAt: new Date(),
                  },
                  {
                    where: {
                      userId: user.userId,
                      date: exceptionDateList[i],
                    },
                    returning: true,
                  },
                )
              }
            }
          } else {
            const isAttendanceExist = await Attendance.findOne({
              where: {
                userId: isExceptionExist.userId,
                isPresent: 1,
                date: isExceptionExist.dateFrom,
              },
            })

            if (isEmpty(isAttendanceExist)) {
              await Attendance.create({
                userId: user.userId,
                empId: user.empId,
                timeIn: utcToIst(isExceptionExist.accessIn),
                timeOut: utcToIst(isExceptionExist.accessOut),
                totalTime: totalTime,
                date: dateFrom,
                isPresent: 1,
                createdAt: new Date(),
              })
            } else {
              await Attendance.update(
                {
                  timeIn: utcToIst(isExceptionExist.accessIn),
                  timeOut: utcToIst(isExceptionExist.accessOut),
                  totalTime: totalTime,
                  updatedAt: new Date(),
                },
                {
                  where: {
                    userId: user.userId,
                    date: dateFrom,
                  },
                  returning: true,
                },
              )
            }
          }
        }
      }
    }

    if (!isEmpty(isUpdated)) {
      res.status(200).json({
        status: true,
        message: 'success',
        data: updateExceptionData,
      })
      logger.info({
        controller: 'exceptionController',
        method: 'updateException',
        msg: 'Exception updated successfully',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'exceptionController',
      method: 'updateException',
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
  getAllException,
  getExceptionSingleEmp,
  deleteException,
  addException,
  updateException,
}
