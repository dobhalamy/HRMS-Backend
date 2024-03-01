const db = require('../models/index')
const { asyncMiddleware } = require('../middleware/async-middleware')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const { isEmpty } = require('lodash')
const { Op, literal } = require('sequelize')
const { UserRoleEnums } = require('../../enums/userRoleEnums')
const MessageTag = require('../../enums/messageNums')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const logger = require('../../helper/logger')
const { getRequestUserId } = require('../../helper')
const EmployeeDsr = db.employeeDsr
const Employee = db.employee
const fs = require('fs')
const moment = require('moment')
const pathModule = require('path')
const ProjectInformation = db.projectInformation
const ProjectsAssigned = db.projectAssigned
const ClientInformation = db.clientInformation
const ProjectDocument = db.projectDocument
const multer = require('multer')
const { BlobServiceClient } = require('@azure/storage-blob');
const maxSize = process?.env?.MEMORY_SIZE
const { azureStorageEnums } = require('../../enums/azureStorage');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const azure = require("azure-storage");
const path = require('path');

// @desc  Fetch all Project Info Using server side pagination
// @route GET /api/v1/projectinfo
// @access private
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('file');

const getProjectInfo = asyncMiddleware(async (req, res) => {
  const { skip = 0, limit = 0, searchedProject = null } = req.query
  const userId = getRequestUserId(req)
  let getProjectList = []
  let totalProjectCount = []
  if (req.user?.userRole === UserRoleEnums?.DEVELOPER) {
    const assignedProject = await ProjectsAssigned.findAll({
      where: {
        userId: userId,
        isRemove: 0,
      },
      attributes: ['projectId'],
    })

    const projectIds = assignedProject.map((item) => item.projectId)

    if (searchedProject) {
      getProjectList = await ProjectInformation.findAndCountAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'DESC']],
        where: {
          projectId: projectIds,
          projectName: {
            [Op.like]: `%${searchedProject}%`,
          },
        },
        include: [
          {
            model: ClientInformation,
            as: 'clientInfo',
            where: { isDeleted: 0, id: { [Op.col]: 'ProjectInformation.clientId' } },
            attributes: ['contactPersonName', 'businessName'],
          },
        ],
        attributes: [
          'id',
          'projectId',
          'billingType',
          'technology',
          'projectStartDate',
          'projectName',
        ],
      })
      totalProjectCount = await ProjectInformation.findAll({
        order: [['id', 'DESC']],
        where: {
          projectId: projectIds,
          projectName: {
            [Op.like]: `%${searchedProject}%`,
          },
        },
        include: [
          {
            model: ClientInformation,
            as: 'clientInfo',
            where: { isDeleted: 0, id: { [Op.col]: 'ProjectInformation.clientId' } },
            attributes: ['contactPersonName', 'businessName'],
          },
        ],
        attributes: [
          'id',
          'projectId',
          'billingType',
          'technology',
          'projectStartDate',
          'projectName',
        ],
      })
    } else {
      getProjectList = await ProjectInformation.findAndCountAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'DESC']],
        where: {
          projectId: projectIds,
        },
        include: [
          {
            model: ClientInformation,
            as: 'clientInfo',
            where: { isDeleted: 0, id: { [Op.col]: 'ProjectInformation.clientId' } },
            attributes: ['contactPersonName', 'businessName'],
          },
        ],
        attributes: [
          'id',
          'projectId',
          'billingType',
          'technology',
          'projectStartDate',
          'projectName',
        ],
      })
      totalProjectCount = await ProjectInformation.findAll({
        order: [['id', 'DESC']],
        where: {
          projectId: projectIds,
        },
        include: [
          {
            model: ClientInformation,
            as: 'clientInfo',
            where: { isDeleted: 0, id: { [Op.col]: 'ProjectInformation.clientId' } },
            attributes: ['contactPersonName', 'businessName'],
          },
        ],
        attributes: [
          'id',
          'projectId',
          'billingType',
          'technology',
          'projectStartDate',
          'projectName',
        ],
      })
    }
  } else {
    if (searchedProject) {
      getProjectList = await ProjectInformation.findAndCountAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'DESC']],
        // raw: true,
        // nest: true,
        where: {
          projectName: {
            [Op.like]: `%${searchedProject}%`,
          },
        },
        include: [
          {
            model: ClientInformation,
            as: 'clientInfo',
            where: { isDeleted: 0, id: { [Op.col]: 'ProjectInformation.clientId' } },
            attributes: ['contactPersonName', 'businessName'],
          },
        ],
        attributes: [
          'id',
          'projectId',
          'billingType',
          'technology',
          'projectStartDate',
          'projectName',
        ],
      })
    } else {
      getProjectList = await ProjectInformation.findAndCountAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        order: [['id', 'DESC']],
        include: [
          {
            model: ClientInformation,
            as: 'clientInfo',
            where: { id: { [Op.col]: 'ProjectInformation.clientId' } },
            attributes: ['contactPersonName', 'businessName'],
          },
        ],
        attributes: [
          'id',
          'projectId',
          'billingType',
          'technology',
          'projectStartDate',
          'projectName',
        ],
      })
    }
    totalProjectCount = await ProjectInformation.count({})
  }

  if (getProjectList) {
    if (limit == 0) {
      res.status(200).json({
        data: { projectInfo: totalProjectCount, totalCount: totalProjectCount?.length },
      })
    } else {
      res.status(200).json({
        data: { projectInfo: getProjectList, totalCount: totalProjectCount?.length },
      })
    } 
  }
})

