const { isEmpty } = require('lodash')
const sequelize = require('sequelize')
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const { MessageTag, StatusEnums } = require('../../enums/messageNums')
const { UserRoleEnums} = require('../../enums/userRoleEnums')
const { leaveTypeEnums } = require('../../enums/leaveTypeEnums') 
const {
  getRequestUserRole,
  getRequestUserId,
  getRequestEmpId,
  dateOptions,
} = require('../../helper')
const ObjectHelper = require('../../helper')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const { mailToPoAndHr, sendMailToEmpAndPos, sendMailToEmpAndHr } = require('./mailController')
const { Op } = require('sequelize')
const moment = require('moment')
const { leaveDurationEnums } = require('../../enums/leaveDurationEnums')

const EmployeeLeave = db.employeeLeave
const Employee = db.employee
const MailTemplate = db.mailTemplate
const EmployeeLeaveDays = db.employeeLeaveDays

const markLeave = async (req, res) => {
  const {
    // leaveDate,
    userId = null,
    empId = null,
    leaveType,
    leaveReason = null,
    contactNum,
    addressDuringLeave,
    leaveDuration,
    poId,
    dateTime1,
    dateTime2,
  } = req.body
  const userRole = getRequestUserRole(req)
  const reUserId = getRequestUserId(req)
  const startDate = new Date(dateTime1)
  const endDate = new Date(dateTime2)
  const leaveDays = ObjectHelper.getDates(startDate, endDate)
  let leaveStatus
  logger.warn({
    controller: 'leaveController',
    method: 'markLeave',
    payload: req?.body,
    msg: 'Mark Leave started',
  })

  try {
    // if (!startDate || !endDate || !leaveType || !empId) {
    if (!startDate || !endDate || !leaveType || !userId) {
      throw new Error(MessageTag.ALL_REQ)
    }
    // const currentDateTime = new Date()
    // const currentDate = currentDateTime.toISOString().slice(0, 10)
    // startDate.setDate(startDate.getDate() + 1)
    // const startDateOnly = startDate.toISOString().slice(0, 10)
    const maximumTime = new Date()
    maximumTime.setHours(8, 30, 0, 0)
    // if (
    //   currentDate === startDateOnly &&
    //   currentDateTime > maximumTime &&
    //   req.user?.userRole !== 'hr' &&
    //   leaveType === leaveTypeEnums?.WORK_FROM_HOME
    // ) {
    //   res.status(HttpStatusCode.OK).json({
    //     status: true,
    //     message: MessageTag.APPLY_TIME_OVER,
    //     statusCode: HttpStatusCode.OK,
    //   })

    //   logger.info({
    //     controller: 'leaveController',
    //     method: 'markLeave',
    //     data: req.body,
    //     msg: `WFH Apply time over for: ${userId}`,
    //   })
    //   return
    // }
    leaveDays.forEach(async (date) => {
      const LeaveDate = ObjectHelper.formatDate(date)

      const isExists = await EmployeeLeave.findOne({
        where: {
          where: sequelize.where(sequelize.col('leaveDays'), 'like', `%${LeaveDate}%`),
          // $and: sequelize.where(sequelize.col('empId'), '=', empId),
          $and: sequelize.where(sequelize.col('userId'), '=', userId),
        },
      })
      if (!isEmpty(isExists)) {
        throw new NotFound()
      }
    })
    const isExists = await EmployeeLeave.findOne({
      where: {
        [Op.and]: [
          sequelize.literal(`JSON_CONTAINS(leaveDays->>'$', '["${leaveDays.join('","')}"]')`),
          // { empId: empId },
          { userId: userId },
          { isDelete: 0 },
        ],
      },
      attributes: ['leaveDays'],
    })
    if (!isEmpty(isExists)) {
      logger.error(
        {
          controller: 'leaveController',
          method: 'markLeave',
        },
        {
          payload: req?.body,
          msg: 'Leave already marked',
        },
      )
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.LEAVE_EXIST,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }

    if (userRole !== (UserRoleEnums?.SUPER_ADMIN && UserRoleEnums?.HR) || userId === reUserId) {
      leaveStatus = StatusEnums?.PENDING
      universalLeaveStatus = StatusEnums?.PENDING
    } else {
      leaveStatus = StatusEnums?.APPROVED
      universalLeaveStatus = StatusEnums?.APPROVED
    }
    let result
    let poResults
    if (poId && poId?.length > 0 && poId[0] !== null) {
      poResults = await Promise.all(
        poId.map(async (po) => {
          // if(po !== empId){
          if (po !== userId && po !== null) {
            return {
              // empId,
              userId,
              leaveType,
              // leaveFrom: startDateUtc,
              leaveFrom: dateTime1,
              // leaveTo: endDateUtc,
              leaveTo: dateTime2,
              leaveDays,
              leaveReason,
              leaveStatus,
              leaveDuration,
              createdBy: getRequestUserId(req),
              createdAt: new Date(),
              contactNum,
              addressDuringLeave,
              // poId: po !== empId ? po : null,
              poId: po !== empId ? po : null,
              universalLeaveStatus,
            }
          } else {
            return null
          }
        }),
      )
    }

    const filteredPoResults = poResults?.filter((result) => result !== null)
    if (filteredPoResults?.length > 0) {
      result = await EmployeeLeave.bulkCreate(filteredPoResults)
    }
 

    const leaveRequestForHr = await EmployeeLeave.create({
      // empId,
      userId,
      leaveType,
      // leaveFrom: startDateUtc,
      leaveFrom: dateTime1,
      // leaveTo: endDateUtc,
      leaveTo: dateTime2,
      leaveDays: leaveDays,
      leaveReason,
      leaveStatus: leaveStatus,
      leaveDuration,
      createdBy: getRequestUserId(req),
      createdAt: new Date(),
      contactNum,
      addressDuringLeave,
      universalLeaveStatus,
    })
    resultEmpLeave = result ? result?.concat(leaveRequestForHr) : leaveRequestForHr
    const leaveId = leaveRequestForHr?.dataValues?.id
    const days = await Promise.all(
      leaveDays.map(async (date) => {
        const dayOfWeek = moment(date).day();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          return EmployeeLeaveDays.create({
            userId,
            leaveType, 
            date,
            leaveId,
            createdAt: new Date(),
          });
        }
        return null;
      })
    )

    const resultData = resultEmpLeave?.length > 0 ? resultEmpLeave[0] : resultEmpLeave
    const data = ObjectHelper.formatKeys(resultData.dataValues)
    if (!isEmpty(resultData)) {
      const empDataResponse = await Employee.findOne({
        // where: { empId: empId },
        where: { userId: userId },
      })
      if (leaveType !== leaveTypeEnums?.WORK_FROM_HOME) {
        const mailTemplate = 'leave_apply'
        const templateData = await MailTemplate.findOne({
          where: { uniqueValue: mailTemplate },
        })
        let templateResponse = templateData?.content
        if (templateResponse) {
          templateResponse = templateResponse.replace('{{name}}', empDataResponse.userName)
          // templateResponse = templateResponse.replace('{{startDate}}', startDateUtc)
          templateResponse = templateResponse.replace(
            '{{startDate}}',
            new Date(dateTime1).toLocaleString('en-US', dateOptions),
          )
          // templateResponse = templateResponse.replace('{{endDate}}', endDateUtc)
          templateResponse = templateResponse.replace(
            '{{endDate}}',
            new Date(dateTime2).toLocaleString('en-US', dateOptions),
          )
          templateResponse = templateResponse.replace('{{empId}}', empId)
          templateResponse = templateResponse.replace('{{reason}}', leaveReason)

          const subject = 'Leave Applied'
          mailToPoAndHr(userId, subject, templateResponse)
        }
      } else {
        const mailTemplate = 'work_from_home_apply'
        const templateData = await MailTemplate.findOne({
          where: { uniqueValue: mailTemplate },
        })
        let templateResponse = templateData?.content
        if (templateResponse) {
          templateResponse = templateResponse.replace('{{name}}', empDataResponse.userName)
          // templateResponse = templateResponse.replace('{{startDate}}', startDateUtc)
          templateResponse = templateResponse.replace(
            '{{startDate}}',
            new Date(dateTime1).toLocaleString('en-US', dateOptions),
          )
          // templateResponse = templateResponse.replace('{{endDate}}', endDateUtc)
          templateResponse = templateResponse.replace(
            '{{endDate}}',
            new Date(dateTime2).toLocaleString('en-US', dateOptions),
          )
          templateResponse = templateResponse.replace('{{empId}}', empDataResponse.empId)
          templateResponse = templateResponse.replace('{{reason}}', leaveReason)

          const subject = 'WFH Applied'
          mailToPoAndHr(userId, subject, templateResponse)
        }
      }

      res.status(HttpStatusCode.OK).send({
        status: true,
        message: leaveType != leaveTypeEnums?.WORK_FROM_HOME ? MessageTag.LEAVE_MARK : MessageTag.WFH_MARK,
        data,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'leaveController',
        method: 'markLeave',
        data: isExists,
        msg: `Leave Marked for: ${userId}`,
      })
    }
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'markLeave',
      payload: req?.body,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      status: error?.isOperational || false,
      message: error?.message,
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    })
  }
}

