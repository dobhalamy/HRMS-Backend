const express = require('express')

const router = express.Router()
const {
  createFormBuilder,
  updateFormBuilder,
  getFormBuilderData,
} = require('../controllers/formBuilderController')

router.get('/', getFormBuilderData)
router.post('/', createFormBuilder)
router.patch('/', updateFormBuilder)

module.exports = router