const getSingleProjectInfo = asyncMiddleware(async (req, res) => {
  const { id } = req.params
  try {
    const singleProjectInfo = await ProjectInformation.findOne({
      where: { id },
      include: [
        {
          model: ClientInformation,
          as: 'clientInfo',
          where: { id: { [Op.col]: 'ProjectInformation.clientId' } },
          attributes: ['contactPersonName', 'businessName'],
        },
        {
          model: EmployeeDsr,
          as: 'totalBiling',
          attributes: ['workingHours'],
        },
      ]
    })
    
    const projectDevelopers = await ProjectsAssigned.findAll({
      attributes: ['userId', 'employeeProjectRole', 'id', 'createdAt', 'isRemove','assignDate', 'unassignDate'],
      required: false,
      include: [
        {
          model: Employee,
          attributes: ['userName'],
          required: false,
          where: { userId: literal('ProjectsAssigned.userId')}
        }
      ],     
      where: { projectId: singleProjectInfo?.dataValues?.projectId} 
    })
    
    const developers= {
      currentDeveloper: [],
      previousDeveloper: [],
    }

    projectDevelopers?.forEach((developer) => {
      if (developer?.isRemove === 0) {
        developers.currentDeveloper.push(developer);
      } else if (developer.isRemove === 1) {
        developers.previousDeveloper.push(developer);
      }
    });

    if(singleProjectInfo){
      res.status(HttpStatusCode.OK).json({
        status: true,
        data: {singleProjectInfo, developers},
        message: 'Fetch requested project data',
      });

      logger.info({
        controller: 'projectInfoController',
        method: 'getSingleProjectInfo',
        msg: 'Fetch requested project data',
      });

    } else {
      throw new NotFound('Developer not found');
    }
  } catch (error) {
    logger.error({
      controller: 'projectInfoController',
      method: 'getSingleProjectInfo',
      msg: `Catch error: ${error?.message || 'Unknown error'}`,
    }) 
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({ error: 'Internal Server Error' })
  }
})

// @desc Add new Project Info
// @route POST /api/v1/projectinfo
// @access private

const addProjectInfo = asyncMiddleware(async (req, res) => {
  const projectInfoData = req.body
  const {
    clientId,
    projectId,
    projectName,
    billingType,
    projectStartDate,
    projectEndDate,
    description,
    technology,
    projectStatus,
  } = projectInfoData

  if (
    !clientId ||
    !projectId ||
    !projectName ||
    !billingType ||
    // !projectSource ||
    !projectStartDate
  ) {
    throw new BadRequest()
  }
  const projectInfo = await ProjectInformation.create({
    clientId,
    projectId,
    projectName,
    billingType,
    // projectSource,
    projectStartDate,
    projectEndDate,
    projectStatus,
    technology: JSON.stringify(technology),
    description,
    createdBy: getRequestUserId(req),
    createdAt: new Date(),
  })
  if (projectInfo) {
    res.status(HttpStatusCode.CREATED).json({
      status: true,
      message: MessageTag.PROJECT_INFO_ADDED,
      data: projectInfo,
      statusCode: HttpStatusCode.CREATED,
    })
    logger.info({
      controller: 'projectInfoController',
      method: 'addProjectInfo',
      payload: projectInfo,
      msg: MessageTag.PROJECT_INFO_ADDED,
    })
  }
})

