const pathModule = require('path')
const fs = require('fs')
const multer = require('multer')
const moment = require('moment')
const db = require('../models/index')
const { Op } = require('sequelize')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { logger } = require('../../helper/logger')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const { isEmpty } = require('lodash')
const monthNames = require('../../enums/monthName')
const { getRequestUserId } = require('../../helper')
require('dotenv').config()
const Media = db.media
const Employee = db.employee
const maxSize = process?.env?.MEMORY_SIZE

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('upload')) {
      fs.mkdirSync('upload')
    }
    cb(null, 'upload')
  },
  filename: (req, file, cb) => {
    const fileName = moment.utc().format('YYYY-MM-DDTHH-mm-ss.SSS[Z]')
    cb(null, `${fileName}${pathModule.extname(file?.originalname)}`)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxSize,
  },
}).single('file')

const documentUpload = async (req, res) => {
  upload(req, res, async (error) => {
    const { empId, mediaType } = req.body
    const hostname = req.headers.host
    if (error instanceof multer.MulterError) {
      throw new BadRequest()
    } else if (error) {
      res.status(HttpStatusCode?.INTERNAL_SERVER).json({ message: 'Server error' })
    } else {
      try {
        if (!mediaType && !empId && !req.file) {
          throw new BadRequest()
        }
        const uploadedMedia = await Media.create({
          mediaType,
          mediaName: req?.file?.filename,
          empId: empId || 0,
          mediaLink: `${req?.file?.path}`.replace(/\\/g, '/'),
          mediaExtension: pathModule.extname(req?.file?.originalname),
          createdAt: new Date(),
          createdBy: getRequestUserId(req),
        })
        res.status(HttpStatusCode?.OK).json({
          status: true,
          data: uploadedMedia,
          message: 'success',
          statusCode: HttpStatusCode?.OK,
        })
        logger.info(
          {
            controller: 'DocumentUpload controller',
            method: 'DocumentUpload',
          },
          {
            empId: `employeeId: ${empId}`,
            msg: 'DocumentUpload successfully',
          },
        )
      } catch (error) {
        logger.error(
          {
            controller: 'DocumentUpload controller',
            method: 'DocumentUpload',
            empId: `employId: ${empId}`,
            msg: `Catch error:${error?.message}`,
          },
        )
        if (error) {
          res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
            status: error?.isOperational || false,
            message: error?.message,
            statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
          })
        }
      }
    }
  })
}
const getDocument = async (req, res) => {
  const { skip = 0, limit = 0, year, mediaType, searchEmployee } = req.query
  const userId = getRequestUserId(req)
  try {
    if (!userId || !year || !skip || !limit) {
      throw new BadRequest()
    }

    let documentExist
    if (!mediaType && !searchEmployee) {
      documentExist = await Media.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          isActive: 0,
          mediaType: {
            [Op.not]: 'Image',
          },
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['userName'],
            where: { isDeleted: { [Op.ne]: 1 } },
          },
        ],
        order: [['createdAt', 'DESC']],
      })
    } else if (searchEmployee && mediaType) {
      documentExist = await Media.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          mediaType: mediaType,
          isActive: 0,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['userName'],
            where: {
              userName: searchEmployee,
            },
          },
        ],
        order: [['createdAt', 'DESC']],
      })
    } else if (mediaType) {
      documentExist = await Media.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          mediaType: mediaType,
          isActive: 0,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['userName'],
          },
        ],
        order: [['createdAt', 'DESC']],
      })
    } else if (searchEmployee) {
      documentExist = await Media.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          isActive: 0,
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['userName'],
            where: {
              userName: searchEmployee,
            },
          },
        ],
        order: [['createdAt', 'DESC']],
      })
    }

    if (isEmpty(documentExist)) {
      res.status(HttpStatusCode?.OK).json({
        status: true,
        message: 'success',
        statusCode: HttpStatusCode?.OK,
        data: [],
      })
      return
    }
    res.status(HttpStatusCode?.OK).json({
      status: true,
      message: 'success',
      data: { documentList: documentExist, totalCount: documentExist?.length },
      statusCode: HttpStatusCode?.OK,
    })
    logger.info(
      {
        controller: 'getDocument',
        method: 'get uploaded document',
      },
      {
        empId: `employeeId:${empId}`,
        msg: 'get uploaded document',
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'getDocument',
        method: 'get upload document',
      },
      {
        empId: `employeeId:${empId}`,
        msg: `Catch error:${error?.message}`,
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

const documentDelete = async (req, res) => {
  const { empId, id } = req.query
  try {
    if (!empId || !id) {
      throw new BadRequest()
    }
    const isExist = await Media.findOne({
      where: {
        id: id,
      },
    })

    if (isEmpty(isExist)) {
      logger.error(
        {
          controller: 'deleteDocument',
          method: 'delete document',
        },
        {
          empId: `employeeId:${empId}`,
          msg: 'document not found',
        },
      )
      throw new NotFound()
    }
    const filePath = isExist.mediaName
    const directoryPath = 'upload/'
    fs.unlink(directoryPath + filePath, async (err) => {
      if (err) {
        logger.error(
          {
            controller: 'deleteDocument',
            method: 'delete document',
          },
          {
            empId: `employeeId:${empId}`,
            msg: `Error deleting file: ${err.message}`,
          },
        )
        throw new NotFound()
      }
      const isDeleted = await Media.update(
        {
          isActive: 1,
        },
        {
          where: {
            id: id,
          },
        },
      )

      if (!isEmpty(isDeleted)) {
        res.status(HttpStatusCode.OK).json({
          status: true,
          message: 'success',
          statusCode: HttpStatusCode.OK,
        })
      }
    })
  } catch (error) {
    logger.error(
      {
        controller: 'deleteDocument',
        method: 'delete document',
      },
      {
        empId: `employeeId:${empId}`,
        msg: `Catch error:${error?.message}`,
      },
    )
    if (error.httpCode) {
      res.status(error?.httpCode || HttpStatusCode?.BAD_REQUEST).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: HttpStatusCode?.INTERNAL_SERVER || error?.httpCode,
      })
    }
  }
}

