const { isEmpty } = require('lodash')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const { MessageTag, BooleanEnums } = require('../../enums/messageNums')
const db = require('../models/index')
const { Op } = require('sequelize')
const { UserRole } = require('../../enums/messageNums')
const { UserRoleEnums } = require('../../enums/userRoleEnums')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { APIError, BadRequest, NotFound } = require('../../helper/apiErrors')
const { logger } = require('../../helper/logger')
const { getRequestUserId, getRequestUserDepInfo, empAttribute } = require('../../helper')
const { asyncMiddleware } = require('../middleware/async-middleware')
// const { RoleEnums } = require('../../enums/messageNums')

const Employee = db.employee
const Trainee = db.traineeDetails
const GlobalType = db.globalType
const Media = db.media
const ProjectsAssigned = db.projectAssigned
const ProjectInformation = db.projectInformation

const getListOfEmployees = asyncMiddleware(async (req, res) => {
  const { skip = 0, limit = 0, userRole } = req.query
  const userDepartment = getRequestUserDepInfo(req)
  const userId = getRequestUserId(req)

  let whereCondition
  if (userDepartment?.isConcernPerson === BooleanEnums.YES) {
    whereCondition = {
      depId: userDepartment?.depId,
      isDeleted: 0,
    }
  } else {
    whereCondition = {
      isDeleted: 0,
    }
  }
  if (userRole == 138) {
    whereCondition = {
      userRole: userRole,
    }
  }

  try {
    const employee = await Employee.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      where: {
        ...whereCondition,
        userRole: {
          [Op.ne]: UserRole.SUPER_ADMIN,
        },
        isActive: 1,
      },
      include: [
        {
          model: Media,
          as: 'documents',
          where: {
            mediaType: {
              [Op.not]: 'Image',
            },
          },
          attributes: ['id', 'mediaType', 'mediaLink'],
          required: false,
        },
      ],
      attributes: empAttribute,
      order: [['userId', 'DESC']],
    })
    const totalEmpCount = await Employee.findAll({
      where: {
        ...whereCondition,
        isActive: 1,
        userRole: {
          [Op.ne]: UserRole.SUPER_ADMIN,
        },
      },
      attributes: empAttribute,
    })
    const isPo = await ProjectsAssigned.findOne({
      where: {
        userId: userId,
        isRemove: 0,
        employeeProjectRole: 'project_owner',
      },
    })
    const projectIds = await ProjectsAssigned.findAll({
      where: { userId, isRemove:0, employeeProjectRole: 'project_owner' },
      attributes: ['projectId'],
      raw: true,
    })

    const activeProjectsId = await ProjectInformation.findAll({
      where: {
        projectId: projectIds.map((item) => item.projectId),
        projectStatus: {
          [Op.not]: [3, 4],
        },
      },
      attributes: ['projectId'],
      raw: true,
    })
    const team = await ProjectsAssigned.findAll({
      where: {
        isRemove:0,
        employeeProjectRole: {
          [Op.ne]: 'project_owner',
        },
        projectId: activeProjectsId.map((item) => item.projectId),
      },
      attributes: ['userId'],
      raw: true,
    })
    let EmpUnderPo = []

    EmpUnderPo = await Employee.findAll({
      where: {
        isActive: 1,
        userId: team.map((item) => item.userId),
      },
      attributes: ['userName', 'userId'],
      raw: true,
    })

    const poData = await Employee.findOne({
      where: {
        userId: getRequestUserId(req),
      },
      attributes: ['userId', 'userName'],
      raw: true,
    })

    EmpUnderPo.push({ userName: poData.userName, userId: poData.userId })

    if (
      employee &&
      limit == 0 &&
      (req.user?.userRole === UserRoleEnums?.HR ||
        req.user?.userRole === UserRoleEnums?.SUPER_ADMIN)
    ) {
      res.status(200).json({
        status: true,
        data: { employee: totalEmpCount, totalCount: totalEmpCount?.length },
        message: 'success',
      })
    } else if (employee && limit == 0 && isPo !== null && poData) {
      res.status(200).json({
        status: true,
        data: { employee: EmpUnderPo, totalCount: EmpUnderPo?.length },
        message: 'success',
      })
    } else {
      res.status(200).json({
        status: true,
        data: { employee, totalCount: totalEmpCount?.length },
        message: 'success',
      })
    }
    // old code
    // if (employee) {
    //   if (limit == 0) {
    //     if (
    //       req.user?.userRole === UserRoleEnums?.HR ||
    //       req.user?.userRole === UserRoleEnums?.SUPER_ADMIN
    //     ) {
    //       res.status(200).json({
    //         status: true,
    //         data: { employee: totalEmpCount, totalCount: totalEmpCount?.length },
    //         message: 'success',
    //       })
    //     } else if (isPo !== null && poData) {
    //       res.status(200).json({
    //         status: true,
    //         data: { employee: EmpUnderPo, totalCount: EmpUnderPo?.length },
    //         message: 'success',
    //       })
    //     } else {
    //       res.status(200).json({
    //         status: true,
    //         data: { employee, totalCount: totalEmpCount?.length },
    //         message: 'success',
    //       })
    //     }
    //   } else {
    //     res.status(200).json({
    //       status: true,
    //       data: { employee, totalCount: totalEmpCount?.length },
    //       message: 'success',
    //     })
    //   }

    //   logger.info({
    //     controller: 'employeeController',
    //     method: 'getListOfEmployees',
    //     payload: `Requested employee: ${userName} and employee id :${empId}`,
    //     msg: 'employees records successfully fetched',
    //   })
    // }
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error,
    })
    logger.error({
      controller: 'employeeController',
      method: 'getListOfEmployees',
      payload: `Requested employee: ${req.user?.userName || 'N/A'} and employee id :${req.user?.empId || 'N/A'}`,
      msg: `error:${error}`,
    })
  }
})
// Filter Employee