// @desc Update Project Info
// @route PATCH /api/v1/projectinfo
// @access private

const updateProjectInfo = asyncMiddleware(async (req, res) => {
  const projectInfoData = req.body
  const {
    id,
    clientId,
    projectId,
    projectName,
    billingType,
    technology,
    projectStartDate,
  } = projectInfoData

  technologyString = JSON.stringify(technology)
  if (
    !id ||
    !clientId ||
    !projectId ||
    !projectName ||
    !billingType ||
    // !projectSource ||
    !projectStartDate ||
    // (!projectStatus && projectStatus != 0) ||
    !technology
  ) {
    throw new BadRequest()
  }
  const projectExists = await ProjectInformation.findOne({ where: { id } })
  if (!isEmpty(projectExists)) {
    const updateValue = await ProjectInformation.update(
      { ...projectInfoData, technology: technologyString },
      { where: { id } },
    )
    if (updateValue) {
      res.status(200).json({
        status: true,
        message: MessageTag.PROJECT_INFO_UPDATED,
        statusCode: HttpStatusCode.OK,
      })
      logger.info(
        {
          controller: 'projectInfoController',
          method: 'updateProjectInfo',
        },
        {
          projectId: `Project Id : ${id}`,
          msg: MessageTag.PROJECT_INFO_UPDATED,
        },
      )
    }
  } else {
    logger.error(
      {
        controller: 'projectInfoController',
        method: 'updateProjectInfo',
      },
      {
        projectId: `Project Id : ${id}`,
        msg: 'Not Found',
      },
    )
    throw new NotFound()
  }
})

// @desc Delete project Info
// @route DELETE /api/v1/projectinfo/:id
// @access private

const deleteProject = asyncMiddleware(async (req, res) => {
  const { id } = req.params
  const projectExists = await ProjectInformation.findOne({ where: { id } })
  if (!isEmpty(projectExists)) {
    const project = await ProjectInformation.update(
      {
        isDeleted: 1,
      },
      { where: { id } },
    )
    if (project) {
      logger.info(
        {
          controller: 'projectInfoController',
          method: 'deleteProject',
        },
        {
          projectId: `Project Id : ${id}`,
          msg: 'Project deleted successfully',
        },
      )
      res.status(200).json({
        status: true,
        message: 'Deleted Successfully',
        statusCode: HttpStatusCode.OK,
      })
    }
  } else {
    throw new NotFound()
  }
})

// @desc Assign Project To empoloyee
// @route POST /api/v1/projectinfo/assign
// @access private
// old code

// const assignToEmployee = asyncMiddleware(async (req, res) => {
//   const empDetails = req.body.developers
//   const projectId = empDetails[0]?.projectId
//   try {
//     if (!projectId || !Array.isArray(empDetails) || empDetails.length === 0) {
//       throw new BadRequest('Invalid projectId or empty developers array')
//     }

//     const project = await ProjectInformation.findOne({ where: { projectId } })
//     if (!project) {
//       throw new NotFound('Project not found')
//     }

//     const createdProjects = await ProjectsAssigned.bulkCreate(
//       await Promise.all(empDetails.map(async (currentEmp) => {
//         const employee = await Employee.findOne({ where: { userName: currentEmp.assignDeveloper } })
//         if (!employee) {
//           throw new NotFound(`Employee with userName ${currentEmp.assignDeveloper} not found`)
//         }
//         return {
//           projectId: currentEmp.projectId,
//           // empId: currentEmp.assignDeveloper,
//           empId: employee?.empId,
//           employeeProjectRole: currentEmp.employeeProjectRole,
//           // projectName: currentEmp.projectName,
//           createdBy: getRequestUserId(req),
//           createdAt: new Date(),
//         }
//       })),
//     )