const getSalarySlip = async (req, res) => {
  const { empId, mediaType, year, userRole } = req.query
  const newSalarySlip = []
  try {
    if (!empId || !mediaType || !year || !userRole) {
      throw new BadRequest()
    }
    if (userRole === 'user') {
      const userDocument = await Media.findAll({
        where: {
          empId: empId,
          mediaType: mediaType,
          isActive: 0,
          createdAt: {
            [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
          },
        },
        include: [
          {
            model: Employee,
            attributes: ['userName'],
            as: 'employee',
          },
        ],
        order: [['id', 'DESC']],
      })
      if (isEmpty(userDocument)) {
        res.status(HttpStatusCode?.OK).json({
          status: true,
          message: 'success',
          statusCode: HttpStatusCode?.OK,
          data: [],
        })
        return
      }
      for (let i = 0; i < 12; i++) {
        const salarySlip = userDocument.filter(
          (data) => data.empId === empId && new Date(data?.createdAt).getMonth() - 1 === i,
        )
        const dateList = salarySlip.map((fileName) => {
          return fileName.createdAt
        })
        const newDateList = dateList.sort((a, b) => b.getTime() - a.getTime())
        const latestFileName = newDateList[0]
        const finalSalarySlip = salarySlip.filter((data) => data.createdAt === latestFileName)
        const month = monthNames[i]
        newSalarySlip.push({
          monthNames: month,
          data: finalSalarySlip,
        })
      }
    } else {
      const adminDocument = await Media.findAll({
        where: {
          mediaType: mediaType,
          isActive: 0,
          createdAt: {
            [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
          },
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['userName'],
          },
        ],
        order: [['id', 'DESC']],
      })

      if (isEmpty(adminDocument)) {
        res.status(HttpStatusCode?.OK).json({
          status: true,
          message: 'success',
          statusCode: HttpStatusCode?.OK,
          data: [],
        })
        return
      }
      newSalarySlip.push(...adminDocument)
    }

    const totalCount = await Media.findAll({
      where: {
        mediaType: mediaType,
        isActive: 0,
      },
    })
    res.status(HttpStatusCode.OK).send({
      status: true,
      message: 'success',
      data: newSalarySlip,
      totalCount: totalCount?.length || null,
      statusCode: HttpStatusCode?.OK,
    })
    logger.info(
      {
        controller: 'getDocument',
        method: 'get salarySlip document',
      },
      {
        empId: `employeeId:${empId}`,
        msg: 'get salarySlip document',
      },
    )
  } catch (error) {
    logger.error(
      {
        controller: 'getDocument',
        method: 'get salarySlip document',
      },
      {
        empId: `employeeId:${empId}`,
        msg: `Catch error:${error?.message}`,
      },
    )
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode?.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.messages,
        statusCode: error?.HttpStatusCode || error?.httpCode,
      })
    }
  }
}
const updateDocument = async (req, res) => {
  upload(req, res, async (error) => {
    const { id, empId, mediaType, file } = req.body
    const hostname = req.headers.host
    if (error instanceof multer.MulterError) {
      throw new BadRequest()
    } else if (error) {
      res.status(HttpStatusCode?.INTERNAL_SERVER).json({ message: 'Server error' })
    } else {
      try {
        if (!mediaType && !empId) {
          throw new BadRequest()
        }
        const documentToUpdate = await Media.findOne({
          where: {
            id: id,
          },
        })
        if (req.file) {
          // documentToUpdate.mediaLink = `${hostname}/${req?.file?.path}`.replace(/\\/g, '/')
          documentToUpdate.mediaLink = `${req?.file?.path}`.replace(/\\/g, '/')
          documentToUpdate.mediaName = req?.file?.filename
          documentToUpdate.mediaExtension = pathModule.extname(req?.file?.originalname)
          documentToUpdate.updatedAt = new Date()
          documentToUpdate.updatedBy = getRequestUserId(req)
        } else {
          documentToUpdate.mediaType = mediaType
          documentToUpdate.updatedAt = new Date()
          documentToUpdate.updatedBy = getRequestUserId(req)
        }
        await documentToUpdate.save()
        res.status(HttpStatusCode?.OK).json({
          status: true,
          message: 'Document updated',
          statusCode: HttpStatusCode?.OK,
          data: documentToUpdate,
        })
        logger.info(
          {
            controller: 'DocumentUpload controller',
            method: 'UpdateDocument',
          },
          {
            empId: `employeeId: ${empId}`,
            msg: 'DocumentUpdated successfully',
          },
        )
      } catch (error) {
        logger.error(
          {
            controller: 'DocumentUpload controller',
            method: 'UpdateDocument',
            empId: `employId: ${empId}`,
            msg: `Catch error:${error?.message}`,
          },
        )
        if (error) {
          res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
            status: error?.isOperational || false,
            message: error?.message,
            statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
          })
        }
      }
    }
  })
}

