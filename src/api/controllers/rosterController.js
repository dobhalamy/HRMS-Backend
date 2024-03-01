const { BadRequest } = require('../../helper/apiErrors')
const XLSX = require('xlsx')
const db = require('../models/index')
const { isEmpty } = require('lodash')
const multer = require('multer')
const { getRequestUserId } = require('../../helper')
const { logger } = require('../../helper/logger')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const storage = multer.memoryStorage()

const Roster = db.roster
const Employee = db.employee
const GlobalType = db.globalType

const upload = multer({
  storage: storage,
}).single('file')
const uploadRoster = async (req, res) => {
  upload(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      throw new BadRequest()
    } else if (error) {
      res.status(HttpStatusCode?.INTERNAL_SERVER).json({ message: 'Server error' })
    } else {
      try {
        if (!req.file) {
          throw new BadRequest()
        }
        const file = req.file
        const workbook = XLSX.read(file.buffer, { type: 'buffer' })
        const worksheetName = workbook.SheetNames[0] // Assuming you want to read the first sheet
        const worksheet = workbook.Sheets[worksheetName]
        // Read data from the worksheet
        const columnData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'mm/dd/yyyy',
        })
        for (let i = 0; i < columnData?.length; i++) {
          //extracting row from the column data
          const row = columnData[i]
          const shift = {
            monday: row?.Monday,
            tuesday: row?.Tuesday,
            wednesday: row?.Wednesday,
            thursday: row?.Thursday,
            friday: row?.Friday,
            saturday: row?.Saturday,
          }
          const isRosterUploaded = await Roster.create({
            empId: row?.EmployeeID,
            shiftTimings: JSON.stringify(shift),
            month: row?.Month,
            year: row?.Year,
            type: row?.Type,
            workFrom: row['Work From'],
            empStage: row['Employee Stage'],
            gender: row?.Gender,
            process: row?.Process,
            subProcess: row['Sub Process'],
            createdBy: getRequestUserId(req),
            createdAt: new Date(),
          })
          if (!isEmpty(isRosterUploaded)) {
            logger.info({
              controller: 'rosterController',
              method: 'uploadRoster',
              empId: `employeeId: ${getRequestUserId(req)}`,
              msg: 'roster added to the table successfully',
            })
          }
        }
        res.status(HttpStatusCode?.OK).json({
          status: true,
          message: 'success',
          data: [],
          statusCode: HttpStatusCode?.OK,
        })
      } catch (error) {
        logger.error({
          controller: 'rosterController',
          method: 'uploadRoster',
          empId: `employeeId: ${getRequestUserId(req)}`,
          msg: `catch error: ${error}`,
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
  })
}

const getRosterList = async (req, res) => {
  const { skip = 0, limit = 0 } = req.query
  let rosterData = []
  try {
    rosterData = await Roster.findAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['userName', 'depId'],
        },
      ],
    })
    const newRosterData = rosterData.map(async (item) => {
      const depId = item?.employee?.depId
      if (depId) {
        let globalType = await GlobalType.findOne({ where: { id: depId } })

        if (globalType && globalType.displayName) {
          const displayName = globalType.displayName
          item['dataValues']['department'] = displayName
        }
      }
      return item
    })
    const rosterTotalCount = await Roster.findAll({})
    res.status(HttpStatusCode?.OK).json({
      status: true,
      message: 'success',
      data: { rosterList: await Promise.all(newRosterData), totalCount: rosterTotalCount?.length },
      statusCode: HttpStatusCode?.OK,
    })
  } catch (error) {
    logger.error({
      controller: 'rosterController',
      method: 'getRosterList',
      empId: `employeeId: ${getRequestUserId(req)}`,
      msg: `catch error: ${error}`,
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
  uploadRoster,
  getRosterList,
}
