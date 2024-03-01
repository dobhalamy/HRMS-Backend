/* eslint-disable no-dupe-else-if */
const db = require('../models/index')
const { logger } = require('../../helper/logger')
const AssignProject = db.projectAssigned
const ProjectInformation = db.projectInformation
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest } = require('../../helper/apiErrors')
const { getRequestUserId } = require('../../helper')

const getProjectList = async (req, res) => {
  const userId = getRequestUserId(req)

  try {
    if (!userId) {
      throw new BadRequest()
    }
    const assignedProject = await AssignProject.findAll({
      where: {
        userId: userId,
        isRemove: 0,
      },
      attributes: ['projectId'],
    })

    const projectIds = assignedProject.map((item) => item.projectId)

    const projects = await ProjectInformation.findAll({
      where: {
        projectId: projectIds,
      },
      attributes: ['projectName', 'projectId'],
    })
    res.status(HttpStatusCode.OK).json({
      status: true,
      message: 'success',
      data: projects,
      statusCode: HttpStatusCode.OK,
    })
    logger.info({
      controller: 'projectListController',
      method: 'projectList',
      payload: projects,
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
module.exports = {
  getProjectList,
}
