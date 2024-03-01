const db = require('../models/index')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { logger } = require('../../helper/logger')
const { isEmpty } = require('lodash')
const { add } = require('winston')
const Sequelize = require('sequelize');
const {UserRole} = require('../../enums/messageNums')
const Employee = db.employee
const Media = db.media 
const ProjectsAssigned = db.projectAssigned
const GlobalType = db.globalType

const getUserInfo = async (req, res) => {
  const { userId } = req.params
  numericUserId = parseInt(userId)
  try {
    if (!numericUserId) {
      throw new BadRequest()
    }
    const isSuperAdmin = await Employee.findOne({
      where: { userId: numericUserId },
    })
    if (isSuperAdmin?.dataValues?.userRole === UserRole?.SUPER_ADMIN) {
      try {
        const isEmployeeExists = await Employee.findOne({
          where: {
            userId: numericUserId,
          },
        })
        const addingImageField = await Media.findOne({
          where: { empId: isEmployeeExists.empId, mediaType: 'Image' },
          attributes: ['mediaType', 'mediaLink', 'id'],
        })

        // If addingImageField exists, assign it to the profileImage property
        if (addingImageField) {
          isEmployeeExists.dataValues.userProfileImg = addingImageField
        }
        res.status(HttpStatusCode.OK).send({
          status: true,
          data: isEmployeeExists,
          message: 'success',
        })
      } catch (error) {
        console.log(error)
        isEmployeeExists.profileImage = []
      }
      logger.info({
        controller: 'userController',
        method: 'getUserInfo',
        userId: `userId${userId}`,
        msg: `userInfo data${userId}`,
      })
    } else {
      const isEmployeeExists = await Employee.findOne({
        where: {
          userId: numericUserId,
        },
        attributes: {
          exclude: ['userPassword', 'userResetPasswordOtpTime', '"userResetPasswordOtp'],
        },
        include: [
          {
            model: Media,
            as: 'documents',
            where: { mediaType: { [Sequelize.Op.ne]: 'Image' } },
            attributes: ['mediaType', 'mediaLink'],
            required: false,
          },
          {
            model: ProjectsAssigned,
            attributes: ['projectId'],
            required: false,
            as: 'projects',
          },
          {
            model: GlobalType,
            attributes: ['displayName'],
            required: false,
            as: 'designation',
          },
        ],
      })

      // Fetch poIds for all projects
      const poIds = await Promise.all(
        isEmployeeExists.projects.map(async (project) => {
          const poIdRecord = await ProjectsAssigned.findOne({
            where: { employeeProjectRole: 'project_owner', projectId: project.projectId },
          })
          // return poIdRecord ? poIdRecord.empId : null;
          return poIdRecord ? poIdRecord.userId : null
        }),
      )

      // Update isEmployeeExists.projects with poIds
      isEmployeeExists.projects.forEach((project, index) => {
        project.dataValues.poId = poIds[index]
      })
      // const result = isEmployeeExists.projects.map(async (project) => {
      //   const poId = await ProjectsAssigned.findOne({ where: { employeeProjectRole: 'project_owner' && projectId: project.projectId}})
      //   return {
      //     ...isEmployeeExists.projects,
      //     poId: poId,
      //   }
      // })

      if (isEmpty(isEmployeeExists)) {
        throw new NotFound()
      }
      try {
        const addingImageField = await Media.findOne({
          where: { empId: isEmployeeExists.empId, mediaType: 'Image' },
          attributes: ['mediaType', 'mediaLink', 'id'],
        })
        // If addingImageField exists, assign it to the profileImage property
        if (addingImageField) {
          isEmployeeExists.dataValues.userProfileImg = addingImageField
        }
      } catch (error) {
        console.log(error)
        isEmployeeExists.profileImage = []
      }
      res.status(HttpStatusCode.OK).send({
        status: true,
        data: isEmployeeExists,
        message: 'success',
      })
      logger.info({
        controller: 'userController',
        method: 'getUserInfo',
        userId: `userId${userId}`,
        msg: `userInfo data${userId}`,
      })
    }
  } catch (error) {
    logger.error({
      controller: 'userController',
      method: 'getUserInfo',
      userId: `userId: ${userId}`,
      msg: `Catch error:${error?.message}`,
    })
    // res.status(HttpStatusCode?.BAD_REQUEST).json({ message: "user doesn't exist" })
  }
}

module.exports = { getUserInfo }
