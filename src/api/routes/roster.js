const express = require('express')

const router = express.Router()
const { uploadRoster, getRosterList } = require('../controllers/rosterController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.post('/', isUserAuthenticated, uploadRoster)
router.get('/', isUserAuthenticated, getRosterList)

module.exports = router
