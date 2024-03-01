/* eslint-disable no-await-in-loop */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const db = require('../models/index')
const { getRequestUserId } = require('../../helper')
const { MessageTag } = require('../../enums/messageNums')
const { logger } = require('../../helper/logger')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { Op } = require('sequelize')
const { isEmpty } = require('lodash')
const GlobalType = db.globalType
const ModulePermissions = db.modulePermissions

const addModulePermissions = async (req, res) => {
  const { moduleId, permissionsIds } = req.body
  try {
    if (!moduleId || !permissionsIds) {
      throw new Error(MessageTag.ALL_REQ)
    }
    const modulePermissionsExists = await ModulePermissions.findAll({
      where: { moduleId },
    })
    let isCreated
    if (isEmpty(modulePermissionsExists)) {
      for (let i = 0; i < permissionsIds.length; i++) {
        isCreated = await ModulePermissions.create({
          moduleId,
          permissions: permissionsIds[i],
          createdBy: getRequestUserId(req),
          createdAt: new Date(),
        })
      }
    }
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: isCreated,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'modulePermissionController',
      method: 'modulePermission',
      payload: isCreated,
      msg: 'modulePermission added',
    })
  } catch (error) {
    logger.error({
      controller: 'modulePermissionController',
      method: 'modulePermission',
      msg: 'error in modulePermission',
    })
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      status: error?.isOperational || false,
      message: error?.message,
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    })
  }
}
const updateModulePermissions = async (req, res) => {
  const { moduleId, permissionsIds } = req.body

  try {
    if (!moduleId || !permissionsIds) {
      throw new Error(MessageTag.ALL_REQ)
    }
    const modulePermissions = await ModulePermissions.findAll({
      attributes: ['permissions'],
      where: { moduleId },
    })

    let existsPermissions = []
    modulePermissions.forEach((item) => {
      existsPermissions.push(item.permissions)
    })
    const existsPermissionsArray = existsPermissions.map((str) => parseInt(str))

    // Remove permissions
    const removedPermissions = existsPermissionsArray.filter(
      (value) => !permissionsIds.includes(value),
    )
    if (removedPermissions) {
      for (let i = 0; i < removedPermissions.length; i++) {
        await ModulePermissions.destroy({
          where: {
            [Op.and]: [{ moduleId }, { permissions: removedPermissions[i] }],
          },
        })
      }
    }
    // Add new permissions
    const addedPermissions = permissionsIds.filter(
      (value) => !existsPermissionsArray.includes(value),
    )
    if (addedPermissions) {
      for (let i = 0; i < addedPermissions.length; i++) {
        await ModulePermissions.create({
          moduleId,
          permissions: addedPermissions[i],
          createdBy: getRequestUserId(req),
          createdAt: new Date(),
        })
      }
    }

    return res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      statusCode: HttpStatusCode?.OK,
    })
  } catch (error) {
    logger.error({
      controller: 'modulePermissionController',
      method: 'updateModulePermissions',
      msg: `error: ${error}`,
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
const getModulePermissions = async (req, res) => {
  try {
    const modulePermissions = await ModulePermissions.findAll({
      include: [
        {
          model: GlobalType,
          as: 'moduleInfo',
          attributes: ['displayName', 'uniqueValue'],
        },
        {
          model: GlobalType,
          as: 'permissionsInfo',
          attributes: ['displayName', 'uniqueValue'],
        },
      ],

      attributes: ['id', 'moduleId', 'permissions'],
    })

    const modulePermissionData = modulePermissions.reduce((accumulator, currentValue) => {
      const existingModule = accumulator.find(
        (module) => module.moduleInfo.moduleId === currentValue.moduleId,
      )

      if (existingModule) {
        existingModule.permissionsInfo.push({
          id: parseInt(currentValue.id),
          permissionId: parseInt(currentValue.permissions),
          displayName: currentValue.permissionsInfo.displayName,
          uniqueValue: currentValue.permissionsInfo.uniqueValue,
        })
      } else {
        accumulator.push({
          moduleInfo: {
            moduleId: currentValue.moduleId,
            displayName: currentValue.moduleInfo.displayName,
            uniqueValue: currentValue.moduleInfo.uniqueValue,
          },
          permissionsInfo: [
            {
              id: parseInt(currentValue.id),
              permissionId: parseInt(currentValue.permissions),
              displayName: currentValue.permissionsInfo.displayName,
              uniqueValue: currentValue.permissionsInfo.uniqueValue,
            },
          ],
        })
      }

      return accumulator
    }, [])

    if (modulePermissions?.length > 0) {
      res.status(HttpStatusCode.OK).send({
        status: true,
        data: modulePermissionData,
        statusCode: HttpStatusCode.OK,
      })
    } else {
      res.json({
        status: false,
        message: 'No record found',
        statusCode: HttpStatusCode.BAD_REQUEST,
      })
    }
  } catch (error) {
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
const getSingleModulePermission = async (req, res) => {
  const { moduleId } = req.query
  try {
    const modulePermissions = await ModulePermissions.findAll({
      include: [
        {
          model: GlobalType,
          as: 'moduleInfo',
          attributes: ['displayName', 'uniqueValue'],
        },
        {
          model: GlobalType,
          as: 'permissionsInfo',
          attributes: ['displayName', 'uniqueValue'],
        },
      ],
      where: {
        moduleId: moduleId, // Add where condition to filter by moduleId
      },
      attributes: ['id', 'moduleId', 'permissions'],
    })

    const newArray = modulePermissions.reduce((accumulator, currentValue) => {
      const existingModule = accumulator.find(
        (module) => module.moduleInfo.moduleId === currentValue.moduleId,
      )

      if (existingModule) {
        existingModule.permissionsInfo.push({
          id: parseInt(currentValue.id),
          permissionId: parseInt(currentValue.permissions),
          displayName: currentValue.permissionsInfo.displayName,
          uniqueValue: currentValue.permissionsInfo.uniqueValue,
        })
      } else {
        accumulator.push({
          moduleInfo: {
            moduleId: currentValue.moduleId,
            displayName: currentValue.moduleInfo.displayName,
            uniqueValue: currentValue.moduleInfo.uniqueValue,
          },
          permissionsInfo: [
            {
              id: parseInt(currentValue.id),
              permissionId: parseInt(currentValue.permissions),
              displayName: currentValue.permissionsInfo.displayName,
              uniqueValue: currentValue.permissionsInfo.uniqueValue,
            },
          ],
        })
      }

      return accumulator
    }, [])

    if (modulePermissions.length > 0) {
      res.json({
        status: true,
        data: newArray,
        message: 'success',
      })
    } else {
      res.json({
        status: true,
        message: 'No record found',
      })
    }
    logger.info({
      controller: 'modulePermissionController',
      method: 'getSingleModulePermission',
      payload: `Requested employee: ${userId}`,
      msg: 'Permissions for requested employee',
    })
  } catch (error) {
    res.json({
      status: false,
      message: error,
    })
    logger.error(
      {
        controller: 'modulePermissionController',
        method: 'getSingleModulePermission',
      },
      {
        payload: `Requested employee :${userId}`,
        msg: `error:${error}`,
      },
    )    
  }
}

module.exports = {
  updateModulePermissions,
  getModulePermissions,
  addModulePermissions,
  getSingleModulePermission,
}
