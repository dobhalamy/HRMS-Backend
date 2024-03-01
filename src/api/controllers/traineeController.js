const { isEmpty } = require('lodash')
const { RoleEnums, MessageTag, UserRole } = require('../../enums/messageNums')
const db = require('../models/index')
const { Op } = require('sequelize')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const { logger } = require('../../helper/logger')
const {
  getRequestUserId,
  empAttribute,
  getRequestUserRole,
  localToUTC,
  getRequestUserDepInfo,
} = require('../../helper')
const { asyncMiddleware } = require('../middleware/async-middleware')
const {
  TRAINEE,
  TRAINER_ASSIGN,
  HANDOVER_TO_MANAGER,
  TRAINING_COMPLETE,
} = require('../../enums/traineeStatusNums')
const trainingHistory = require('../models/trainingHistory')

const Employee = db.employee
const Trainee = db.traineeDetails
const TraineeHistory = db.traineeHistory
// const GlobalType = db.globalType

const getListOfTrainees = asyncMiddleware(async (req, res) => {
  const { status = 0, skip = 0, limit = 0, employeeName = null } = req.query
  const userRole = getRequestUserRole(req)
  const userId = getRequestUserId(req)
  const userDept = getRequestUserDepInfo(req)

  let traineeWhereCondition = {}
  let empWhereCondition = {}
  if (userRole == RoleEnums?.HR) {
    traineeWhereCondition.status = TRAINEE
  } else if (userRole == RoleEnums?.MANAGER) {
    if (status === '2' || status === '0') {
      traineeWhereCondition.status = HANDOVER_TO_MANAGER
      empWhereCondition = {
        [Op.or]: {
          depId: {
            [Op.like]: `%${userDept?.depId}%`,
          },
        },
      }
    } else {
      traineeWhereCondition.status = TRAINING_COMPLETE
      empWhereCondition = {
        [Op.or]: {
          depId: {
            [Op.like]: `%${userDept?.depId}%`,
          },
        },
      }
    }
  } else if (userRole == RoleEnums?.TRAINER) {
    traineeWhereCondition.status = TRAINER_ASSIGN
    traineeWhereCondition.trainerId = userId
    // } else if (userRole == RoleEnums?.TRAINEE ) {
    //   traineeWhereCondition.status = TRAINER_ASSIGN
    //   traineeWhereCondition.userId = userId
  } else {
    traineeWhereCondition.status = TRAINEE
  }
  if (employeeName) {
    empWhereCondition = {
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
    }
  }
  try {
    const empAttribute = ['userId', 'empId', 'depId', 'userName', 'userPersonalEmail', 'userRole']
    let trainees = []
    let totalEmpCount = []
    if (userRole == RoleEnums?.HR || userRole == RoleEnums?.SUPERADMIN) {
      trainees = await Employee.findAll({
        include: [
          {
            model: Trainee,
            where: Object.keys(traineeWhereCondition).length > 0 ? traineeWhereCondition : null,
          },
        ],
        where: {
          [Op.and]: [{ userRole: UserRole.TRAINEE }, empWhereCondition],
        },
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        attributes: empAttribute,
        order: [['userId', 'DESC']],
      })
      totalEmpCount = await Employee.findAll({
        include: [
          {
            model: Trainee,
            where: Object.keys(traineeWhereCondition).length > 0 ? traineeWhereCondition : null,
          },
        ],
        where: {
          [Op.and]: [{ userRole: UserRole.TRAINEE }, empWhereCondition],
        },
        attributes: empAttribute,
      })
    } else {
      trainees = await Employee.findAll({
        include: [
          {
            model: Trainee,
            where: Object.keys(traineeWhereCondition).length > 0 ? traineeWhereCondition : null,
          },
        ],
        where: empWhereCondition,
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        attributes: empAttribute,
        order: [['userId', 'DESC']],
      })
      totalEmpCount = await Employee.findAll({
        include: [
          {
            model: Trainee,
            where: Object.keys(traineeWhereCondition).length > 0 ? traineeWhereCondition : null,
          },
        ],
        attributes: empAttribute,
      })
    }

    const updatedTrainees = await Promise.all(
      trainees.map(async (item) => {
        const depId = item?.depId

        let globalType = await Employee.findAll({
          where: { depId, userRole: UserRole.TRAINER },
          attributes: empAttribute,
        })
        item.dataValues.trainerList = globalType
        let trainerDetails = await Employee.findOne({
          where: { userId: item?.Trainee?.trainerId },
          attributes: empAttribute,
        })
        item.dataValues.trainerDetails = trainerDetails

        let tlList = await Employee.findAll({
          where: { depId, userRole: UserRole.TL },
          attributes: ['userId', 'userName', 'depId', 'userRole', 'userProcess'],
          order: [['userId', 'DESC']],
        })

        item.dataValues.tlList = tlList
        let managerList = await Employee.findAll({
          where: { depId, userRole: UserRole.MANAGER },
          attributes: ['userId', 'userName', 'depId', 'userRole', 'userProcess'],
          order: [['userId', 'DESC']],
        })

        item.dataValues.managerList = managerList
        let amList = await Employee.findAll({
          where: { depId, userRole: UserRole.ASSISTANT_MANAGER },
          attributes: ['userId', 'userName', 'depId', 'userRole', 'userProcess'],
          order: [['userId', 'DESC']],
        })

        item.dataValues.amList = amList

        return item
      }),
    )
    if (trainees) {
      res.status(200).json({
        status: true,
        data: { trainees: updatedTrainees, totalCount: totalEmpCount?.length },
        message: 'success',
      })
    }
    logger.info({
      controller: 'employeeController',
      method: 'getListOfTrainees',
      payload: null,
      msg: 'Record fetch and sent successfully',
    })
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error,
    })
    logger.info({
      controller: 'traineeController',
      method: 'getListOfTrainees',
      payload: null,
      error: error,
    })
  }
})

