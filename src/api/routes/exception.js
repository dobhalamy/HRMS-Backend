const express = require('express')

const router = express.Router()
const {
  getAllException,
  getExceptionSingleEmp,
  deleteException,
  addException,
  updateException,
} = require('../controllers/exceptionController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.post('/', isUserAuthenticated, addException)
router.delete('/:id', isUserAuthenticated, deleteException)
router.patch('/updateException/', isUserAuthenticated, updateException)
router.get('/getAllException', isUserAuthenticated, getAllException)
router.get('/getSingleEmpException', isUserAuthenticated, getExceptionSingleEmp)

module.exports = router
