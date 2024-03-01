const { isEmpty } = require('lodash')
const db = require('../models/index')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { BadRequest } = require('../../helper/apiErrors')
const { getRequestUserId } = require('../../helper')
const { logger } = require('../../helper/logger')

const FormBuilder = db.formBuilder
const getFormBuilderData = async (req, res) => {
  const { skip = 0, limit = 10, formType = null, isActive = null } = req.query
  const userId = req?.headers?.userid
  let formBuilderData = []
  let formBuilderDataTotalCount = []
  try {
    if (!userId) {
      throw new BadRequest()
    }
    if (!formType && !isActive) {
      formBuilderData = await FormBuilder.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
      })
      formBuilderDataTotalCount = await FormBuilder.findAll({})
    } else if (formType && isActive) {
      formBuilderData = await FormBuilder.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          formType,
          isActive,
        },
      })
      formBuilderDataTotalCount = await FormBuilder.findAll({
        where: {
          formType,
          isActive,
        },
      })
    } else if (isActive) {
      formBuilderData = await FormBuilder.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          isActive,
        },
      })
      formBuilderDataTotalCount = await FormBuilder.findAll({
        where: {
          isActive,
        },
      })
    } else if (formType) {
      formBuilderData = await FormBuilder.findAll({
        offset: parseInt(skip, 10),
        limit: parseInt(limit - skip, 10),
        where: {
          formType,
        },
      })
      formBuilderDataTotalCount = await FormBuilder.findAll({
        where: {
          formType,
        },
      })
    }

    if (isEmpty(formBuilderData)) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'success',
        data: { formBuilderData: [], totalCount: 0 },
      })
    }
    if (formBuilderData) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        data: { formBuilderData: formBuilderData, totalCount: formBuilderDataTotalCount?.length },
        message: 'success',
      })
      logger.info(
        {
          controller: 'formBuilderController',
          method: 'getFormBuilderData',
        },
        {
          msg: 'formBuilder data ',
        },
      )
    }
  } catch (error) {
    logger.error(
      {
        controller: 'formBuilderController',
        method: 'getFormBuilderData',
      },
      {
        msg: `Catch error: ${error?.msg}`,
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

const createFormBuilder = async (req, res) => {
  const { formType, questionName, answerType, mcqOptions, selectionType } = req.body
  const userId = req?.headers?.userid

  try {
    if (!formType || !questionName || !answerType || !userId) {
      throw new BadRequest()
    }

    const isCreated = await FormBuilder.create({
      formType,
      questionName,
      answerType,
      mcqOptions,
      selectionType,
      isActive: false,
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
      logger.info(
        {
          controller: 'formBuilderController',
          method: 'formBuilder',
        },
        {
          payload: isCreated,
          msg: 'form added',
        },
      )
    }
  } catch (error) {
    logger.error(
      {
        controller: 'formBuilderController',
        method: 'formBuilder',
      },
      {
        empId: `userId${userId}`,
        msg: `Catch error: ${error?.msg}`,
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
const updateFormBuilder = async (req, res) => {
  const updateMultipleData = req.body
  const userId = req?.headers?.userid

  try {
    if (!userId) {
      throw new BadRequest()
    }
    let formExists
    for (let i = 0; i < updateMultipleData.length; i += 1) {
      const singleUpdateForm = updateMultipleData[i]
      formExists = await FormBuilder.findAll({
        where: {
          id: singleUpdateForm?.id,
        },
      })
    }
    if (isEmpty(formExists)) {
      logger.error(
        {
          controller: 'formbuilderController',
          method: 'updateFormBuilder',
        },
        {
          payload: `User id :${userId}`,
          msg: 'Form not found',
        },
      )
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'Form not found',
        statusCode: HttpStatusCode.NOT_FOUND,
      })
    }
    let updatedQuestions
    for (let i = 0; i < updateMultipleData.length; i += 1) {
      const currentUpdateQuestion = updateMultipleData[i]
      updatedQuestions = await FormBuilder.update(
        {
          formType: currentUpdateQuestion?.formType,
          questionName: currentUpdateQuestion?.questionName,
          answerType: currentUpdateQuestion?.answerType,
          mcqOptions: currentUpdateQuestion?.mcqOptions,
          selectionType: currentUpdateQuestion?.selectionType,
          isActive: currentUpdateQuestion?.isActive,
          updatedBy: getRequestUserId(req),
          updatedAt: new Date(),
        },
        {
          where: {
            id: currentUpdateQuestion?.id,
          },
        },
      )
    }
    let updatedForm
    for (let i = 0; i < updateMultipleData.length; i += 1) {
      const singleUpdateForm = updateMultipleData[i]
      updatedForm = await FormBuilder.findOne({
        where: {
          id: singleUpdateForm?.id,
        },
      })
    }
    if (!isEmpty(updatedQuestions)) {
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: 'Success',
        data: updatedForm,
      })
    }
  } catch (error) {
    logger.info(
      {
        controller: 'formbuilderController',
        method: 'updateFormBuilder',
      },
      {
        payload: `User id :${userId}`,
        msg: `error: ${error}`,
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

module.exports = {
  createFormBuilder,
  updateFormBuilder,
  getFormBuilderData,
}