const updateLeave = async (req, res) => {
  const { id } = req.params
  const { leaveDate, userId = null, empId = null, leaveType, leaveReason = null } = req.body

  const startDateUtc = leaveDate[0]
  const endDateUtc = leaveDate[1]
  const startDate = new Date(startDateUtc)
  const enadDate = new Date(endDateUtc)
  // const leaveDays = ObjectHelper.getDates(startDate, enadDate)

  logger.warn({
    controller: 'leaveController',
    method: 'updateLeave',
    payload: req?.body,
    msg: 'Update Leave started',
  })

  try {
    // if (!startDateUtc || !endDateUtc || !leaveType || !empId) {
    if (!startDateUtc || !endDateUtc || !leaveType || !userId) {
      throw new Error(MessageTag.ALL_REQ)
    }
    const isExists = await EmployeeLeave.findOne({
      where: {
        where: sequelize.where(
          sequelize.fn('date', sequelize.col('leaveFrom')),
          '=',
          sequelize.fn('date', startDateUtc),
        ),
        // $and: sequelize.where(sequelize.col('empId'), '=', empId),
        $and: sequelize.where(sequelize.col('userId'), '=', userId),
      },
    })
    if (!isEmpty(isExists) && isExists?.id != id) {
      logger.error({
        controller: 'leaveController',
        method: 'updateLeave',
        payload: req?.body,
        msg: 'Leave already marked',
      })
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.LEAVE_EXIST,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }

    const result = await EmployeeLeave.update(
      {
        empId,
        userId, // added
        leaveType,
        leaveFrom: startDateUtc,
        leaveTo: endDateUtc,
        leaveReason,
        updatedBy: getRequestUserId(req),
        updatedAt: new Date(),
      },
      {
        where: {
          id,
        },
      },
    )
    if (!isEmpty(result)) {
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: MessageTag.LEAVE_UPDATED,
        statusCode: HttpStatusCode.OK,
      })

      logger.info({
        controller: 'leaveController',
        method: 'updateLeave',
        data: isExists,
        msg: `Leave Marked for: ${empId}`,
      })
    }
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'updateLeave',
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

