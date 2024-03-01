const express = require('express')

const router = express.Router()
const { saveFormData, getSavedFormData } = require('../controllers/saveFormDataController')

router.post('/', saveFormData)
router.get('/', getSavedFormData)

module.exports = router
