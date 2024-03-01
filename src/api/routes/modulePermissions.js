const express = require('express')

const router = express.Router()

const { isUserAuthenticated } = require('../middleware/auth-middleware')
const {
  getModulePermissions,
  updateModulePermissions,
  addModulePermissions,
  getSingleModulePermission,
} = require('../controllers/modulePermissionController')

router.use(isUserAuthenticated)
router.get('/modulePermissions', getModulePermissions)
router.get('/singleModulePermission', getSingleModulePermission)
router.put('/updateModulePermissions', updateModulePermissions)
router.post('/addModluePermissions', addModulePermissions)

module.exports = router