const getEmployeeLeave = async (req, res) => {
  const userId = parseInt(getRequestUserId(req))
  const userRole = getRequestUserRole(req)
  const leaveResult = []
  const nowDate = new Date()
  const todayDate = ObjectHelper.formatDate(nowDate)
  
  logger.warn({
    controller: 'leaveController',
    method: 'getEmployeeLeave',
    payload: null,
    msg: 'Get Employee Leave started',
  })
  let empAttributes
  if(userRole === UserRoleEnums?.HR || userRole === UserRoleEnums?.SUPER_ADMIN){
    empAttributes = ['id', 'userId', 'leaveFrom', 'leaveTo', 'leaveType','poId',
    'leaveStatus', 'universalLeaveStatus','leaveReason']
  }else {
    empAttributes = [ 'id', 'userId', 'leaveFrom', 'leaveTo', 'leaveType','poId',
    'leaveStatus', 'universalLeaveStatus']
  }
  try {
    let queryOptions = {
      attributes: empAttributes,
      include: [
        {
          model: Employee,
          // as: 'user',
          attributes: ['userName'],
        },
      ],
      where: {isDelete: 0}
    };

    if (userRole !== UserRoleEnums.SUPER_ADMIN && userRole !== UserRoleEnums.HR) {
      queryOptions.where = {
        [Op.or]: [
          {
            leaveStatus: StatusEnums.APPROVED,
            userId: {[Op.ne]: userId},
          },
          {
            leaveStatus: StatusEnums.APPROVED,
            userId: userId,
          },
          {
            leaveStatus: StatusEnums.PENDING,
            [Op.or]: [
              { userId: userId },
              { poId: userId },
            ],
          },
          {
            leaveStatus: StatusEnums.REJECTED,
            [Op.or]: [
              { userId: userId },
              { poId: userId },
            ],
          },
        ],
          isDelete: 0,
      };
    }

    const leaveResults = await EmployeeLeave.findAll(queryOptions)

    const regularLeaveQuery = {
      attributes: [
        'id',
        'empId',
        'userId',
        'leaveFrom',
        'poId',
        'leaveTo',
        'leaveType',
        'leaveReason',
      ],
      include: [
        {
          model: Employee,
          attributes: ['userName'],
        },
      ],
      where: {
          [Op.and]: [
            sequelize.literal(`JSON_CONTAINS(leaveDays, '["${todayDate}"]')`),
             {universalLeaveStatus: StatusEnums.APPROVED},
             {leaveType: { [Op.not]: leaveTypeEnums?.WORK_FROM_HOME }},
             {poId: { [Op.eq]: null }}
          ],
        },
      order: [['id', 'DESC']],
    };
    
    // Work From Home Leave Query
    const wfhLeaveQuery = {
      attributes: [
        'id',
        'empId',
        'userId',
        'leaveFrom',
        'leaveTo',
        'poId',
        'leaveType',
        'leaveReason',
      ],
      include: [
        {
          model: Employee,
          attributes: ['userName'],
        },
      ],
      where: {
        [Op.and]: [
          sequelize.literal(`JSON_CONTAINS(leaveDays, '["${todayDate}"]')`),
           {universalLeaveStatus: StatusEnums.APPROVED},
           {leaveType: leaveTypeEnums?.WORK_FROM_HOME},
           {poId: { [Op.eq]: null }}
        ],
      }, 
      order: [['id', 'DESC']],
    };
    
    const results = await EmployeeLeave.findAll(regularLeaveQuery)
    const resultsWFH = await EmployeeLeave.findAll(wfhLeaveQuery)

    res.status(HttpStatusCode.OK).send({
      status: true,
      data: {leaveResult: leaveResults, regularLeave: results, workFromHomeLeave: resultsWFH},
    })

    logger.info({
      controller: 'leaveController',
      method: 'getEmployeeLeave',
      payload: null,
      msg: 'Employee Leave List: ',
    })
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'getEmployeeLeave',
      payload: null,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(HttpStatusCode.BAD_REQUEST).json({ status: false, error: error?.message })
  }
}

