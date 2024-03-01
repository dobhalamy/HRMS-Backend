const express = require('express')

const router = express.Router()

const { getUserInfo } = require('../controllers/userController')

router.get('/:userId', getUserInfo)
module.exports = router