const express = require('express')

const router = express.Router()
const { sendMail } = require('../controllers/mailController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.get('/sendMail', isUserAuthenticated, sendMail)

module.exports = router
