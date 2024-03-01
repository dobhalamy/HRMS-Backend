const express = require('express')

const router = express.Router()
const {
  getAllHappyToHelp,
  getHappyToHelp,
  addHappyToHelp,
  deleteHappyToHelp,
  updateHappyToHelp,
} = require('../controllers/happyToHelpController')

router.get('/getAllHappyToHelp', getAllHappyToHelp)
router.get('/getHappyToHelp', getHappyToHelp)
router.post('/', addHappyToHelp)
router.put('/:id', deleteHappyToHelp)
router.patch('/updateHappyToHelp/:id', updateHappyToHelp)

module.exports = router