const assignTrainer = asyncMiddleware(async (req, res) => {
  const { id, userId } = req.params
  if (!id || !userId) {
    throw new BadRequest()
  }

  const isEmpIdExists = await Employee.findAll({
    where: {
      userId: parseInt(userId, 10),
      isDeleted: 0,
    },
    attributes: empAttribute,
  })
  if (isEmpty(isEmpIdExists)) {
    throw new NotFound()
  }

  const isAssigned = await Trainee.update(
    {
      trainerId: userId,
      status: 1,
      trainingHandoverDate: localToUTC(new Date()),
      updatedBy: getRequestUserId(req),
      updatedAt: new Date(),
    },
    {
      where: {
        id: id,
      },
      returning: true,
    },
  )
  const data = await Trainee.findOne({
    where: { id: id },
  })
  if (!isEmpty(isAssigned)) {
    res.status(200).json({
      status: true,
      message: 'success',
      data: data,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'traineeController',
      method: 'assigneTrainer',
      payload: `Assignment successful for userId: ${userId}`,
      msg: 'Trainer is assigned',
    })
  }
})

const updateTraineeData = async (req, res) => {
  let {
    userId,
    trainingStartDate,
    trainingEndDate,
    certificationDate,
    certificationStatus,
    reCertificationDate,
    reCertificationStatus,
    status,
    managerId,
    tlId,
    amId,
  } = req.body
  let trainingHandoverDate = req.body?.Trainee?.trainingHandoverDate
  try {
    if (!userId || !trainingStartDate || !trainingEndDate) {
      logger.error(
        {
          controller: 'traineeController',
          method: 'updateTraineeData',
        },
        {
          payload: `Requested employee :${userId}`,
          msg: 'Bad request by the client',
        },
      )
      throw new BadRequest()
    }
    const isExists = await Employee.findAll({
      where: {
        userId,
      },
      attributes: empAttribute,
    })

    if (isEmpty(isExists)) {
      logger.error(
        {
          controller: 'traineeController',
          method: 'updateTraineeData',
        },
        {
          msg: 'User not found',
        },
      )
      throw new NotFound(null, null, null, 'User not found')
    }

    const isUpdated = await Trainee.update(
      {
        userId,
        trainingStartDate,
        trainingEndDate,
        certificationDate: certificationDate || null,
        certificationStatus,
        reCertificationDate,
        reCertificationStatus,
        status,
        managerId,
        tlId,
        amId,
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

    if (!isEmpty(isUpdated)) {
      if (
        (certificationDate && certificationStatus) ||
        (reCertificationDate && reCertificationStatus)
      ) {
        if (reCertificationDate && reCertificationStatus) {
          certificationDate = reCertificationDate
          certificationStatus = reCertificationStatus
        }

        await TraineeHistory.create({
          userId,
          startDate: trainingStartDate,
          endDate: trainingEndDate,
          certificationDate,
          certificationStatus,
          createdAt: new Date(),
          createdBy: getRequestUserId(req),
          trainingHandoverDate,
        })
      }
      res.status(200).json({
        status: true,
        message: 'success',
        data: isUpdated,
      })
      logger.info({
        controller: 'traineeController',
        method: 'updateEmployeeData',
        payload: `Requested employee: ${userId}`,
        msg: 'Record updated successfully',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'traineeController',
      method: 'updateEmployeeData',
      payload: `Requested employee: ${userId}`,
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

const updateTraineeStatus = async (req, res) => {
  let { id, status } = req.body
  try {
    if (!id || !status) {
      logger.error(
        {
          controller: 'traineeController',
          method: 'updateTraineeStatus',
        },
        {
          payload: `Requested trainee :${id}`,
          msg: 'Bad request by the client',
        },
      )
      throw new BadRequest()
    }
    const isExists = await Trainee.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ certificationStatus: 'certified' }, { reCertificationStatus: 'certified' }],
          },
          { id },
        ],
      },
    })

    if (isEmpty(isExists)) {
      logger.error(
        {
          controller: 'traineeController',
          method: 'updateTraineeStatus',
        },
        {
          msg: 'Trainee not found',
        },
      )
      res.status(HttpStatusCode.BAD_REQUEST).json({
        status: false,
        message: MessageTag.TRAINEE_NOT_FOUND,
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
      return
    }

    const isUpdated = await Trainee.update(
      {
        status,
        isCompleted: 1,
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

    if (!isEmpty(isUpdated)) {
      res.status(HttpStatusCode.OK).send({
        status: true,
        message: 'success',
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'traineeController',
        method: 'updateTraineeStatus',
        payload: `Requested trainee: ${id}`,
        msg: 'Record updated successfully',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'traineeController',
      method: 'updateTraineeStatus',
      payload: `Requested trainee: ${id}`,
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

const updateTrainerDetails = asyncMiddleware(async (req, res) => {
  const { userId, trainerId } = req.params
  if (!userId || !trainerId) {
    throw new BadRequest('Missing userId or trainerId')
  }

  try {
    // Check if the user exists
    const user = await Employee.findOne({
      where: { userId },
    })

    if (!user) {
      throw new NotFound('User not found')
    }
    // Check if the trainer exists
    const trainer = await Employee.findOne({
      where: { userId: trainerId },
    })
    if (!trainer) {
      throw new NotFound('Trainer not found')
    }

    // Update the trainerId in Trainee table
    const updateResult = await Trainee.update({ trainerId }, { where: { userId } })

    const traineeDetails = await Trainee.findOne({ where: { userId } })
    // Update fields
    const updateTraineeStatus = await Trainee.update(
      {
        status: 1,
        retraining: 1,
        trainingHandoverDate: localToUTC(new Date()),
        trainingStartDate: null,
        trainingEndDate: null,
        certificationStatus: null,
        certificationDate: null,
        isCompleted: null,
      },
      { where: { userId } },
    )

    if (updateResult[0] > 0 && updateTraineeStatus[0] > 0) {
      res.status(200).json({
        status: true,
        message: 'Trainer details updated successfully',
      })
      logger.info({
        controller: 'traineeController',
        method: 'updateTrainerDetails',
        payload: `Updated trainer details for employee: ${userId}`,
        msg: 'Trainer details updated successfully',
      })
    } else {
      throw new BadRequest('Failed to update trainer details')
    }
  } catch (error) {
    res.status(error?.httpCode || 400).json({
      status: false,
      message: error?.message || 'An error occurred',
    })
    logger.error({
      controller: 'traineeController',
      method: 'updateTrainerDetails',
      payload: `Updating trainer details for employee: ${userId}`,
      msg: `error:${error}`,
    })
  }
})

const getTraineeCertificationHistory = async (req, res) => {
  const { skip = 0, limit = 0, userId = null } = req.query
  logger.warn({
    controller: 'traineeController',
    method: 'getTraineeCertificationHistory',
    payload: null,
    msg: 'Get global type started',
  })

  try {
    if (userId) {
      const result = await TraineeHistory.findAll({
        where: {
          userId,
        },
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'ASC']],
      })
      const totalCount = await TraineeHistory.findAll({
        where: {
          userId,
        },
      })
      res.status(200).send({
        status: true,
        data: { traineeHistory: result, totalCount: totalCount?.length },
      })
    }
  } catch (error) {
    logger.error({
      controller: 'traineeController',
      method: 'getTraineeCertificationHistory',
      payload: null,
      msg: `Catch error: ${error?.message}`,
    })
    res.status(HttpStatusCode.NOT_ALLOWED).json({ status: false, error: error?.message })
  }
}

module.exports = {
  getListOfTrainees,
  assignTrainer,
  updateTraineeData,
  updateTraineeStatus,
  updateTrainerDetails,
  getTraineeCertificationHistory,
}
