const express = require('express')

const router = express.Router()
const {
  addRoleAndPermissions,
  getPermissionsByRoleId,
} = require('../controllers/rolePermissionController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.use(isUserAuthenticated)

router.post('/', addRoleAndPermissions)
router.get('/', getPermissionsByRoleId)

module.exports = router