//     // QUERY IF PROJECT IS ALREADY ASSIGNED TO PARTICULAR EMPLOYEE
//     // WE CAN PERFORM ACTIONS LIKE , RESTRICT DUPLICATE ENTRY AND ALL...

//     // const data = await ProjectsAssigned.findAll({
//     //   where: {
//     //     [Op.and]: [{ projectId }, { empId: { [Op.or]: empIds } }],
//     //   },
//     //   attributes: ['empId'],
//     //   raw: true,
//     //   nest: true,
//     // })
//     // return

//     if (createdProjects.length > 0) {
//       res.status(HttpStatusCode.CREATED).json({
//         status: true,
//         message: MessageTag.PROJECT_ASSIGNED,
//         data: empDetails,
//         statusCode: HttpStatusCode.CREATED,
//       })

//       logger.info({
//         controller: 'projectInfoController',
//         method: 'assignToEmployee',
//         payload: empDetails,
//         msg: MessageTag.PROJECT_ASSIGNED,
//       })
//     }
//   } catch (error) {
//     res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
//       status: error?.isOperational || false,
//       message: error?.message || 'Internal Server Error',
//       statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
//     })
//     logger.error({
//       controller: 'projectInfoController',
//       method: 'assignToEmployee',
//       msg: `Catch error: ${error?.message || 'Unknown error'}`,
//     })
//   }
// })

// new code

const assignToEmployee = asyncMiddleware(async (req, res) => {
  // const empDetails = req.body.developers || []
  const empDetails = req.body || []
  const projectId = empDetails[0]?.projectId
 
  try {
    if (!projectId || empDetails.length === 0) {
      throw new BadRequest('Invalid projectId or empty developers array')
    }
    const project = await ProjectInformation.findOne({ where: { projectId } })
    if (!project) {
      throw new NotFound('Project not found')
    }
    const employeeUsernames = []
    for (let i = 0; i < empDetails.length; i++) {
      employeeUsernames.push(empDetails[i].assignDeveloper)
    }
    const employees = await Employee.findAll({ where: { userName: employeeUsernames } })
    if (employees.length !== employeeUsernames.length) {
      throw new NotFound('One or more employees not found')
    }
    const userIdMap = employees.reduce((map, employee) => {
      map[employee.userName] = employee.userId
      return map
    }, {})
    const existingAssignments = await ProjectsAssigned.findAll({
      where: { projectId, isRemove: 0, userId: Object.values(userIdMap) },
      attributes: ['userId'],
      raw: true,
      nest: true,
    })
    const existingEmpIds = existingAssignments.map((assignment) => assignment.userId)
    const newAssignments = []
    for (let i = 0; i < empDetails.length; i++) {
      const currentEmp = empDetails[i]
      const userId = userIdMap[currentEmp.assignDeveloper]
      const assignDate = currentEmp.assignDate
      if (!existingEmpIds.includes(userId)) {
        newAssignments.push({
          projectId: currentEmp.projectId,
          userId,
          employeeProjectRole: currentEmp.employeeProjectRole,
          assignDate,
          createdBy: getRequestUserId(req),
          createdAt: new Date(),
        })
      }
    }
    if (newAssignments.length > 0) {
      await ProjectsAssigned.bulkCreate(newAssignments)
      const response = {
        status: true,
        message: MessageTag.PROJECT_ASSIGNED,
        data: newAssignments,
        statusCode: HttpStatusCode.CREATED,
      }
      res.status(HttpStatusCode.CREATED).json(response)
      logger.info({
        controller: 'projectInfoController',
        method: 'assignToEmployee',
        payload: newAssignments,
        msg: MessageTag.PROJECT_ASSIGNED,
      })
    } else {
      const response = {
        status: false,
        message: 'Assignments already exist for the provided employees in this project',
        statusCode: HttpStatusCode.OK,
      }
      res.status(HttpStatusCode.OK).json(response)
    }
  } catch (error) {
    const errorResponse = {
      status: error?.isOperational || false,
      message: error?.message || 'Internal Server Error',
      statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
    }
 
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json(errorResponse)
 
    logger.error({
      controller: 'projectInfoController',
      method: 'assignToEmployee',
      msg: `Catch error: ${error?.message || 'Unknown error'}`,
    })
  }
})

