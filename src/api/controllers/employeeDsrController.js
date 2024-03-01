/* eslint-disable no-dupe-else-if */
const { isEmpty } = require('lodash')
const Sequelize = require('sequelize')
const { Op } = require('sequelize')
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const { mailToPoAndHr } = require('./mailController')
const EmployeeDsr = db.employeeDsr
const Employee = db.employee
const ProjectInformation = db.projectInformation
const MailTemplate = db.mailTemplate
const DsrQuery = db.dsrQuery
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const {
  getRequestUserId,
  getRequestEmpId,
  dateOptions,
  convertTotalMinutesToHours,
  convertTotalMinutesToMinutes,
} = require('../../helper')

const employeeDsr = async (req, res) => {
  const dsrFilledDate = new Date().toLocaleString('en-US', dateOptions)
  const employeeDSRdata = req.body
  const empId = getRequestEmpId(req)
  const userId = getRequestUserId(req)

  try {
    if (isEmpty(employeeDSRdata)) {
      throw new BadRequest()
    }
    let updatedDsr
    let isCreated
    for (let i = 0; i < employeeDSRdata.length; i += 1) {
      const currentEmployeeDSR = employeeDSRdata[i]
      if (currentEmployeeDSR.id) {
        updatedDsr = await EmployeeDsr.update(
          {
            projectId: currentEmployeeDSR?.projectId,
            workingDate: currentEmployeeDSR?.workingDate,
            workingHours: currentEmployeeDSR?.taskMinutes,
            taskDetail: currentEmployeeDSR?.taskDetails,
            taskStatus: currentEmployeeDSR?.taskStatus,
            updatedBy: getRequestUserId(req),
            updatedAt: new Date(),
          },
          {
            where: {
              id: currentEmployeeDSR.id,
            },
          },
        )
      } else {
        // eslint-disable-next-line no-await-in-loop

        isCreated = await EmployeeDsr.create({
          userId: userId,
          empId: empId.toUpperCase(),
          projectId: currentEmployeeDSR?.projectId,
          workingDate: currentEmployeeDSR?.workingDate,
          workingHours: currentEmployeeDSR?.taskMinutes,
          taskDetail: currentEmployeeDSR?.taskDetails,
          taskStatus: currentEmployeeDSR?.taskStatus,
          createdBy: getRequestUserId(req),
          createdAt: new Date(),
        })
      }
    }
    // Mail Code
    if (!isEmpty(isCreated) || !isEmpty(updatedDsr)) {
      const empDataResponse = await Employee.findOne({
        where: { userId: userId },
      })
      const mailTemplate = 'dsr_apply'
      const templateData = await MailTemplate.findOne({
        where: { uniqueValue: mailTemplate },
      })
      let templateResponse = templateData?.content
      if (templateResponse) {
        templateResponse = templateResponse.replace('{{name}}', empDataResponse.userName)
        templateResponse = templateResponse.replace('{{applyDate}}', dsrFilledDate)
        templateResponse = templateResponse.replace('{{empId}}', empId)

        const subject = 'Dsr Applied'
        mailToPoAndHr(userId, subject, templateResponse)
      }
    }
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: isCreated,
      updatedData: updatedDsr,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'employeeDsrController',
      method: 'employeeDsr',
      payload: isCreated,
      updatedPayload: updatedDsr,
      msg: 'employeeDsr added',
    })
  } catch (error) {
    logger.error({
      controller: 'employeeDsrController',
      method: 'employeeDsr',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.msg}`,
    })
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      status: error?.isOperational || false,
      message: error?.message,
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    })
  }
}
const addQuery = async (req, res) => {
  const { id, query } = req.body
  const userId = getRequestUserId(req)

  try {
    if (!id && !userId && !query) {
      throw new BadRequest()
    }

    const isCreated = await DsrQuery.create({
      dsrId: id,
      userId,
      query,
      createdBy: getRequestUserId(req),
      createdAt: new Date(),
    })
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: isCreated,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'employeeDsrController',
      method: 'dsrQuery',
      payload: isCreated,
      msg: 'dsrQuer added',
    })
  } catch (error) {
    logger.error({
      controller: 'employeeDsrController',
      method: 'dsrQuery',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.msg}`,
    })
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      status: error?.isOperational || false,
      message: error?.message,
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    })
  }
}
// for admin
const getAllEmployeeDsr = async (req, res) => {
  const userId = getRequestUserId(req)
  const {
    skip = 0,
    limit = 10,
    searchText = null,
    startDate = null,
    endDate = null,
    searchedEmployee = null,
  } = req.query

  let whereClause = {}

  if (searchText) {
    whereClause.taskDetail = { [Op.like]: `%${searchText}%` }
  }
  if (startDate && endDate) {
    whereClause.workingDate = { [Op.between]: [startDate, endDate] }
  }
  if (searchedEmployee) {
    whereClause.userId = searchedEmployee
  }

  try {
    if (!userId) {
      throw new BadRequest()
    }

    const allEmployeeDsrList = await EmployeeDsr.findAll({
      attributes: [
        'workingDate',
        [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
      ],
      where: whereClause,
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      order: [['workingDate', 'DESC']],
      group: ['workingDate'],
    })

    let allTask = await EmployeeDsr.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['userName'],
          required: false,
        },
        {
          model: ProjectInformation,
          as: 'projectName',
          attributes: ['projectName'],
        },
        {
          model: DsrQuery,
          as: 'queries',
          attributes: ['query', 'createdAt'],
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: Employee,
              as: 'displayName',
              attributes: ['userName'],
              where: { userId: { [Op.col]: 'queries.userId' } },
            },
          ],
        },
      ],
      order: [['workingDate', 'DESC']],
    })

    // Sorting queries within each allTask entry
    allTask = allTask.map((task) => {
      task.queries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      return task
    })
    const tasksByDate = {}
    allTask.forEach((dsr) => {
      if (!tasksByDate[dsr.workingDate]) {
        tasksByDate[dsr.workingDate] = []
      }
      tasksByDate[dsr.workingDate].push(dsr)
    })
    allEmployeeDsrList.forEach((dsr) => {
      dsr.dataValues.tasks = tasksByDate[dsr.workingDate] || []
    })

    const totalCount = await EmployeeDsr.findAll({
      attributes: [
        'workingDate',
        [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
      ],
      where: whereClause,
      order: [['workingDate', 'DESC']],
      group: ['workingDate'],
    })

    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: { dsrList: allEmployeeDsrList, totalCount: totalCount?.length },
    })

    logger.info({
      controller: 'employeeDsrController',
      method: 'AllgetEmployeeDsr',
      empId: `userId${userId}`,
      msg: 'AllemployeeDsr data ',
    })
  } catch (error) {
    logger.error({
      controller: 'employeeDsrController',
      method: 'getAllEmployeeDsr',
      empId: `userId${userId}`,
      msg: `Catch error: ${error.message || 'Unknown error'}`,
    })
    res
      .status(HttpStatusCode?.BAD_REQUEST)
      .json({ message: error?.message || 'Unknown error occurred' })
  }
}
// const getAllEmployeeDsr = async (req, res) => {
//   const userId = getRequestUserId(req)
//   const {
//     skip = 0,
//     limit = 10,
//     searchText = null,
//     startDate = null,
//     endDate = null,
//     searchedEmployee = null,
//   } = req.query

