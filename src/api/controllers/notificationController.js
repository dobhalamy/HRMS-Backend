/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { logger } = require('../../helper/logger')
const db = require('../models/index')
const { isEmpty } = require('lodash')
const { BadRequest,NotFound } = require('../../helper/apiErrors')

const Notification = db.notification
const Employee = db.employee

const saveNotification = async (req) => {
  const notification = req?.data
  try {
    if (!req || isEmpty(notification)) {
      throw new BadRequest()
    }

    let userId = null
    let createdBy = null
    if(req?.eventType === 'applyForLeave' || req?.eventType === 'exceptionRequest' || req?.eventType === 'happyToHelpAdded'){
      const userRoleHr = await Employee.findOne({
        where: {
          userRole: 134,
        },
        attributes: ['userId'],
      })
      userId = userRoleHr?.userId
    } else if(req?.eventType === 'traineeAssign'){
        userId = req?.data?.data?.userId
        createdBy = req?.data?.data?.createdBy
        const isCreated = await Notification.create({
          userId,
          notification: notification?.message[0],
          markAsRead: 0,
          createdBy: createdBy || req?.userId,
          createdAt: new Date(),
        }) 
        userId = req?.data?.data?.trainerId
        createdBy = req?.data?.data?.createdBy
        const isCreatedTrainer = await Notification.create({
          userId,
          notification: notification?.message[1],
          markAsRead: 0,
          createdBy: createdBy || req?.userId,
          createdAt: new Date(),
        })
      
        if (!isEmpty(isCreated) && !isEmpty(isCreatedTrainer)) {
          logger.info({
            controller: 'notificationController',
            method: 'saveNotification',
            payload: isCreated, isCreatedTrainer,
            msg: 'notification added',
          })
          return{
            status: true,
            message: 'success',
            data: [isCreated, isCreatedTrainer],
            statusCode: HttpStatusCode.OK,
          }
        }   
    } else{
      userId= req?.userId
      createdBy = req?.data?.data?.updatedBy || 60
    }  

    const isCreated = await Notification.create({
      userId,
      notification: notification?.message,
      markAsRead: 0,
      createdBy: createdBy || req?.userId,
      createdAt: new Date(),
    })

    if (!isEmpty(isCreated)) {         
      logger.info({
        controller: 'notificationController',
        method: 'saveNotification',
        payload: isCreated,
        msg: 'notification added',
      })
      return {
        status: true,
        message: 'success',
        data: isCreated,
        statusCode: HttpStatusCode.OK,
      }
    }
  } catch (error) {
    logger.error({
      controller: 'notificationController',
      method: 'saveNotification',
      empId: `userId${req?.userId}`,
      msg: `Catch error: ${error}`,
    })
    if (error) {
      return {
        status: error || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      }
    }
  }
}

const getNotification = async (req) => {
  try {
    const userId = req
    const notifications = await Notification.findAll({
      where: { userId: userId, markAsRead: 0 },
    })

    return {
      status: true,
      message: 'success',
      data: { notifications },
      statusCode: HttpStatusCode.OK,
    }
  } catch (error) {
    console.error('Error in getNotification:', error)
    return {
      status: false,
      message: 'Internal Server Error',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    }
  }
}


const readNotification = async(req, res) => {
  const { userId } = req.params 

  const isExists = await Notification.findAll({
    where: {userId: userId}
  })

  if (isEmpty(isExists)) {
    throw new NotFound(null, null, null, 'notification not found')
  }

  const markAsRead = 1
  const isUpdated = await Notification.update(
    {
      markAsRead,
    },
    {
      where: {
        userId:userId,
      },
      returning: true,
    },
  )
  res.status(HttpStatusCode.OK).json({
    status: true,
    message: 'success',
    data: { isUpdated },
    statusCode: HttpStatusCode.OK,
  })
}

module.exports = {
  saveNotification,
  getNotification,
  readNotification,
}