const getLeaveRequest = async (req, res) => {
  const { leaveStatus, skip, limit, employeeValue } = req?.query || null;
  const userId = getRequestUserId(req)
  const userRole = getRequestUserRole(req)
  const loggerPayload = null;
  logger.warn({
    controller: 'leaveController',
    method: 'getLeaveRequest',
    payload: loggerPayload,
    msg: 'Get Employee Leave request started',
  });

  try {
    const whereClause = {}
    if (userRole === UserRoleEnums?.HR || userRole === UserRoleEnums?.SUPER_ADMIN) {
      if (employeeValue) {
        whereClause.userId = employeeValue
      }
      if (leaveStatus !== undefined) {
        whereClause.universalLeaveStatus = leaveStatus
      }
      whereClause.poId = null
    } else {
      if(employeeValue) {
        whereClause.userId = employeeValue
        if(parseInt(employeeValue) !== userId){
          whereClause.poId = userId
        }else{
          whereClause.poId = null
        }
      } else {
        whereClause[Op.or] = [
          {
            [Op.and]: [
              { userId: userId },
              { poId: null },
            ],
          },
          { poId: userId },
        ];
      }
      if (leaveStatus !== undefined) {
        whereClause.universalLeaveStatus = leaveStatus
      }
    }
    whereClause.isDelete = 0
    const leaveResult = await EmployeeLeave.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'requestedUser',
          attributes: ['userName'],
        },
      ],
      attributes: [
                  'id',
                  'userId', 
                  // 'leaveDuration',
                  'leaveFrom', 
                  'leaveTo', 
                  // 'leaveReason', 
                  'leaveStatus', 
                  // 'poId', 
                  'leaveType',
                  // 'rejectReason', 
                  'universalLeaveStatus',
                 // 'contactNum',
                ],
      order: [['id', 'DESC']],
      offset: parseInt(skip) || 0, 
      limit: parseInt(limit - skip) || 10,
    })
    const totalCount = await EmployeeLeave.count({
      where: whereClause,
    })

    res.status(HttpStatusCode.OK).send({
      status: true,
      data: { leaveRequest: leaveResult, totalCount: totalCount },
    })

    logger.info({
      controller: 'leaveController',
      method: 'getLeaveRequest',
      payload: loggerPayload,
      msg: 'Employee Leave request List: ',
    });
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'getLeaveRequest',
      payload: loggerPayload,
      msg: `Catch error: ${error?.message}`,
    })

    res.status(HttpStatusCode.BAD_REQUEST).json({
      status: false,
      message: error?.message,
      statusCode: HttpStatusCode.BAD_REQUEST,
    });
  }
};
const updateLeaveStatus = async (req, res) => {
  const { id } = req.params
  const leaveRequestParam = req?.body
  if (!isEmpty(leaveRequestParam)) {
    const leaveStatus = leaveRequestParam?.status
    const rejectReason = leaveRequestParam?.rejectReason
    const requestedUserId = leaveRequestParam?.data?.userId
    const leaveFrom = leaveRequestParam?.data?.leaveFrom
    const leaveTo = leaveRequestParam?.data?.leaveTo
    // const ids = leaveRequestParam?.data?.ids
    logger.warn({
      controller: 'leaveController',
      method: 'updateLeaveStatus',
      msg: 'Update Leave request status  started',
    })

    try {
      const isExists = await EmployeeLeave.findOne({
        where: {
          where: sequelize.where(sequelize.col('id'), '=', id),
          // $and: sequelize.where(sequelize.col('leaveStatus'), '=', 0),
        },
      })
      if (isEmpty(isExists)) {
        logger.error({
          controller: 'leaveController',
          method: 'updateLeaveStatus',
          payload: leaveRequestParam,
          msg: 'Leave Request not exists',
        })
        res.status(HttpStatusCode.BAD_REQUEST).json({
          status: false,
          message: MessageTag.LEAVE_REQUEST_NOT_FOUND,
          statusCode: HttpStatusCode.BAD_REQUEST,
        })
        return
      }

      let updateResult
      if (req.user?.userRole === UserRoleEnums?.HR || req.user?.userRole === UserRoleEnums?.SUPER_ADMIN) {
        try {
          const ids = await EmployeeLeave?.findAll({
            where: { userId: requestedUserId, leaveFrom, leaveTo, isDelete:0},
            attributes: ['id'],
          })  

          await Promise.all(
            ids?.map(async (id) => {
              await EmployeeLeave.update(
                {
                  universalLeaveStatus: leaveStatus,
                  updatedBy: getRequestUserId(req),
                  updatedAt: new Date(),
                },
                {
                  where: { id: id?.dataValues?.id },
                },
              )
              await EmployeeLeave.update(
                {
                  leaveStatus: leaveStatus,
                },
                {
                  where: { id: id?.dataValues?.id, leaveStatus: 0 },
                },
              )
              await EmployeeLeave.update(
                {
                  rejectReason: rejectReason,
                },
                {
                  where: { id: id?.dataValues?.id, poId: null },
                },
              )
            }),
          )

          let isExistsLeaveDays
          if(leaveStatus === StatusEnums?.APPROVED && (isExists?.dataValues?.leaveType === leaveTypeEnums?.EARN_LEAVE || isExists?.dataValues?.leaveType === leaveTypeEnums?.SICK_AND_CASUAL_LEAVE)){
            isExistsLeaveDays = await EmployeeLeaveDays.findAll({
              // where:{leaveId:parseInt(id)}
              where: { leaveId: id },
            })
          }

          if (isExistsLeaveDays?.length > 0) {
            // Get the month and year for the leave request
            const leaveMonth = moment(isExistsLeaveDays[isExistsLeaveDays.length-1]?.date).format('MM');
            const leaveYear = moment(isExistsLeaveDays[isExistsLeaveDays.length-1]?.date).format('YYYY');
            // check for this month 
            const hasThisMonthLeave = await EmployeeLeaveDays.findOne({
              include: [
                {
                  model: EmployeeLeave,
                  attributes: ['leaveType'],
                  where: {
                    leaveType: { [Op.not] : leaveTypeEnums?.WORK_FROM_HOME }
                  }
                }
              ],
              where: { userId: isExistsLeaveDays[isExistsLeaveDays.length-1]?.userId,
                leaveId: { [Op.not]: isExistsLeaveDays[isExistsLeaveDays.length - 1]?.leaveId },    
                [Op.and]: [
                  sequelize.literal(`MONTH(date) = ${leaveMonth}`),
                  sequelize.literal(`YEAR(date) = ${leaveYear}`),
                ],
              }
            })
            let update
            if (!hasThisMonthLeave && isExistsLeaveDays.length > 1) {
              // Find the last leave month
              const lastLeaveMonth = await EmployeeLeaveDays.findAll({
                include: [
                  { model: EmployeeLeave,
                    attributes: ['id', 'leaveDuration', 'leaveType'],
                    where: { 
                      isDelete: 0, 
                      universalLeaveStatus: StatusEnums?.APPROVED,
                      leaveType: { [Op.not] : leaveTypeEnums?.WORK_FROM_HOME },
                    },
                  }
                ],
                where: {
                  userId: isExistsLeaveDays[0]?.userId,
                  leaveId: { [Op.ne]: isExistsLeaveDays[0]?.leaveId },
                },
                order: [['date', 'DESC']],
              });

              if (lastLeaveMonth  && lastLeaveMonth?.length >0 && lastLeaveMonth[0]?.dataValues?.leaveId!== isExistsLeaveDays[isExistsLeaveDays?.length-1]?.dataValues?.leaveId) {
                const gap = moment(isExistsLeaveDays[isExistsLeaveDays?.length-1]?.dataValues?.date).diff(moment(lastLeaveMonth[0]?.dataValues?.date), 'months');
                const leaveGap = gap > 1 ? gap - 1 : gap 
                if (leaveGap >= isExistsLeaveDays?.length) {
                  update = {
                    isPaid: 1,
                  };
                } else {
                  const countIsPaidFalse = leaveGap;
                  const gapDate = moment(isExistsLeaveDays[isExistsLeaveDays?.length-1]?.dataValues?.date).format('YYYY-MM-DD')
                  const updatedGapDate = moment(gapDate).subtract(countIsPaidFalse, 'months').format('YYYY-MM-DD');
                 
                  

                  const leaveGapEntries = isExistsLeaveDays.slice(-leaveGap); // Get the first leaveGap entries
                  const leaveGapEntryDates = leaveGapEntries.map(entry => moment(entry.dataValues.date).format('YYYY-MM-DD'));
            
                  update = {
                    isPaid: sequelize.literal(`date IN ('${leaveGapEntryDates.join("','")}')`),
                  };

                  // update = {
                    // isPaid: sequelize.literal(`date <= '${moment(isExistsLeaveDays[isExistsLeaveDays?.length-1]?.dataValues?.date)
                    // isPaid: sequelize.literal(`date <= '${gapDate
                    //   .subtract(countIsPaidFalse, 'months')
                    //   .format('YYYY-MM-DD')}'`),
                    // isPaid: sequelize.literal(`date <= '${updatedGapDate}'`),
                    
                  // };
                }
              } else {
                update = {
                  isPaid: sequelize.literal(`date = '${moment(isExistsLeaveDays[isExistsLeaveDays?.length-1]?.dataValues?.date).format('YYYY-MM-DD')}'`),
                }
              }
            }
            if (!hasThisMonthLeave && isExistsLeaveDays.length == 1){
              update = {
                isPaid: 1,
              }
            } 

            await EmployeeLeaveDays.update(update, {
              where: { leaveId: parseInt(id) },
            })
        }
        } catch (error) {
          console.error(error)
        }
      } else {
        try {
            const ids = await EmployeeLeave?.findAll({
              where: { userId: requestedUserId, leaveFrom, leaveTo, isDelete:0},
              attributes: ['id'],
            })  
            ids?.map(async (id) => {
              await EmployeeLeave.update(
                {
                  leaveStatus: leaveStatus,
                  rejectReason,
                  updatedBy: getRequestUserId(req),
                  updatedAt: new Date(),
                },
                {
                  where: { 
                    id: id?.dataValues?.id,
                    poId: req?.user?.userId
                  }
                }
             )
            })
        } catch (error) {
          console.error(error)
        }
      }
      const data = await EmployeeLeave.findOne({
        where: { id: id },
      })
      let userId
      if (updateResult) {
        const empDataResponse = await Employee.findOne({
          // where: { empId: leaveRequestParam?.data?.empId },
          // where: { userId: leaveRequestParam?.data?.userId },
          where: { userId: leaveRequestParam?.data?.requestedUserId },
        })
        if (isExists.leaveType !== leaveTypeEnums?.WORK_FROM_HOME) {
          userId = empDataResponse?.userId
          const mailTemplate = 'leave_approve_reject'
          const templateData = await MailTemplate.findOne({
            where: { uniqueValue: mailTemplate },
          })
          let templateResponse = templateData?.content
          if (templateResponse) {
            templateResponse = templateResponse.replace('{{name}}', empDataResponse.userName)
            templateResponse = templateResponse.replace('{{reject_reason}}', rejectReason)
            templateResponse = templateResponse.replace(
              '{{leaveStatus}}',
              leaveStatus === StatusEnums.APPROVED ? 'Approved' : 'Rejected',
            )
            templateResponse = templateResponse.replace('{{empId}}', empDataResponse?.empId)

            templateResponse = templateResponse.replace(
              '{{startDate}}',
              new Date(isExists?.leaveFrom).toLocaleString('en-US', dateOptions),
            )
            ;(templateResponse = templateResponse.replace(
              '{{endDate}}',
              new Date(isExists?.leaveTo).toLocaleString('en-US', dateOptions),
            )),
              (templateResponse = templateResponse.replace('{{reason}}', isExists?.leaveReason))

            const subject =
              leaveStatus === StatusEnums?.APPROVED ? 'Leave Approved.' : 'Leave Rejected'
            if (req.user?.userRole === 'hr') {
              sendMailToEmpAndPos(empDataResponse?.userEmail, subject, templateResponse)
            } else {
              sendMailToEmpAndHr(
                empDataResponse?.userEmail,
                subject,
                templateResponse,
                req.user.userId,
              )
            }
          }
        } else {
          userId = empDataResponse?.userId
          const mailTemplate = 'work_from_home_approve_reject'
          const templateData = await MailTemplate.findOne({
            where: { uniqueValue: mailTemplate },
          })
          let templateResponse = templateData?.content
          if (templateResponse) {
            templateResponse = templateResponse.replace('{{name}}', empDataResponse.userName)
            templateResponse = templateResponse.replace('{{reject_reason}}', rejectReason)
            templateResponse = templateResponse.replace(
              '{{leaveStatus}}',
              leaveStatus === StatusEnums.APPROVED ? 'Approved' : 'Rejected',
            )
            templateResponse = templateResponse.replace('{{empId}}', empDataResponse?.empId)

            templateResponse = templateResponse.replace(
              '{{startDate}}',
              new Date(isExists?.leaveFrom).toLocaleString('en-US', dateOptions),
            )
            ;(templateResponse = templateResponse.replace(
              '{{endDate}}',
              new Date(isExists?.leaveTo).toLocaleString('en-US', dateOptions),
            )),
              (templateResponse = templateResponse.replace('{{reason}}', isExists?.leaveReason))

            const subject =
              leaveStatus === StatusEnums?.APPROVED ? 'Leave Approved.' : 'Leave Rejected'
            if (req.user?.userRole === 'hr') {
              sendMailToEmpAndPos(empDataResponse?.userEmail, subject, templateResponse)
            } else {
              sendMailToEmpAndHr(
                empDataResponse?.userEmail,
                subject,
                templateResponse,
                req.user.userId,
              )
            }
          }
        }
      }
      res.status(HttpStatusCode.OK).send({
        status: true,
        data: data,
        userId: userId,
        message: leaveStatus === StatusEnums.APPROVED ? 'Leave Approved.' : 'Leave Rejected',
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'leaveController',
        method: 'updateLeaveStatus',
        data: isExists,
        msg: `Leave Request updated,Id: ${id}`,
      })
    } catch (error) {
      logger.error({
        controller: 'leaveController',
        method: 'updateLeaveStatus',
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

const getAllLeaveForLeaveType = async (req, res) => {
  const { userId, leaveType } = req.params
  const leaveStatus = 1
  logger.warn({
    controller: 'leaveController',
    method: 'getAllLeaveForLeaveType',
    payload: userId,
    leaveType,
    msg: 'Get leave request started',
  })
  try {
    const annualLeaveCounts = await EmployeeLeave.findAll({
      where: {
        [Op.and]: [
          // { empId: empId },
          { userId: userId },
          { leaveType: leaveType },
          // { leaveStatus: leaveStatus },
          { universalLeaveStatus: leaveStatus },
          { poId: { [Op.or]: [null] } },
        ],
        // where: sequelize.where(sequelize.col('empId'), '=', empId),
        // $and: sequelize.where(sequelize.col('leaveType'), '=', leaveType),
      },
    })
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: 'Leave data found ',
      statusCode: HttpStatusCode.OK,
      data: annualLeaveCounts,
    })
    logger.info({
      controller: 'leaveController',
      method: ' getAllLeaveForLeaveType',
      data: annualLeaveCounts,
      msg: `Leave Request data found for: ${userId}`,
    })
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'getAllLeaveForLeaveType',
      payload: userId,
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

const getTeamPendingLeaveCount = async (req, res) =>{
  const { userId } = req.params
  let teamPendingLeave = 0
  logger.warn({
    controller: 'leaveController',
    method: 'getTeamPendingLeaveCount',
    payload: userId,
    msg: 'Get Employee team  pending Leave request started',
  })
  const userRole = req?.user?.userRole
  let where ={}
  if(userRole === UserRoleEnums?.HR || userRole === UserRoleEnums?.SUPER_ADMIN){
    where ={ 
      poId: null,
      universalLeaveStatus: StatusEnums?.PENDING,
      isDelete: 0,
    }  
  }else{
    where = {
      poId: userId,
      universalLeaveStatus: StatusEnums?.PENDING,
      isDelete: 0,
    }
  }
  try{
    teamPendingLeave = await EmployeeLeave.findAll({
      where: { 
        ...where
      },
      attributes: ['id']
    })
    const totalPendingLeave = teamPendingLeave?.length
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: MessageTag.TEAM_PENDING_LEAVE,
      data: totalPendingLeave,
      statusCode: HttpStatusCode.OK,
    })
  } catch(error){
    logger.error({
      controller: 'leaveController',
      method: 'getTeamPendingLeaveCount',
      payload: teamPendingLeave,
      msg: `Catch error: ${error?.message}`,
    })

    res.status(HttpStatusCode.BAD_REQUEST).json({
      status: false,
      message: error?.message,
      statusCode: HttpStatusCode.BAD_REQUEST,
    });  
  }
}

const deleteLeaveRequest = async (req, res) => {
  const { id } = req.params
  logger.warn({
    controller: 'leaveController',
    method: 'deleteLeaveRequest',
    payload: id,
    msg: 'Delete leave request started',
  })

  try {
    const isExists = await EmployeeLeave.findOne({
      where: {
        where: sequelize.where(sequelize.col('id'), '=', id),
        $and: sequelize.where(sequelize.col('leaveStatus'), '=', StatusEnums?.PENDING),
      },
    })
    if (isEmpty(isExists)) {
      logger.error({
        controller: 'leaveController',
        method: 'deleteLeaveRequest',
        payload: id,
        msg: 'Leave Request not exists',
      })
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.LEAVE_REQUEST_NOT_FOUND,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return false
    }
   try{
    const requestedUserId = isExists?.dataValues?.userId
    const leaveFrom = isExists?.dataValues?.leaveFrom
    const leaveTo = isExists?.dataValues?.leaveTo

      const ids = await EmployeeLeave?.findAll({
        where: { userId: requestedUserId, leaveFrom, leaveTo, isDelete:0},
        attributes: ['id'],
      })  
    
     await Promise.all(
       ids?.map(async (id) => {
         await EmployeeLeave.update(
           {
             isDelete: 1,
             updatedAt: new Date(),
           },
           {
             where: { id: id?.dataValues?.id },
           },
         )
       })
     )
   } catch (error){
    console.error(error)
   }
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: MessageTag.LEAVE_REQUEST_DELETED,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'leaveController',
      method: 'deleteLeaveRequest',
      data: isExists,
      msg: `Leave Request deleted,Id: ${id}`,
    })
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'deleteLeaveRequest',
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

const getLeaveRequestCount = async (req, res) => {
  const { userId } = req.params
  logger.warn({
    controller: 'leaveController',
    method: 'getLeaveRequestCount',
    payload: userId,
    msg: 'Get leave request Count started',
  })
  try {
    const leaveCount = await EmployeeLeaveDays.findAll({
      include: [
        {
          model: EmployeeLeave,
          attributes: ['id', 'leaveDuration', 'leaveType'],
          where: { 
            isDelete: 0, 
            userId,
            universalLeaveStatus: StatusEnums?.APPROVED
          },
        }
      ],
      where: {
        userId, 
      },
      attributes: ['id','isPaid']
    })

    let earnLeave = 0
    let sickAndCasualLeave = 0
    let wfh = 0

    leaveCount?.map((leaveRecord) => {
      if(leaveRecord?.dataValues?.isPaid === 1){
        if( leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveType === leaveTypeEnums?.EARN_LEAVE){
          if(leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveDuration === leaveDurationEnums?.FULL_DAY){
            earnLeave += 1 
          }else if(leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveDuration === leaveDurationEnums?.HALF_DAY){
            earnLeave += 0.5
          } else{
            earnLeave +=0.25
          }
        }
        if( leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveType === leaveTypeEnums?.SICK_AND_CASUAL_LEAVE ){
          if( leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveDuration === leaveDurationEnums?.FULL_DAY ){
            sickAndCasualLeave += 1 
          }else if( leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveDuration === leaveDurationEnums?.HALF_DAY ){
            sickAndCasualLeave += 0.5
          } else{
            sickAndCasualLeave +=0.25
          }
        }
      }  
      if( leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveType === leaveTypeEnums?.WORK_FROM_HOME ){
        if( leaveRecord?.dataValues?.EmployeeLeave?.dataValues?.leaveDuration === leaveDurationEnums?.FULL_DAY ){
          wfh += 1 
        }else {
          wfh += 0.5
        }
      }
    })
 
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: MessageTag.LEAVE_TYPE_LEAVE_COUNT,
      data: { earnLeave: earnLeave, sickAndCasualLeave: sickAndCasualLeave, wfh: wfh },
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'leaveController',
      method: 'getLeaveRequestCount',
      data: { earnLeave: earnLeave, sickAndCasualLeave: sickAndCasualLeave, wfh: wfh },
      msg: `Leave Request userId: ${userId}`,
    })
  } catch (error) {
    logger.error({
      controller: 'leaveController',
      method: 'getLeaveRequestCount',
      payload: userId,
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
 
const getLeaveRecord = async (req, res) => {
  logger.warn({
    controller: 'leaveController',
    method: 'getLeaveRecord',
    // payload: userId,
    msg: 'Get leave data started',
  })
  const userId = req?.query?.userId;
  const leaveTo = req?.query?.leaveTo;
  const leaveFrom = req?.query?.leaveFrom;

  try {
    const leaveRecord = await EmployeeLeave.findAll({
      // where: { isDelete: 0 },
      where: { userId: userId, leaveTo: leaveTo, leaveFrom: leaveFrom, isDelete: 0 }, 
      include: [
        {
          model: Employee,
          as: 'requestedUser',
          attributes: ['userName'],
        },
        {
          model: Employee,
          as: 'poUser',
          attributes: ['userName'],
        },
      ],
      attributes: [
        'id',
        'userId', 
        'leaveDuration',
        'leaveFrom', 
        'leaveTo', 
        'leaveReason', 
        'leaveStatus', 
        'poId', 
        'leaveType',
        'rejectReason', 
        'universalLeaveStatus',
      ],
    })

    res.status(HttpStatusCode.OK).send({
      status: true,
      data: leaveRecord,
    })

    logger.info({
      controller: 'leaveController',
      method: 'getLeaveRecord',
      // payload: loggerPayload,
      msg: 'Employee Leave record List: ',
    });
  } catch (error){
    logger.error({
      controller: 'leaveController',
      method: 'getLeaveRecord',
      // payload: userId,
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
  markLeave,
  updateLeave,
  getEmployeeLeave,
  // getEmployeeDayLeave,
  getLeaveRequestCount,
  getLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
  getAllLeaveForLeaveType,
  getTeamPendingLeaveCount,
  getLeaveRecord,
}