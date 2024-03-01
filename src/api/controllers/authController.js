/* eslint-disable no-await-in-loop */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
const { isEmpty } = require('lodash')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { APIError } = require('../../helper/apiErrors')
const { MessageTag } = require('../../enums/messageNums')
const { Op } = require('sequelize')

const Auth = db.employee
const RolePermissions = db.roleAndPermissions
const GlobalType = db.globalType
require('dotenv').config()

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
}

const loginUser = async (req, res) => {
  const loginAuth = req?.body
  if (!isEmpty(loginAuth)) {
    const email = loginAuth?.email
    logger.warn(
      { component: 'auth', method: 'loginUser' },
      { user: email, msg: 'Running login api' },
    )

    const password = loginAuth?.password
    try {
      if (!email || !password) throw new Error(MessageTag.ALL_REQ)
      const isExists = await Auth.findOne({
        where: { userEmail: email },
        attributes: [
          'userId',
          'tenantId',
          'empId',
          'userName',
          'userPersonalEmail',
          'userEmail',
          'userPassword',
          'userDesignation',
          'userRole',
          'userProfileImg',
          'empMobileNumber',
          'userBirthday',
          'empJoinDate',
          'empSalary',
          'empCurrentAddress',
          'isConcernPerson',
          'depId',
          'isActive',
          'userLocked',
        ],
      })
      if (!isEmpty(isExists)) {
        const hashedPassword = isExists.userPassword
        const isPasswordMatch = await bcrypt.compare(password, hashedPassword)
        if (isPasswordMatch) {
          const getRoleValue = await GlobalType.findOne({
            where: {
              id: isExists?.userRole,
            },
          })
          const userRoles = {}
          const userRole = getRoleValue?.uniqueValue
          const userRoleId = isExists?.userRole
          const userName = isExists?.userName
          const empId = isExists?.empId
          const userId = isExists?.userId
          const isConcernPerson = isExists?.isConcernPerson
          const depId = isExists?.depId
          const email = isExists?.userEmail

          try {
            const listOfPermissions = await RolePermissions.findAll({
              where: {
                roleId: userRoleId,
                depId,
              },
            })
            if (listOfPermissions?.length > 0) {
              logger.info(
                { component: 'auth', method: 'loginUser' },
                {
                  user: empId,
                  message: `permissions fetched successfully.Length of permissions are ${listOfPermissions?.length}`,
                },
              )
              for (let i = 0; i < listOfPermissions.length; i++) {
                const { moduleId, permissions } = listOfPermissions[i]
                const moduleName = await GlobalType.findOne({
                  where: {
                    id: moduleId,
                    globalTypeCategory_uniqeValue: 'modules',
                  },
                })
                const permissionsName = await GlobalType.findAll({
                  where: {
                    id: {
                      [Op.in]: permissions?.includes(',')
                        ? permissions?.split(',')
                        : [Number(permissions)],
                    },
                    globalTypeCategory_uniqeValue: 'permissions',
                  },
                })

                const permissionsNames = []
                if (!isEmpty(permissionsName)) {
                  for (let j = 0; j < permissionsName?.length; j++) {
                    const localPermission = permissionsName[j]
                    if (localPermission?.dataValues?.uniqueValue) {
                      permissionsNames?.push(localPermission?.dataValues?.uniqueValue)
                    }
                  }
                  userRoles[`${moduleName?.uniqueValue}`] = permissionsNames
                }
              }
            }
          } catch (e) {
            logger.error({ component: 'auth', method: 'loginUser', user: empId, error: e })
            throw new APIError()
          }
          const token = generateAccessToken({
            userName,
            email,
            userRole,
            userRoleId,
            empId,
            userId,
            isConcernPerson,
            depId,
          })
          res.status(200).json({
            user: email,
            token,
            permissions: userRoles,
            status: true,
            message: MessageTag.WelcomeMsg,
          })
          logger.info({
            component: 'auth',
            method: 'loginUser',
            user: isExists,
            msg: `Login successfully: ${email}`,
          })
        } else {
          logger.warn({
            component: 'auth',
            method: 'loginUser',
            user: isExists,
            msg: `Password Incorrect for user: ${email}`,
          })
          res.status(200).json({
            user: email,
            status: false,
            message: MessageTag.PasswordWrong,
          })
        }
      } else {
        res.status(200).json({
          user: email,
          status: false,
          message: MessageTag.USER_NOT_FOUND,
        })
      }
    } catch (error) {
      logger.error({
        controller: 'authController',
        method: 'loginUser',
        payload: `Requested employee: ${email} `,
        msg: `error:${error}`,
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
}

module.exports = {
  loginUser,
}