const getNewProjectId = asyncMiddleware(async (req, res) => {
  const lastRecord = await ProjectInformation.findOne({
    order: [['id', 'DESC']],
  })
  let newProjectId
  if (isEmpty(lastRecord)) {
    newProjectId = 'VVPL001'
  } else {
    const { projectId } = lastRecord
    newProjectId = `VVPL${(parseInt(projectId.split('L')[1], 10) + 1).toString().padStart(3, '0')}`
  }
  res.status(200).json({
    status: true,
    message: 'success',
    data: newProjectId,
    statusCode: HttpStatusCode.OK,
  })
  logger.info({
    controller: 'employeeController',
    method: 'getNewProjectId',
    payload: null,
    msg: 'Record fetch and sent successfully',
  })
})

const getFilteredProject = asyncMiddleware(async (req, res) => {
  const { skip = 0, limit = 10, projectName } = req.query
  try {
    const project = await ProjectInformation.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      where: {
        [Op.or]: [
          {
            projectName: {
              [Op.like]: `%${projectName}%`,
            },
          },
        ],
      },
    })
    const totalProjectCount = await ProjectInformation.findAll({
      where: {
        [Op.or]: [
          {
            projectName: {
              [Op.like]: `%${projectName}%`,
            },
          },
        ],
      },
    })
    if (project) {
      res.status(200).json({
        status: true,
        data: { project, totalCount: totalProjectCount?.length },
        message: 'success',
      })
      logger.info({
        controller: 'projectController',
        method: 'getFilteredProject',
        msg: 'filtered project',
      })
    }
  } catch (error) {
    res.status(400).json({
      status: false,
      message: error,
    })
    logger.error({
      controller: 'projectController',
      method: 'getFilteredProject',
      msg: `error:${error}`,
    })
  }
})

const getEmployeePo = asyncMiddleware(async (req,res) => {
  const { userId } = req.params
  try {
    const projectIds = await ProjectsAssigned.findAll({
      where: { userId, isRemove:0  },
      attributes: ['projectId'],
      raw: true, 
    })

    const activeProjectsId = await ProjectInformation.findAll({
      where: {
        projectId: projectIds.map((item) => item.projectId),
        projectStatus: {
          [Op.not]: [3, 4]
        }
      },
      attributes: ['projectId'],
      raw: true,
    })
    const po = await ProjectsAssigned.findAll({
      where: {
        projectId: activeProjectsId.map((item) => item.projectId),
        employeeProjectRole: 'project_owner',
      },
      attributes: ['userId'],
      raw: true,
    })
     
    const poArray = Array.from(new Set(po.map((item) => item?.userId)));
    // const poArray = po?.map((item) => item?.userId)

    if (poArray) {
      res.status(200).json({
        status: true,
        data: { poArray },
        message: 'success',
      })
      logger.info({
        controller: 'projectController',
        method: 'getEmployeePo',
        msg: 'Pos are fetch',
      })
    }
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}})

const getTeamUnderSelectedPo  = asyncMiddleware(async (req,res) => {
  const { userId } = req.params
  try {
    const projectIds = await ProjectsAssigned.findAll({
      where: { userId, employeeProjectRole:'project_owner' },
      attributes: ['projectId'],
      raw: true, 
    })

    const activeProjectsId = await ProjectInformation.findAll({
      where: {
        projectId: projectIds.map((item) => item.projectId),
        projectStatus: {
          [Op.not]: [3, 4]
        }
      },
      attributes: ['projectId'],
      raw: true,
    })
    const team = await ProjectsAssigned.findAll({
      where: {
        projectId: activeProjectsId.map((item) => item.projectId),
        employeeProjectRole: {
          [Op.not]: 'project_owner',
        }},
      attributes: ['userId'],
      raw: true,
    })

    const teamArray = team?.map((item) => item?.userId)

    res.status(200).json({
      status: true,
      data: { teamArray },
      message: 'success',
    })
    logger.info({
      controller: 'projectController',
      method: 'getEmployeeTeam',
      msg: 'team are fetch',
    })
    
} catch (error) {
  // console.error('Error:', error);
  logger.error({
    controller: 'projectController',
    method: 'getEmployeeTeam',
    msg: 'Error fetching team members',
    error,
  });
  res.status(500).json({ error: 'Internal Server Error' });
}})