//   let whereClause = {}

//   if (searchText) {
//     whereClause.taskDetail = { [Op.like]: `%${searchText}%` }
//   }
//   if (startDate && endDate) {
//     whereClause.workingDate = { [Op.between]: [startDate, endDate] }
//   }
//   if (searchedEmployee) {
//     whereClause.userId = searchedEmployee
//   }

//   try {
//     if (!userId) {
//       throw new BadRequest()
//     }

//     const allEmployeeDsrList = await EmployeeDsr.findAll({
//       attributes: [
//         'workingDate',
//         [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
//       ],
//       where: whereClause,
//       offset: parseInt(skip, 10),
//       limit: parseInt(limit - skip, 10),
//       order: [['workingDate', 'DESC']],
//       group: ['workingDate'],
//       raw: true,
//     })

//     const allTask = await EmployeeDsr.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Employee,
//           as: 'employee',
//           attributes: ['userName'],
//           required: false,
//         },
//         {
//           model: ProjectInformation,
//           as: 'projectName',
//           attributes: ['projectName'],
//         },
//         {
//           model: DsrQuery,
//           as: 'queries',
//           attributes: ['query', 'createdAt'],
//           order: [['createdAt', 'ASC']],
//           include: [
//             {
//               model: Employee,
//               as: 'displayName',
//               attributes: ['userName'],
//               where: { userId: { [Op.col]: 'queries.userId' } },
//             },
//           ],
//         },
//       ],
//       order: [['workingDate', 'DESC']],
//     })

