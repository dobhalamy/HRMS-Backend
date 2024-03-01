const express = require('express')
const router = express.Router()
const {
  uploadApr,
  getMonthlyAttendance,
  markAttendance,
} = require('../controllers/attendanceRecordController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.post('/uploadApr', isUserAuthenticated, uploadApr)
router.get('/getAttendanceByMonth', isUserAuthenticated, getMonthlyAttendance)
router.post('/markAttendance', isUserAuthenticated, markAttendance)

module.exports = router
