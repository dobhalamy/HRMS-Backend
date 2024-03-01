const express = require('express')
const {
  masterGlobalType,
  addGlobalType,
  updateGlobalType,
  deleteGlobalType,
  getGlobalType,
  updateStatusGlobalType,
  nestedGlobalType,
} = require('../controllers/globalTypeController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

const router = express.Router()

router.get('/masterglobaltype/:category', isUserAuthenticated, masterGlobalType)
router.post('/', isUserAuthenticated, addGlobalType)
router.put('/:id', isUserAuthenticated, updateGlobalType)
router.delete('/:id', isUserAuthenticated, deleteGlobalType)
router.get('/', isUserAuthenticated, getGlobalType)
router.put('/status/:id', isUserAuthenticated, updateStatusGlobalType)
router.get('/nestedGlobaltype/:category/:parentId', isUserAuthenticated, nestedGlobalType)

module.exports = router