const removeAssignDeveloper = asyncMiddleware(async (req, res) => {
  try {
    const { id } = req.params;
    const { unassignDate } = req.body;
    if (!id) {
      throw new BadRequest();
    }

    const isDeveloperExists = await ProjectsAssigned.findOne({
      where: {
        id,
      },
    });
    if (!isDeveloperExists) {
      throw new NotFound('Developer not found');
    }

    const isRemoved = await ProjectsAssigned.update(
      {
        isRemove: 1,
        updatedBy: getRequestUserId(req),
        updatedAt: new Date(),
        unassignDate,
      },
      {
        where: {
          id,
        },
      }
    );

    if (isRemoved) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'Requested developer is unassigned from the assigned project',
      });

      logger.info({
        controller: 'projectInfoController',
        method: 'removeAssignDeveloper',
        msg: 'Requested developer is unassigned from the assigned project',
      });
    } else {
      throw new NotFound('Developer not found');
    }
  } catch (error) {
  
    logger.error({
      controller: 'projectInfoController',
      method: 'removeAssignDeveloper',
      msg: 'Error removing assign developer',
      error,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' }); 
  }
});


const updateDeveloper = async (req, res) => {
  try{
    const { id } = req.params
    const { employeeProjectRole, assignDate, unassignDate } = req.body
    if (!id) {
      throw new BadRequest();
    }
    const isDeveloperExists = await ProjectsAssigned.findOne({
      where: {
        id,
      },
    })
    if(!isDeveloperExists) {
      throw new NotFound('Developer not found');
    }
    const isUpdate = await ProjectsAssigned.update(
      {
        assignDate,
        unassignDate,
        employeeProjectRole,
      },
      {
        where: {
          id,
        }
      }
    )

    if(isUpdate) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        data: isUpdate,
        statusCode: HttpStatusCode.OK,
        message: 'Developer Details updated',
      })
      logger.info({
        controller: 'projectInfoController',
        method: 'updateDeveloper',
        data: isUpdate,
        msg: `Updated developer date`,
      })
    } else {
      throw new NotFound('Developer updated')
    }
  } catch (error) {
    logger.error({
      controller: 'projectInfoController',
      method: 'updateDeveloper',
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
  }
}


const connectionString = azureStorageEnums.CONNECTION_STRING;
const containerName = azureStorageEnums.CONTAINER_NAME;

async function uploadToAzureBlob(fileBuffer, fileName) {
  const blobServiceClient = await BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
  });

  return blockBlobClient.url;
}
const uploadProjectDocument = async (req, res) => {
    upload(req, res, async (error) => {
      if (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Upload failed.' });
      }
      // Now you can access uploaded file details in req.files
      const uploadFile = req?.file;
      const { mediaType, projectId, description } = req?.body;

      try {
          const azureBlobUrl = await uploadToAzureBlob(uploadFile?.buffer, uploadFile?.originalname);
        const uploadedMedia = await ProjectDocument.create({
          projectId,
          mediaType,
          description,
          mediaLink: azureBlobUrl,
          createdAt: new Date(),
          createdBy: getRequestUserId(req),
        });

        res.status(200).json({ status: true, message: 'Upload successful', data: uploadedMedia });
      } catch (dbError) {
        console.error('Database insertion error:', dbError);
        res.status(500).json({ status: false, message: 'Database insertion error', error: dbError });
      }
    });
};



