const { isEmpty } = require('lodash')
const { BadRequest } = require('../../helper/apiErrors')
const HttpStatusCode = require('../../enums/httpErrorCodes')

const db = require('../models/index')
const { getRequestUserId } = require('../../helper')

const SaveFormData = db.saveFormData

const saveFormData = async (req, res) => {
  const { empId, formType, formData } = req.body
  try {
    if (!empId || !formType || !formData) {
      throw new BadRequest()
    }
    const isCreated = await SaveFormData.create({
      submittedBy: empId,
      formType,
      formData,
      createdBy: getRequestUserId(req),
      createdAt: new Date(),
    })
    if (!isEmpty(isCreated)) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: isCreated,
        statusCode: HttpStatusCode.OK,
      })
      logger.info({
        controller: 'saveFormDataController',
        method: 'savedFormData',
        payload: `form data is saved for ${empId}`,
        msg: 'Form data saved successfully.',
      })
    }
  } catch (error) {
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
      logger.error({
        controller: 'saveFormDataController',
        method: 'savedFormData',
        msg: `Error: ${error.message}`,
      })
    }
  }
}
const getSavedFormData = async (req, res) => {
  try {
    const savedFormData = await SaveFormData.findAll({})
    if (savedFormData) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        data: savedFormData,
        message: 'success',
      })
      logger.info({
        controller: 'saveFormDataController',
        method: 'getSavedFormData',
        payload: `form data is saved for ${empId}`,
        msg: 'Retrieved saved form data successfully.',
      })
    }
  } catch (error) {
    if (error?.httpCode) {
      res.status(error?.httpCode || HttpStatusCode.INTERNAL_SERVER).json({
        status: error?.isOperational || false,
        message: error?.message,
        statusCode: error?.httpCode || HttpStatusCode.INTERNAL_SERVER,
      })
      logger.error({
        controller: 'saveFormDataController',
        method: 'getSavedFormData',
        msg: `Error: ${error.message}`,
      })
    }
  }
}

module.exports = {
  saveFormData,
  getSavedFormData,
}
