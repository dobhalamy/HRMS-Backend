/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const { Op } = require('sequelize')
const moment = require('moment')
const { isEmpty } = require('lodash')
const db = require('../models/index')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest } = require('../../helper/apiErrors')
const MessageTag = require('../../enums/messageNums')
const { logger } = require('../../helper/logger')
const monthNames = require('../../enums/monthName')
const XLSX = require('xlsx')
const {
  getRequestUserId,
  formatDateWithoutMoment,
  // checkingToatalWorkingHour,
  calculateTotalTimeStaff,
  // isDayAndTimeWithinWorkingHours,
  calculateTotalTime,
  utcToIst,
  getWeekend,
  // getMonth,
} = require('../../helper')
const Attendance = db.attendanceRecord
const Apr = db.aprRecord
const Employee = db.employee
const DownTimeAttendance = db.downTimeAttendance
// const Roster = db.roster
const Exception = db.exception
const HolidayCalender = db.holidayCalender

const markAttendance = async (req, res) => {
  // const currentDate = new Date()
  // const year = currentDate.getFullYear()

  try {
    if (!req.file) {
      throw new BadRequest()
    }
    const file = req.file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' })
    const worksheetName = workbook.SheetNames[0] // Assuming you want to read the first sheet
    const worksheet = workbook.Sheets[worksheetName]
    // Read data from the worksheet
    const columnData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'DD/MM/YYYY',
    })

    for (let i = 0; i < columnData?.length; i++) {
      //extracting row from the column data
      const row = columnData[i]

      // get primary key from users table
      const user = await Employee.findOne({
        where: {
          empId: row?.EMPID,
        },
      })

      // roster check

      const date = formatDateWithoutMoment(row?.Date)
      // const momnetDate = moment(date).toDate()
      // const dayName = momnetDate.toLocaleDateString(undefined, { weekday: 'long' })
      // const month = getMonth(row?.Date)

      // const isRosterExist = await Roster.findOne({
      //   where: {
      //     empId: row?.EMPID,
      //     month,
      //     year,
      //   },
      //   order: [['createdAt', 'DESC']],
      // })

      // const shiftTimings = JSON.parse(isRosterExist.shiftTimings)

      // const isWithinWorkingHours = isDayAndTimeWithinWorkingHours(
      //   shiftTimings,
      //   dayName,
      //   row?.TimeIn,
      //   row?.TimeOut,
      // )
      // if (isWithinWorkingHours) {
      const isAttendanceExist = await Attendance.findOne({
        where: {
          userId: user.userId,
          date,
        },
      })
      if (user.userRole !== MessageTag.UserRole.TRAINEE) {
        const totalTime = calculateTotalTimeStaff(row?.TimeIn, row?.TimeOut)
        if (isEmpty(isAttendanceExist)) {
          await Attendance.create({
            userId: user.userId,
            empId: user?.empId,
            timeIn: row?.TimeIn,
            timeOut: row?.TimeOut,
            totalTime,
            isPresent: 1,
            date,
            createdBy: getRequestUserId(req),
          })
        } else {
          await Attendance.update(
            {
              totalTime,
              timeIn: row?.TimeIn,
              timeOut: row?.TimeOut,
              updatedAt: new Date(),
              updatedBy: getRequestUserId(req),
            },
            {
              where: {
                userId: user.userId,
                date,
              },
              returning: true,
            },
          )
        }
      } else {
        if (isEmpty(isAttendanceExist)) {
          await Attendance.create({
            userId: user.userId,
            empId: user?.empId,
            timeIn: row?.TimeIn,
            timeOut: row?.TimeOut,
            isPresent: 1,
            date,
            createdBy: getRequestUserId(req),
          })
        } else {
          await Attendance.update(
            {
              timeIn: row?.TimeIn,
              timeOut: row?.TimeOut,
              updatedAt: new Date(),
              updatedBy: getRequestUserId(req),
            },
            {
              where: {
                userId: user.userId,
                date,
              },
              returning: true,
            },
          )
        }
      }
      // }
    }
    res.status(HttpStatusCode?.OK).json({
      status: true,
      message: 'success',
      data: [],
      statusCode: HttpStatusCode?.OK,
    })
  } catch (error) {
    logger.error({
      controller: 'attendanceRecord',
      method: 'uploadAttendance',
      empId: `employeeId: ${getRequestUserId(req)}`,
      msg: `catch error: ${error}`,
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
const uploadApr = async (req, res) => {
  try {
    if (!req.file) {
      throw new BadRequest()
    }
    const file = req.file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' })
    const worksheetName = workbook.SheetNames[0] // Assuming you want to read the first sheet
    const worksheet = workbook.Sheets[worksheetName]
    // Read data from the worksheet
    const columnData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'DD/MM/YYYY',
    })

    for (let i = 0; i < columnData?.length; i++) {
      //extracting row from the column data
      const row = columnData[i]

      // get primary key from users table
      const user = await Employee.findOne({
        where: {
          empId: row?.EMPID,
        },
      })
      const isAprFound = await Apr.findOne({
        where: {
          empId: user?.empId,
          date: row?.Date,
        },
      })
      if (isEmpty(isAprFound)) {
        const isAprMarked = await Apr.create({
          empId: user?.empId,
          totalTime: row?.TotalLogin,
          date: row?.Date,
          createdBy: getRequestUserId(req),
        })
        if (!isEmpty(isAprMarked)) {
          logger.info({
            controller: 'attendanceRecord',
            method: 'uploadAttendance',
            empId: `employeeId: ${getRequestUserId(req)}`,
            msg: `attendance created for : ${user?.userId} with date ${row?.Date}`,
          })
        }
      } else {
        // mark time out if attendee already exists
        const currentTime = moment.utc().format('YYYY-MM-DD HH:mm:ss')

        isAprFound.updatedBy = getRequestUserId(req)
        isAprFound.updatedAt = currentTime
        isAprFound.totalTime = row?.TotalLogin
        await isAprFound.save()
        logger.info({
          controller: 'attendanceRecord',
          method: 'uploadAttendance',
          empId: `employeeId: ${getRequestUserId(req)}`,
          msg: `employee attendance updated for : ${row?.EMPID} with date ${row?.Date}`,
        })
      }
      // if (user.userRole === MessageTag.UserRole.TRAINEE) {
      const userApr = await Apr.findOne({
        where: {
          empId: user.empId,
          date: row?.Date,
        },
      })

      const date = formatDateWithoutMoment(userApr.date)
      const momentDate = moment(date, 'YYYY/MM/DD')

      const userDownTimes = await DownTimeAttendance.findAll({
        where: {
          userId: user.userId,
          date,
          status: 1,
        },
      })

      let attendanceTotalTime
      if (!isEmpty(userDownTimes)) {
        attendanceTotalTime = calculateTotalTime(userDownTimes, userApr.totalTime)
      } else {
        attendanceTotalTime = userApr.totalTime
      }

      // const status = checkingToatalWorkingHour(attendanceTotalTime)
      const isExceptionExist = await Exception.findOne({
        where: {
          requestType: MessageTag.ExceptionRequest.BIOMETRIC_ISSUE,
          userId: user.userId,
          exceptionStatus: 1,
          [Op.or]: [
            {
              dateFrom: momentDate,
            },
            {
              dateTo: momentDate,
            },
            {
              [Op.and]: [
                {
                  dateFrom: {
                    [Op.lte]: momentDate,
                  },
                },
                {
                  dateTo: {
                    [Op.gte]: momentDate,
                  },
                },
              ],
            },
          ],
        },
      })
      if (!isEmpty(isExceptionExist)) {
        const isAttendanceExist = await Attendance.findOne({
          where: {
            userId: user.userId,
            date,
          },
        })
        if (isEmpty(isAttendanceExist)) {
          await Attendance.create({
            userId: user.userId,
            empId: user.empId,
            timeIn: utcToIst(isExceptionExist.accessIn),
            timeOut: utcToIst(isExceptionExist.accessOut),
            totalTime: attendanceTotalTime,
            date,
            isPresent: 1,
            createdAt: new Date(),
          })
        } else {
          await Attendance.update(
            {
              timeIn: utcToIst(isExceptionExist.accessIn),
              timeOut: utcToIst(isExceptionExist.accessOut),
              totalTime: attendanceTotalTime,
              isPresent: 1,
              updatedAt: new Date(),
              updatedBy: getRequestUserId(req),
            },
            {
              where: {
                userId: user.userId,
                date,
              },
              returning: true,
            },
          )
        }
      } else {
        await Attendance.update(
          {
            isPresent: 1,
            totalTime: attendanceTotalTime,
            updatedAt: new Date(),
            updatedBy: getRequestUserId(req),
          },
          {
            where: {
              empId: user.empId,
              date,
            },
            returning: true,
          },
        )
      }
      // }
    }
    res.status(HttpStatusCode?.OK).json({
      status: true,
      message: 'success',
      data: [],
      statusCode: HttpStatusCode?.OK,
    })
  } catch (error) {
    logger.error({
      controller: 'attendanceRecord',
      method: 'uploadApr',
      empId: `employeeId: ${getRequestUserId(req)}`,
      msg: `catch error: ${error}`,
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

const getAttendanceRecord = async (req, res) => {
  const { year } = req.query
  const userId = getRequestUserId(req)
  try {
    if (!year || !userId) {
      throw new BadRequest()
    }
    const holidays = await HolidayCalender.findAll({
      attributes: ['date'],
    })
    const findAttendanceRecord = await Attendance.findAll({
      where: {
        userId,
        isPresent: 1,
        createdAt: {
          [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
        },
      },
    })
    if (isEmpty(findAttendanceRecord)) {
      res.status(HttpStatusCode?.OK).json({
        status: true,
        message: 'success',
        data: [],
        statusCode: HttpStatusCode?.OK,
      })
      return
    }
    const employeeName = {
      data: [],
    }
    for (let i = 0; i < 12; i++) {
      const newAttendance = findAttendanceRecord.filter(
        (data) => new Date(data.date).getMonth() === i,
      )
      const month = monthNames[i]
      const daysInMonth = new Date(year, i + 1, 0).getDate()
      const weekendsDaysInMonth = getWeekend(daysInMonth, i, year, holidays)
      const weekdaysInMonth = daysInMonth - weekendsDaysInMonth.length
      const employeePresentDays = newAttendance.length
      if (weekdaysInMonth || employeePresentDays) {
        employeeName.data.push({
          monthName: month,
          presentDays: employeePresentDays,
          workingDays: weekdaysInMonth,
        })
      }
    }
    logger.info({
      controller: 'attendanceRecord',
      method: 'get employee attendanceRecord',

      empId: `userIdId: ${userId}`,
      msg: 'employees attendance record',
    })
    res.status(HttpStatusCode?.OK).json({
      status: true,
      message: 'success',
      data: employeeName,
      statusCode: HttpStatusCode?.OK,
    })
  } catch (error) {
    logger.error({
      controller: 'attendanceRecord',
      method: 'get employee attendanceRecord',
      empId: `userId: ${userId}`,
      msg: `catch error: ${error?.msg}`,
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
const allEmployeeAttendance = async (req, res) => {
  const { year, skip = 0, limit = 0 } = req.query
  const userId = getRequestUserId(req)
  try {
    if (!year || !userId) {
      throw new BadRequest()
    }
    const holidays = await HolidayCalender.findAll({
      attributes: ['date'],
    })
    const fetchedRecords = await Attendance.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['userName'],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
        },
      },
      attributes: ['userId'],
      group: ['userId'],
    })

    for (let i = 0; i < fetchedRecords.length; i++) {
      const record = fetchedRecords[i]
      record.dataValues.dates = await Attendance.findAll({
        where: {
          isPresent: 1,
          userId: record.dataValues.userId,
        },
        attributes: ['date'],
      })
      record.dataValues.monthData = []

      for (let j = 0; j < 12; j++) {
        const month = monthNames[j]
        const daysInMonth = new Date(year, j + 1, 0).getDate()
        const weekendsDaysInMonth = getWeekend(daysInMonth, j, year, holidays)
        const weekdaysInMonth = daysInMonth - weekendsDaysInMonth.length

        const presentDays = record.dataValues.dates.filter(
          (data) => new Date(data.date).getMonth() === j,
        ).length

        if (weekdaysInMonth > 0 || presentDays > 0) {
          record.dataValues.monthData.push({
            month,
            presentDays,
            workingDays: weekdaysInMonth,
          })
        }
      }
    }
    const newFetchedRecord = fetchedRecords.map((record) => {
      return {
        userId: record.userId,
        name: record.employee.userName,
        data: record.dataValues.monthData,
      }
    })
    const totalCount = await Attendance.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
        },
      },
      attributes: ['userId'],
      group: ['userId'],
    })

    if (isEmpty(fetchedRecords)) {
      logger.error(
        {
          controller: 'attendanceRecord',
          method: 'get all employee attendanceRecord',
        },
        {
          empId: `userId :${userId} `,
          msg: "employee Attendance Doesn't exist",
        },
      )
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          attendanceList: [],
          totalCount: totalCount?.length,
        },
      })
      return
    }
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: {
        attendanceList: newFetchedRecord,
        totalCount: totalCount?.length,
      },
    })
    logger.info(
      {
        controller: 'attendanceRecord',
        method: 'get all employee attendanceRecord',
      },
      {
        empId: `userId: ${userId}`,
        msg: 'get all employee attendance record',
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'attendanceRecord',
        method: 'get all employee attendanceRecord',
      },
      {
        empId: `userId${userId}`,
        msg: `catch error${error?.msg}`,
      },
    )
    res.status(HttpStatusCode.BAD_REQUEST).json({
      status: false,
      message: 'error',
      error: error?.message,
    })
  }
}
const getMonthlyAttendance = async (req, res) => {
  const { year, month, userId } = req.query
  const monthNumber = monthNames.indexOf(month)
  try {
    if (!year || !userId) {
      throw new BadRequest()
    }
    const fetchedRecords = await Attendance.findAll({
      where: {
        empId: userId,
        createdAt: {
          [Op.between]: [new Date(year, monthNumber, 1), new Date(year, monthNumber, 31)],
        },
      },
    })
    logger.error(
      {
        controller: 'attendanceRecord',
        method: 'get all employee attendanceRecord',
      },
      {
        empId: `employeeId :${userId} `,
        msg: "employee Attendance Doesn't exist",
      },
    )
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: fetchedRecords,
    })
  } catch (error) {
    logger.error(
      {
        controller: 'attendanceRecord',
        method: 'get all employee attendanceRecord',
      },
      {
        empId: `employeeId${userId}`,
        msg: `catch error${error?.msg}`,
      },
    )
    res.status(HttpStatusCode.BAD_REQUEST).json({
      status: false,
      message: 'error',
      error: error?.message,
    })
  }
}

module.exports = {
  markAttendance,
  getAttendanceRecord,
  allEmployeeAttendance,
  uploadApr,
  getMonthlyAttendance,
}
