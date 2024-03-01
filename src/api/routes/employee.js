const express = require('express')

const router = express.Router()

const {
  getListOfEmployees,
  updateEmployeeData,
  addNewEmployee,
  deleteEmployee,
  getNewEmpId,
  filterEmployee,
} = require('../controllers/employeeController')
const {
  employeeDsr,
  getEmployeeDsr,
  getAllEmployeeDsr,
  getSingleEmployeeDsr,
  updateEmployeeDsr,
  getEmployeeDsrAccDate,
  addQuery,
} = require('../controllers/employeeDsrController')
const {
  getAttendanceRecord,
  allEmployeeAttendance,
} = require('../controllers/attendanceRecordController')
const {
  markLeave,
  updateLeave,
  getEmployeeLeave,
  getLeaveRequest,
  updateLeaveStatus,
  deleteLeaveRequest,
  getAllLeaveForLeaveType,
  getTeamPendingLeaveCount,
  getLeaveRequestCount,
  getLeaveRecord,
} = require('../controllers/leaveController')

const { isUserAuthenticated } = require('../middleware/auth-middleware')
const {
  saveDownTimeTicket,
  getDownTimeList,
  updateDownTimeStatus,
  deleteDownTimeRequest,
} = require('../controllers/downTimeController')
const { getListOfRYGEmployees, updateRYGstatus } = require('../controllers/rygStatusController')
const {
  getListOfTrainees,
  assignTrainer,
  updateTraineeData,
  updateTraineeStatus,
  getTraineeCertificationHistory,
  updateTrainerDetails,
} = require('../controllers/traineeController')
const { getProjectList } = require('../controllers/projectList')

const { getEmployeePo, getTeamUnderSelectedPo } = require('../controllers/projectInfoController')

/* ------employee list route-----------*/
// Changes start from here

/* 
 1. E CAN USE SOME CHANGES HERE, LIKE IF WE HAVE isUserAuthenticated FOR ALL ROUTES, WE SIMPLYE USE BELOW
  STATEMENT AND REMOVE isUserAuthenticated FROM OTHER ROUTES
 2. IF WE HAVE SAME ROUING PATH THEN WE CAN GROUP THEM TOGETHER
*/
router.use(isUserAuthenticated)
router.route('/').get(getListOfEmployees).post(addNewEmployee).patch(updateEmployeeData)
router.get('/filterEmployee', filterEmployee)

// Changes end here
router.delete('/:userId/:empId', deleteEmployee)
router.get('/getNewEmpId', getNewEmpId)

/* ------employDsr route-----------*/
router.post('/employeeDsr', employeeDsr)
router.get('/get-EmployeeDsr-acc-date', getEmployeeDsrAccDate)
router.get('/get-EmployeeDsr', getEmployeeDsr)
router.get('/getAllEmployeeDsr', getAllEmployeeDsr)
router.get('/getSingle-EmployeeDsr', getSingleEmployeeDsr)
router.patch('/update-EmployeeDsr', updateEmployeeDsr)
/* ------employDsr query route-----------*/
router.post('/add-dsrquery', addQuery)

/* ----------------projectListForDsr----------------*/
router.get('/projectList', getProjectList)

/* ----------------attendanceRecord----------------*/

router.get('/attendance-record', getAttendanceRecord)
router.get('/allAttendance-record', allEmployeeAttendance)

/* ----------------downTimeRecord----------------*/
router.post('/markDownTime', saveDownTimeTicket)
router.get('/downTimeList', getDownTimeList)
router.patch('/updateDownTimeStatus/:id', updateDownTimeStatus)
router.put('/deleteDownTime/:id', deleteDownTimeRequest)

router.get('/getRYGEmployee', getListOfRYGEmployees)
router.post('/updateRYGEmployee', updateRYGstatus)

/** *****************Employee Leave******************* */
router.post('/markLeave', markLeave)
router.put('/updateLeave/:id', updateLeave)

router.get('/allEmployee-leave', getEmployeeLeave)
// router.get('/allEmployeeDay-leave', getEmployeeDayLeave)
router.get('/leaveRequest', getLeaveRequest)
router.get('/getAllLeaveForLeaveType/:userId/:leaveType', getAllLeaveForLeaveType)
router.patch('/updateLeaveStatus/:id', updateLeaveStatus)
// router.put('/deleteLeaveRequest/:id', deleteLeaveRequest)
router.patch('/deleteLeaveRequest/:id', deleteLeaveRequest)
router.get('/teamPendingLeaveRequest/:userId', getTeamPendingLeaveCount)
/** *****************Employee Pos******************* */
router.get('/getEmployeePo/:userId', getEmployeePo)
router.get('/getTeamUnderSelectedPo/:userId', getTeamUnderSelectedPo)
router.get('/leaveTypeLeaveCount/:userId', getLeaveRequestCount)
router.get('/leaveRecord', getLeaveRecord)

/***************Trainee Route */
router.get('/allTrainees', getListOfTrainees)
router.put('/assignTrainer/:id/:userId', assignTrainer)
router.patch('/updateTrainee', updateTraineeData)
router.patch('/updateTraineeStatus', updateTraineeStatus)
router.get('/traineeHistory', getTraineeCertificationHistory)
router.patch('/updateTrainerDetails/:userId/:trainerId', updateTrainerDetails)

module.exports = router