const profilePictureUpload = async (req, res) => {
  upload(req, res, async (error) => {
    const { empId, mediaType } = req.body
    const hostname = req.headers.host
    if (error instanceof multer.MulterError) {
      throw new BadRequest()
    } else if (error) {
      res.status(HttpStatusCode?.INTERNAL_SERVER).json({ message: 'Server error' })
    } else {
      try {
        if (!mediaType && !empId && !req.file) {
          throw new BadRequest()
        }
        const uploadedMedia = await Media.create({
          mediaType,
          mediaName: req?.file?.filename,
          empId: empId || 0,
          mediaLink: `${req?.file?.path}`.replace(/\\/g, '/'),
          mediaExtension: pathModule.extname(req?.file?.filename),
          createdAt: new Date(),
          createdBy: getRequestUserId(req),
        })
        res.status(HttpStatusCode?.OK).json({
          status: true,
          id: uploadedMedia?.id,
          message: 'success',
          mediaType: uploadedMedia?.mediaType,
          mediaLink:uploadedMedia?.mediaLink,
          statusCode: HttpStatusCode?.OK,
        })
        logger.info(
          {
            controller: 'ProfilePictureUpload controller',
            method: 'ProfilePictureUpload',
          },
          {
            empId: `employeeId: ${empId}`,
            msg: 'ProfilePictureUpload successfully',
          },
        )
      } catch (error) {
        logger.error(
          {
            controller: 'ProfilePictureUpload controller',
            method: 'ProfilePictureUpload',
          },
          {
            empId: `employId: ${empId}`,
            msg: `Catch error:${error?.message}`,
          },
        )
        if (error) {
          console.log({
            status: error?.isOperational || false,
            message: error?.message,
            statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
          })
          res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
            status: error?.isOperational || false,
            message: error?.message,
            statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
          })
        }
      }
    }
  })
}

const updateProfilePicture = async (req, res) => {
  upload(req, res, async (error) => {
    const { id, empId, mediaType } = req.body
    // const { path } = req.file
    // const filePath = path
    const hostname = req.headers.host
    if (error instanceof multer.MulterError) {
      throw new BadRequest()
    } else if (error) {
      res.status(HttpStatusCode?.INTERNAL_SERVER).json({ message: 'Server error' })
    } else {
      try {
        if (!mediaType && !empId) {
          throw new BadRequest()
        }
        const ImageToUpdate = await Media.findOne({
          where: {
            id: id,
          },
        })
        if (req.file) {
          ImageToUpdate.mediaLink = req?.file?.path.replace(/\\/g, '/')
          // ImageToUpdate.mediaLink = `${filePath}`.replace(/\\/g, '/')
          ImageToUpdate.mediaName = req?.file?.filename
          ImageToUpdate.mediaExtension = pathModule.extname(req?.file?.originalname)
          ImageToUpdate.updatedAt = new Date()
          ImageToUpdate.updatedBy = getRequestUserId(req)
        } else {
          ImageToUpdate.mediaLink = filePath
          ImageToUpdate.updatedAt = new Date()
          ImageToUpdate.updatedBy = getRequestUserId(req)
        }
        await ImageToUpdate.save()
        console.log('inside backend ', ImageToUpdate.mediaLink)
        res.status(HttpStatusCode?.OK).json({
          status: true,
          message: 'success',
          id: ImageToUpdate.id,
          mediaType: ImageToUpdate?.mediaType,
          mediaLink: ImageToUpdate?.mediaLink,
          statusCode: HttpStatusCode?.OK,
        })
        logger.info(
          {
            controller: 'ProfileImageUpload controller',
            method: 'ProfileImageUpload',
          },
          {
            empId: `employeeId: ${empId}`,
            msg: 'ProfileImageUpload successfully',
          },
        )
      } catch (error) {
        logger.error(
          {
            controller: 'ProfileImageUpload controller',
            method: 'ProfileImageUpload',
            empId: `employId: ${empId}`,
            msg: `Catch error:${error?.message}`,
          },
        )
        if (error) {
          res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
            status: error?.isOperational || false,
            message: error?.message,
            statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
          })
        }
      }
    }
  })
}

module.exports = {
  documentUpload,
  getDocument,
  updateDocument,
  documentDelete,
  getSalarySlip,
  upload,
  profilePictureUpload,
  updateProfilePicture,
}
