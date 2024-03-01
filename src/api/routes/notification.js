const express = require('express')

const router = express.Router()

const { saveNotification, getNotification, readNotification } = require('../controllers/notificationController')

router.post('/', saveNotification)
router.get('/', getNotification)
router.patch('/:userId', readNotification) 
module.exports = router