const filterEmployee = asyncMiddleware(async (req, res) => {
  const { skip = 0, limit = 10, employeeName } = req.query

  try {
    const employee = await Employee.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      include: [
        {
          model: Media,
          as: 'documents',
          where: {
            mediaType: {
              [Op.not]: 'Image',
            },
          },
          attributes: ['id', 'mediaType', 'mediaLink'],
        },
      ],
      where: {
        userRole: {
          [Op.ne]: UserRole.SUPER_ADMIN,
        },
        [Op.or]: [
          {
            userName: {
              [Op.like]: `%${employeeName}%`,
            },
          },
          {
            userEmail: {
              [Op.like]: `%${employeeName}%`,
            },
          },
        ],
        isActive: 1,
      },
      attributes: empAttribute,
    })
    const totalEmpCount = await Employee.findAll({
      where: {
        [Op.or]: [
          {
            userName: {
              [Op.like]: `%${employeeName}%`,
            },
          },
          {
            userPersonalEmail: {
              [Op.like]: `%${employeeName}%`,
            },
          },
        ],
      },
      attributes: empAttribute,
    })
    if (employee) {
      res.status(200).json({
        status: true,
        data: { employee, totalCount: totalEmpCount?.length },
        message: 'success',
      })
      logger.info({
        controller: 'employeeController',
        method: 'filterEmployee',
        // payload: ``,
        msg: 'filtered employee',
      })
    }
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error,
    })
    logger.error(
      {
        controller: 'employeeController',
        method: 'filterEmployee',
      },
      {
        // payload: `Requested employee: ${userName} and employee id :${empId}`,
        msg: `error:${error}`,
      },
    )
  }
})
const updateEmployeeData = async (req, res) => {
  const {
    userId,
    empId,
    userName,
    userProcess,
    userPersonalEmail,
    empEmail,
    userPassword,
    userDesignation,
    userRole,
    userProfileImg,
    empMobileNumber,
    // empDob,
    userBirthday,
    empJoinDate,
    // empSal,
    empSalary,
    empCurrentAddress,
    empPermanentAddress,
    isActive,
    depId,
    isConcernPerson,
    userFatherName,
    userMotherName,
  } = req.body

  try {
    if (!userId) {
      logger.error(
        {
          controller: 'employeeController',
          method: 'updateEmployeeData',
        },
        {
          payload: `Requested employee: ${userName} and employee id :${empId}`,
          msg: 'Bad request by the client',
        },
      )
      throw new BadRequest()
    }
    const isExists = await Employee.findAll({
      where: {
        userId,
        isActive: 1,
      },
      attributes: empAttribute,
    })

    if (isEmpty(isExists)) {
      logger.error(
        {
          controller: 'employeeController',
          method: 'updateEmployeeData',
        },
        {
          payload: `Requested employee: ${userName} and employee id :${empId}`,
          msg: 'User not found',
        },
      )
      throw new NotFound(null, null, null, 'User not found')
    }

    const isUpdated = await Employee.update(
      {
        empId,
        isConcernPerson: isConcernPerson ? 1 : 0,
        depId,
        userPersonalEmail,
        userEmail: empEmail,
        userPassword,
        userDesignation,
        userName,
        userRole,
        userProcess,
        userProfileImg: userProfileImg ? JSON.stringify(userProfileImg) : null,
        empMobileNumber,
        userBirthday,
        empJoinDate,
        empSalary,
        empCurrentAddress,
        empPermanentAddress,
        userFatherName,
        userMotherName,
        updatedAt: new Date(),
        updatedBy: getRequestUserId(req),
        isActive,
      },
      {
        where: {
          userId,
        },
        returning: true,
      },
    )
    if (empJoinDate) {
      logger.info({
        controller: 'employeeController',
        method: 'updateEmployeeData',
        payload: `Requested employee: ${userName} and employee id :${empId}`,
        msg: 'Trainee Joining date updated successfully',
      })
      await Trainee.update(
        {
          traineeJoiningDate: empJoinDate,
          updatedAt: new Date(),
          updatedBy: getRequestUserId(req),
        },
        {
          where: {
            userId,
          },
          returning: true,
        },
      )
    }
    let updatedUser = []
    updatedUser = await Employee.findOne({
      where: {
        userId,
      },
    })
    if (!isEmpty(isUpdated)) {
      res.status(200).json({
        status: true,
        message: 'success',
        data: updatedUser,
      })
      logger.info({
        controller: 'employeeController',
        method: 'updateEmployeeData',
        payload: `Requested employee: ${userName} and employee id :${empId}`,
        msg: 'Record updated successfully',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'employeeController',
      method: 'updateEmployeeData',
      payload: `Requested employee: ${userName} and employee id :${empId}`,
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

const addNewEmployee = asyncMiddleware(async (req, res) => {
  //Point 1 : HERE WE SHOULD BE HAVING SAME FIELDS FOR BOTH FRONTEND AND BACKEND
  const {
    empID,
    empName,
    empPersonalEmail,
    empPassword,
    empEmail,
    empDesignation,
    userRole,
    userProcess,
    empProfileImage,
    empMobileNumber,
    empDob,
    empJoinDate,
    empSal,
    empCurrentAddress,
    empPermanentAddress,
    depId,
  } = req.body
  if (
    !empID ||
    !empName ||
    !empPassword ||
    !empEmail ||
    !empDesignation ||
    !userRole ||
    !empMobileNumber ||
    !empCurrentAddress ||
    !empPermanentAddress
  ) {
    throw new BadRequest()
  }
  const isEmpIdExists = await Employee.findAll({
    where: {
      empId: empID,
      isActive: 1,
    },
    attributes: empAttribute,
  })
  if (!isEmpty(isEmpIdExists)) {
    throw new APIError('Conflict', HttpStatusCode.CONFLICT, false, MessageTag.EMPLOYEE_ID_EXISTS)
  }
  const salt = bcrypt.genSaltSync(10)
  // Generate a new UUID value
  const newUuid = uuidv4()
  const hashedPassword = bcrypt.hashSync(empPassword, salt)
  const isCreated = await Employee.create({
    empId: empID,
    tenantId: newUuid,
    userPersonalEmail: empPersonalEmail,
    userPassword: hashedPassword,
    userDesignation: empDesignation,
    userName: empName,
    userRole,
    userProcess,
    depId,
    userEmail: empEmail,
    userProfileImage: empProfileImage,
    empMobileNumber,
    userBirthday: empDob,
    empJoinDate,
    empSalary: empSal,
    empCurrentAddress,
    empPermanentAddress,
    createdAt: new Date(),
    createdBy: getRequestUserId(req),
    isActive: 1,
  })
  const getRoleValue = await GlobalType.findOne({
    where: {
      id: userRole,
    },
  })

  if (getRoleValue?.uniqueValue == 'trainee') {
    await Trainee.create({
      userId: isCreated?.userId,
      traineeJoiningDate: empJoinDate,
      status: 0,
      createdAt: new Date(),
      createdBy: getRequestUserId(req),
    })
  }

  /* IF WE HAVE SAME FIELD FOR BOTH FE AND BE THEN WE DON'T NEED LINES FROM 219 TO 234. 
  INSTEAD OF THIS WE SIMPLY CAN PASS OBJECT HERE */
  // Let me know if you added it purposly

  if (!isEmpty(isCreated)) {
    res.status(200).json({
      status: true,
      message: 'success',
      data: isCreated,
      statusCode: HttpStatusCode.OK,
    })
    logger.info(
      {
        controller: 'employeeController',
        method: 'addNewEmployee',
      },
      {
        payload: isCreated,
        msg: 'Employee is added',
      },
    )
  }
})

const deleteEmployee = asyncMiddleware(async (req, res) => {
  const { empId, userId } = req.params
  if (!empId || !userId) {
    throw new BadRequest()
  }

  const isEmpIdExists = await Employee.findAll({
    where: {
      empId,
      userId: parseInt(userId, 10),
      isDeleted: 0,
    },
    attributes: empAttribute,
  })
  if (isEmpty(isEmpIdExists)) {
    logger.error(
      {
        controller: 'employeeController',
        method: 'deleteEmployee',
      },
      {
        msg: 'Employee not found',
      },
    )
    throw new NotFound()
  }

  const isDeleted = await Employee.update(
    {
      isDeleted: 1,
      isActive: 0,
      updatedBy: getRequestUserId(req),
      updatedAt: new Date(),
    },
    {
      where: {
        userId: parseInt(userId, 10),
        empID: empId,
      },
      returning: true,
    },
  )
  if (!isEmpty(isDeleted)) {
    res.status(200).json({
      status: true,
      message: 'success',
      data: isDeleted[1][0],
      statusCode: HttpStatusCode.OK,
    })
    logger.info(
      {
        controller: 'employeeController',
        method: 'deleteEmployee',
      },
      {
        // payload: `Requested employee: ${userName} and employee id :${empId}`,
        msg: 'Requested employee is deleted',
      },
    )
  }
})
const getNewEmpId = asyncMiddleware(async (req, res) => {
  const lastRecord = await Employee.findOne({
    order: [['userId', 'DESC']],
  })
  if (isEmpty(lastRecord)) {
    throw new NotFound()
  }
  const { empId } = lastRecord
  const newEmpId = `VVT-${(parseInt(empId.split('-')[1], 10) + 1).toString().padStart(3, '0')}`
  res.status(200).json({
    status: true,
    message: 'success',
    data: newEmpId,
    statusCode: HttpStatusCode.OK,
  })
  logger.info({
    controller: 'employeeController',
    method: 'getNewEmpId',
    payload: null,
    msg: 'Record fetch and sent successfully',
  })
})

module.exports = {
  getListOfEmployees,
  updateEmployeeData,
  addNewEmployee,
  deleteEmployee,
  getNewEmpId,
  filterEmployee,
}