const getProjectDocument = asyncMiddleware(async (req, res) => {
  const { id } = req.params;

  try {
    const projectDoc = await ProjectDocument.findAll({
      where: { projectId: id },
    });

    if (projectDoc) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        data: projectDoc,
        message: 'Fetch requested project data',
      });

      logger.info({
        controller: 'projectInfoController',
        method: 'getProjectDocument',
        msg: 'Fetch requested project document',
      });
    } else {
      throw new NotFound('Document not found');
    }
  } catch (error) {
    logger.error({
      controller: 'projectInfoController',
      method: 'getProjectDocument',
      msg: `Catch error: ${error.message || 'Unknown error'}`,
    });
    res.status(error.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
      error: 'Internal Server Error',
    });
  }
});

async function getDocumentViewUrl(blobName) {
  try {
    const BlobName = blobName;
    const blobService = azure.createBlobService(connectionString);
 
    var startDate = new Date();
    var expiryDate = new Date(startDate);
    expiryDate.setMinutes(startDate.getMinutes() + 30);
 
    var sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: [azure.BlobUtilities.SharedAccessPermissions.READ],
        Start: startDate,
        Expiry: expiryDate,
      },
    };
    
    const sasToken = blobService.generateSharedAccessSignature(
      containerName,
      BlobName,
      sharedAccessPolicy
    );

    var imageUrl = {};
    imageUrl = blobService.getUrl(containerName, BlobName, sasToken);
    return imageUrl;
  } catch (error) { console.log('error', error)}
}

const getUploadedDocumentUrl = asyncMiddleware(async (req, res) => {
  const { id } = req.params
  try{
    const projectDoc = await ProjectDocument.findOne({
      where: { id },
    })
    
    const parts = projectDoc?.dataValues?.mediaLink.split('/')
    const blobName = parts[parts?.length - 1];
    const documentUrl = await getDocumentViewUrl(blobName) 
    
    if(documentUrl){
      res.status(HttpStatusCode.OK).json({
        status: true,
        data: documentUrl,
        message: 'Fetch requested document url',
      });

      logger.info({
        controller: 'projectInfoController',
        method: 'getUploadedDocumentUrl',
        msg: 'Fetch requested document url',
      });

    } else {
      throw new NotFound('Developer not found');
    }
  } catch (error) {
    logger.error({
      controller: 'projectInfoController',
      method: 'getUploadedDocumentUrl',
      msg: `Catch error: ${error?.message || 'Unknown error'}`,
    }) 
    res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({ error: 'Internal Server Error' })
  }
})

const updateProjectDocument = async (req, res) => {
  const {
    id,
    projectId,
    isActive,
  } = req.body

  try {
    if (!id) {
      logger.error(
        {
          controller: 'projectInfoController',
          method: 'updateProjectDocument',
          payload: `Requested project: ${projectId}`,
          msg: 'Bad request by the client',
        },
      )
      throw new BadRequest()
    }
    const isExists = await ProjectDocument.findOne({
      where: {
        id,
      },
    })
    
    if (isEmpty(isExists)) {
      logger.error(
        {
          controller: 'projectInfoController',
          method: 'updateProjectDocument',
          payload: `Requested projectID: ${projectId}`,
          msg: 'Document not found',
        },
      )
      throw new NotFound(null, null, null, 'User not found')
    }

    const isUpdated = await ProjectDocument.update(
      {
        isActive,
        updatedAt: new Date(),
        updatedBy: getRequestUserId(req),
      },
      {
        where: {
          id,
        },
      },
    )
    
    if (!isEmpty(isUpdated)) {
      res.status(200).json({
        status: true,
        message: 'success',
        data: isUpdated,
      })
      logger.info({
        controller: 'projectInfoController',
        method: 'updateProjectDocument',
        payload: `Requested project: ${projectId}`,
        msg: 'Record updated successfully',
      })
    }
  } catch (error) {
    logger.error({
      controller: 'projectInfoController',
      method: 'updateProjectDocument',
      payload: `Requested project: ${projectId}`,
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

module.exports = {
  getNewProjectId,
  addProjectInfo,
  getProjectInfo,
  updateProjectInfo,
  deleteProject,
  assignToEmployee,
  getFilteredProject,
  getEmployeePo,
  getTeamUnderSelectedPo,
  removeAssignDeveloper,
  getSingleProjectInfo,
  updateDeveloper,
  uploadProjectDocument,
  getProjectDocument,
  getUploadedDocumentUrl,
  updateProjectDocument,
}
