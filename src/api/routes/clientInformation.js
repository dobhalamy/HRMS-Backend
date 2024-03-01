const express = require('express')
const router = express.Router()
const {
  addClientInfo,
  getAllclientInfo,
  updateClientInfo,
  deleteClientInfo,
} = require('../controllers/clientInfoController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.use(isUserAuthenticated)
router.route('/').post(addClientInfo).get(getAllclientInfo).patch(updateClientInfo)
router.route('/:id').delete(deleteClientInfo)

module.exports = router