//     // Create a map for quick lookup based on workingDate
//     const checkTaskAccDate = new Map()

//     for (const entry of allTask) {
//       const workingDate = entry.workingDate
//       if (!checkTaskAccDate.has(workingDate)) {
//         checkTaskAccDate.set(workingDate, [])
//       }
//       checkTaskAccDate.get(workingDate).push(entry)
//     }

//     // Merge the data from allTask into allEmpDsrList based on matching working date
//     for (const entry of allEmployeeDsrList) {
//       const workingDate = entry.workingDate
//       if (checkTaskAccDate.has(workingDate)) {
//         entry.tasks = checkTaskAccDate.get(workingDate)
//       }
//     }

//     const totalCount = await EmployeeDsr.findAll({
//       attributes: [
//         'workingDate',
//         [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
//       ],
//       where: whereClause,
//       order: [['workingDate', 'DESC']],
//       group: ['workingDate'], // Include other attributes in the group
//       raw: true,
//     })

//     res.status(HttpStatusCode.OK).json({
//       status: true,
//       message: 'success',
//       data: { dsrList: allEmployeeDsrList, totalCount: totalCount?.length },
//     })

//     logger.info({
//       controller: 'employeeDsrController',
//       method: 'AllgetEmployeeDsr',
//       empId: `userId${userId}`,
//       msg: 'AllemployeeDsr data ',
//     })
//   } catch (error) {
//     logger.error({
//       controller: 'employeeDsrController',
//       method: 'getAllEmployeeDsr',
//       empId: `userId${userId}`,
//       msg: `Catch error: ${error.message || 'Unknown error'}`,
//     })
//     res
//       .status(HttpStatusCode?.BAD_REQUEST)
//       .json({ message: error?.message || 'Unknown error occurred' })
//   }
// }

