const db = require('../models/index')
const { Op } = require('sequelize')
const { asyncMiddleware } = require('../middleware/async-middleware')
const { BadRequest, NotFound } = require('../../helper/apiErrors')
const { isEmpty } = require('lodash')
const MessageTag = require('../../enums/messageNums')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const ClientInformation = db.clientInformation
const { logger } = require('../../helper/logger')

// @desc  Fetch all allClients Info Using server side pagination
// @route GET /api/v1/clientInfo
// @access private

const getAllclientInfo = asyncMiddleware(async (req, res) => {
  const { skip = 0, limit = 0, searchedCustomer = null } = req.query
  let getClientList = []
  if (searchedCustomer) {
    getClientList = await ClientInformation.findAndCountAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      order: [['id', 'DESC']],
      where: {
        contactPersonName: {
          [Op.like]: `%${searchedCustomer}%`,
        },
      },
    })
  } else {
    getClientList = await ClientInformation.findAndCountAll({
      offset: parseInt(skip, 10),
      limit: parseInt(limit - skip, 10),
      order: [['id', 'DESC']],
    })
  }
  const totalClientCount = await ClientInformation.findAll({})
  if (getClientList) {
    if (limit == 0) {
      res.status(200).json({
        data: { clientInfo: totalClientCount, totalCount: totalClientCount?.length },
      })
    } else {
      res.status(200).json({
        data: { clientInfo: getClientList, totalCount: totalClientCount?.length },
      })
    }  
  
    logger.info(
      {
        controller: 'clientInfoController',
        method: 'getAllclientInfo',
      },
      {
        payload: getClientList,
        msg: 'client information is fetched',
      },
    )
  }
})

// @desc Add new Clients Info
// @route POST /api/v1/clientInfo
// @access private

const addClientInfo = asyncMiddleware(async (req, res) => {
  const clientInfoData = req.body
  const {
    businessName,
    businessPhoneNumber,
    businessEmail,
    businessAddress,
    contactPersonName,
    // contactPersonalName,
    contactPersonEmail,
    // clientMobileNumber
    // contantPersonDesignation,
  } = clientInfoData

  // BELOW FIELD SHOULD NOT BE NULL AS PER MODEL
  // WILL Apply validation later if all these fields needs to be unique
  if (
    !businessName ||
    !businessPhoneNumber ||
    !businessEmail ||
    !businessAddress ||
    !contactPersonName ||
    // !contactPersonalName ||
    !contactPersonEmail 
    // !clientMobileNumber 
    // !contantPersonDesignation
  ) {
    throw new BadRequest()
  }
  const clientInfo = await ClientInformation.create(clientInfoData)
  if (clientInfo) {
    logger.info(
      {
        controller: 'clientInfoController',
        method: 'addClientInfo',
      },
      {
        payload: clientInfo,
        msg: MessageTag.CLIENT_ADDED,
      },
    )
    res.status(HttpStatusCode.CREATED).json({
      status: true,
      message: MessageTag.CLIENT_ADDED,
      data: clientInfo,
      statusCode: HttpStatusCode.CREATED,
    })
  }
})

// @desc Update Clients Info
// @route PATCH /api/v1/clientInfo
// @access private

const updateClientInfo = asyncMiddleware(async (req, res) => {
  const clientInfoData = req.body
  const {
    id,
    businessName,
    businessPhoneNumber,
    businessEmail,
    businessAddress,
    contactPersonName,
    contactPersonEmail,
    // contactPersonalDesignation,
  } = clientInfoData

  if (
    !id ||
    !businessName ||
    !businessPhoneNumber ||
    !businessEmail ||
    !businessAddress ||
    !contactPersonName ||
    !contactPersonEmail 
    // !contactPersonalDesignation
  ) {
    throw new BadRequest()
  }
  const clientExist = await ClientInformation.findOne({ where: { id } })
  if (!isEmpty(clientExist)) {
    const updateValue = await ClientInformation.update(clientInfoData, { where: { id } })
    if (updateValue) {
      logger.info(
        {
          controller: 'clientInfoController',
          method: 'updateClientInfo',
        },
        {
          clientId: `Client ID: ${id}`,
          msg: MessageTag.CLIENT_UPDATED,
        },
      )
      res.status(200).json({
        status: true,
        message: MessageTag.CLIENT_UPDATED,
        statusCode: HttpStatusCode.OK,
      })
    }
  } else {
    logger.error(
      {
        controller: 'clientInfoController',
        method: 'updateClientInfo',
      },
      {
        clientId: `Client ID: ${id}`,
        msg: 'Not Found',
      },
    )
    throw new NotFound()
  }
})

// @desc Delete Client Info
// @route DELETE /api/v1/clientInfo/:id
// @access private

const deleteClientInfo = asyncMiddleware(async (req, res) => {
  const { id } = req.params
  const clientExist = await ClientInformation.findOne({ where: { id } })
  if (!isEmpty(clientExist)) {
    const client = await ClientInformation.update({ isDeleted: 1 }, { where: { id } })
    if (client) {
      logger.info(
        {
          controller: 'clientInfoController',
          method: 'deleteClientInfo',
        },
        {
          clientId: `Client ID: ${id}`,
          msg: 'Client Deleted Successfully',
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

module.exports = { addClientInfo, getAllclientInfo, updateClientInfo, deleteClientInfo }
