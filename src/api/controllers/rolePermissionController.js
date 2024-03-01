/* eslint-disable no-await-in-loop */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const { isEmpty } = require('lodash')
const db = require('../models/index')
const { getRequestUserId } = require('../../helper')
const { MessageTag } = require('../../enums/messageNums')
const httpErrorCodes = require('../../enums/httpErrorCodes')
const { logger } = require('../../helper/logger')

const RolePermissions = db.roleAndPermissions

const addRoleAndPermissions = async (req, res) => {
  const roleAndPermissions = req?.body
  if (!isEmpty(roleAndPermissions)) {
    for (let i = 0; i < roleAndPermissions.length; i++) {
      const roleId = roleAndPermissions[i]?.nestedRoleId // nestedRoleId id role id in the table
      const moduleId = roleAndPermissions[i]?.moduleId
      const depId = roleAndPermissions[i]?.depId
      try {
        const isExists = await RolePermissions.findOne({
          where: { roleId, moduleId, depId },
        })

        const permissions = [...roleAndPermissions[i].permissions].join(',')
        if (isEmpty(isExists)) {
          await RolePermissions.create({
            moduleId,
            roleId,
            depId,
            permissions,
            createdBy: getRequestUserId(req),
            createdAt: new Date(),
          })
        } else {
          await RolePermissions.update(
            {
              permissions,
              updatedBy: getRequestUserId(req),
              updatedAt: new Date(),
            },
            {
              where: {
                roleId,
                moduleId,
                depId,
              },
            },
          )
        }
      } catch (error) {
        logger.error({
          controller: 'rolePermissionController',
          method: 'addRoleAndPermissions',
          msg: `Catch error: ${error?.message}`,
        })
        if (error?.httpCode) {
          res.status(error?.httpCode).json({
            status: error?.isOperational,
            message: error?.message,
            statusCode: error?.httpCode,
          })
        }
        res.status(httpErrorCodes.INTERNAL_SERVER).json({
          status: false,
          message: error?.message,
          statusCode: httpErrorCodes.INTERNAL_SERVER,
        })
      }
      if (i === roleAndPermissions.length - 1) {
        res.status(httpErrorCodes.OK).json({
          status: true,
          message: MessageTag?.ROLE_CREATED_UPDATED,
        })
      }
    }
  }
}
const getPermissionsByRoleId = async (req, res) => {
  const { nestedRoleId, depId } = req.query
  // nestedRoleId id role id in the table
  if (nestedRoleId && depId) {
    try {
      const permissionsByRoleId = await RolePermissions.findAll({
        where: { roleId: Number(nestedRoleId), depId: Number(depId) },
      })

      if (permissionsByRoleId.length > 0) {
        res.status(httpErrorCodes.OK).json({
          status: true,
          data: permissionsByRoleId,
          message: MessageTag?.SUCCESS,
        })
        logger.info({
          controller: 'rolePermissionController',
          method: 'getPermissionByRoleId',
          payload: `Requested employee: ${userId}`,
          msg: `Permissions retrieved for roleId: ${nestedRoleId} and depId: ${depId}`
        })
      } else {
        res.status(httpErrorCodes.OK).json({
          status: true,
          message: MessageTag.NO_RECORD,
        })
        logger.info({
          controller: 'rolePermissionController',
          method: 'getPermissionByRoleId',
          payload: `Requested employee: ${userId}`,
          msg: `No permissions found for roleId: ${nestedRoleId} and depId: ${depId}`
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
      res.status(httpErrorCodes.INTERNAL_SERVER).json({
        status: false,
        message: error?.message,
        statusCode: httpErrorCodes.INTERNAL_SERVER,
      })
      logger.error({
        controller: 'rolePermissionController',
        method: 'getPermissionByRoleId',
        msg: `Internal server error: ${error.message}`
      })
    }
  }
}
module.exports = {
  addRoleAndPermissions,
  getPermissionsByRoleId,
}