// for user
const getEmployeeDsr = async (req, res) => {
  const userId = getRequestUserId(req)

  try {
    if (!userId) {
      throw new BadRequest()
    }

    const { skip = 0, limit = 10, searchText = null, startDate = null, endDate = null } = req.query

    let whereCondition = { userId }

    if (searchText) {
      whereCondition.taskDetail = { [Op.like]: `%${searchText}%` }
    }

    if (startDate && endDate) {
      whereCondition.workingDate = { [Op.between]: [startDate, endDate] }
    }
    const employeeDsrList = await EmployeeDsr.findAll({
      attributes: [
        'workingDate',
        [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
      ],
      where: whereCondition,
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      order: [['workingDate', 'DESC']],
      group: ['workingDate'],
    })
    let allTask = await EmployeeDsr.findAll({
      where: whereCondition,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['userName'],
          required: false,
        },
        {
          model: ProjectInformation,
          as: 'projectName',
          attributes: ['projectName'],
        },
        {
          model: DsrQuery,
          as: 'queries',
          attributes: ['query', 'createdAt'],
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: Employee,
              as: 'displayName',
              attributes: ['userName'],
              where: { userId: { [Op.col]: 'queries.userId' } },
            },
          ],
        },
      ],
      order: [['workingDate', 'DESC']],
    })
    // Sorting queries within each allTask entry
    allTask = allTask.map((task) => {
      task.queries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      return task
    })
    const tasksByDate = {}
    allTask.forEach((dsr) => {
      if (!tasksByDate[dsr.workingDate]) {
        tasksByDate[dsr.workingDate] = []
      }
      tasksByDate[dsr.workingDate].push(dsr)
    })
    employeeDsrList.forEach((dsr) => {
      dsr.dataValues.tasks = tasksByDate[dsr.workingDate] || []
    })
    const totalCount = await EmployeeDsr.findAll({
      attributes: [
        'workingDate',
        [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
      ],
      where: whereCondition,
      order: [['workingDate', 'DESC']],
      group: ['workingDate'],
    })
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: {
        dsrList: employeeDsrList,
        totalCount: totalCount?.length,
      },
    })

    logger.info({
      controller: 'employeeDsrController',
      method: 'getEmployeeDsr',
      empId: `userId${userId}`,
      msg: 'employeeDsr data',
    })
  } catch (error) {
    logger.error({
      controller: 'employeeDsrController',
      method: 'getEmployeeDsr',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.message || 'Unknown error'}`,
    })

    res
      .status(HttpStatusCode.BAD_REQUEST)
      .json({ message: error?.message || 'Unknown error occurred' })
  }
}

// const getEmployeeDsr = async (req, res) => {
//   const userId = getRequestUserId(req)

//   try {
//     if (!userId) {
//       throw new BadRequest()
//     }

//     const { skip = 0, limit = 10, searchText = null, startDate = null, endDate = null } = req.query

//     let whereCondition = { userId }

//     if (searchText) {
//       whereCondition.taskDetail = { [Op.like]: `%${searchText}%` }
//     }

//     if (startDate && endDate) {
//       whereCondition.workingDate = { [Op.between]: [startDate, endDate] }
//     }
//     const employeeDsrList = await EmployeeDsr.findAll({
//       attributes: [
//         'workingDate',
//         [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
//       ],
//       where: whereCondition,
//       offset: parseInt(skip, 10),
//       limit: parseInt(limit - skip, 10),
//       order: [['workingDate', 'DESC']],
//       group: ['workingDate'], // Include other attributes in the group
//       raw: true,
//     })

//     const allTask = await EmployeeDsr.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: Employee,
//           as: 'employee',
//           attributes: ['userName'],
//           required: false,
//         },
//         {
//           model: ProjectInformation,
//           as: 'projectName',
//           attributes: ['projectName'],
//         },
//         {
//           model: DsrQuery,
//           as: 'queries',
//           attributes: ['query', 'createdAt'],
//           order: [['createdAt', 'ASC']],
//           include: [
//             {
//               model: Employee,
//               as: 'displayName',
//               attributes: ['userName'],
//               where: { userId: { [Op.col]: 'queries.userId' } },
//             },
//           ],
//         },
//       ],
//       order: [['workingDate', 'DESC']],
//     })

//     const checkTaskAccDate = new Map()

//     for (const entry of allTask) {
//       const workingDate = entry.workingDate
//       if (!checkTaskAccDate.has(workingDate)) {
//         checkTaskAccDate.set(workingDate, [])
//       }
//       checkTaskAccDate.get(workingDate).push(entry)
//     }

//     for (const entry of employeeDsrList) {
//       const workingDate = entry.workingDate
//       if (checkTaskAccDate.has(workingDate)) {
//         entry.tasks = checkTaskAccDate.get(workingDate)
//       }
//     }

//     const totalCount = await EmployeeDsr.findAll({
//       attributes: [
//         'workingDate',
//         [Sequelize.fn('SUM', Sequelize.col('workingHours')), 'totalWorkingHours'],
//       ],
//       where: whereCondition,
//       order: [['workingDate', 'DESC']],
//       group: ['workingDate'], // Include other attributes in the group
//       raw: true,
//     })
//     if (employeeDsrList) {
//       res.status(HttpStatusCode.OK).json({
//         status: true,
//         message: 'success',
//         data: {
//           dsrList: employeeDsrList,
//           totalCount: totalCount?.length,
//           allTask,
//         },
//       })

//       logger.info({
//         controller: 'employeeDsrController',
//         method: 'getEmployeeDsr',
//         empId: `userId${userId}`,
//         msg: 'employeeDsr data',
//       })
//     }
//   } catch (error) {
//     logger.error({
//       controller: 'employeeDsrController',
//       method: 'getEmployeeDsr',
//       empId: `userId${userId}`,
//       msg: `Catch error: ${error?.message || 'Unknown error'}`,
//     })

//     res
//       .status(HttpStatusCode.BAD_REQUEST)
//       .json({ message: error?.message || 'Unknown error occurred' })
//   }
// }

const getEmployeeDsrAccDate = async (req, res) => {
  const userId = getRequestUserId(req)
  const { workingDate } = req.query

  try {
    if (!userId) {
      throw new BadRequest()
    }

    const tasks = await EmployeeDsr.findAll({
      where: {
        userId,
        workingDate: new Date(workingDate),
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['userName'],
          required: false,
        },
        {
          model: ProjectInformation,
          as: 'projectName',
          attributes: ['projectName'],
        },
      ],
      order: [['workingDate', 'DESC']],
    })
    const newDsrTasks = []

    tasks.forEach((task) => {
      const existingProject = newDsrTasks.find(
        (project) =>
          project.projectId === task.projectId && project.workingDate === task.workingDate,
      )
      if (!existingProject) {
        newDsrTasks.push({
          projectId: task.projectId,
          workingDate: task.workingDate,
          tasks: [
            {
              taskDetails: task.taskDetail,
              id: task.id,
              taskStatus: task.taskStatus,
              workingHours: convertTotalMinutesToHours(task.workingHours),
              minutes: convertTotalMinutesToMinutes(task.workingHours),
            },
          ],
        })
      } else {
        existingProject.tasks.push({
          taskDetails: task.taskDetail,
          id: task.id,
          taskStatus: task.taskStatus,
          workingHours: convertTotalMinutesToHours(task.workingHours),
          minutes: convertTotalMinutesToMinutes(task.workingHours),
        })
      }
    })

    if (newDsrTasks) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: {
          taskList: newDsrTasks,
        },
      })

      logger.info({
        controller: 'employeeDsrController',
        method: 'getEmployeeDsr',
        empId: `userId${userId}`,
        msg: 'employeeDsr data',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'employeeDsrController',
      method: 'getEmployeeDsr',
      empId: `userId${userId}`,
      msg: `Catch error: ${error?.message || 'Unknown error'}`,
    })

    res
      .status(HttpStatusCode.BAD_REQUEST)
      .json({ message: error?.message || 'Unknown error occurred' })
  }
}
const getSingleEmployeeDsr = async (req, res) => {
  const { id, empId } = req.query
  try {
    if (!id || !empId) {
      throw new BadRequest()
    }
    const isEmployeeExists = await EmployeeDsr.findOne({
      where: {
        id,
      },
    })
    if (isEmpty(isEmployeeExists)) {
      throw new NotFound()
    }
    res.status(HttpStatusCode.OK).send({
      status: true,
      data: isEmployeeExists,
      message: 'success',
    })
    logger.info(
      {
        controller: 'employeeDsrController',
        method: 'getSingleEmployeeDsr',
      },
      {
        empId: `employeeId${empId}`,
        msg: `EmployeeDsr data${empId}`,
      },
    )
  } catch (error) {
    logger.error({
      controller: 'employeeDsrController',
      method: 'getSingleEmployeeDsr',
      empId: `employId: ${empId}`,
      msg: `Catch error:${error?.msg}`,
    })
    res.status(HttpStatusCode?.BAD_REQUEST).json({ message: "user doesn't exist" })
  }
}

const updateEmployeeDsr = async (req, res) => {
  const { id, empId, projectId, workingDate, workingHours, taskDetail, taskStatus, taskMinutes } =
    req.body
  try {
    if (
      !id ||
      !empId ||
      !projectId ||
      !workingDate ||
      !workingHours ||
      !taskDetail ||
      !taskStatus ||
      !taskMinutes
    ) {
      throw new BadRequest()
    }
    const getUpdateEmployee = await EmployeeDsr.findOne({
      where: {
        id,
      },
    })
    if (isEmpty(getUpdateEmployee)) {
      throw new NotFound()
    }
    const isUpdated = await EmployeeDsr.update(
      {
        empId,
        projectId,
        workingDate,
        workingHours,
        taskDetail,
        taskStatus,
        taskMinutes,
        updatedBy: '1',
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
      message: 'updated successfully',
      data: isUpdated,
    })
    logger.info(
      {
        controller: 'employeeDsrController',
        method: 'updateEmployeeDsr',
      },
      {
        payload: isUpdated,
        msg: `EmployeeDsr updated,employeeId: ${empId}`,
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'employeeDsrController',
        method: 'updateEmployeeDsr',
      },
      {
        empId: `employeeId:${empId}`,
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
  employeeDsr,
  getEmployeeDsr,
  getSingleEmployeeDsr,
  updateEmployeeDsr,
  getAllEmployeeDsr,
  getEmployeeDsrAccDate,
  addQuery,
}
