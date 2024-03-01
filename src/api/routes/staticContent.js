const express = require('express')

const router = express.Router()
const { updateStaticContent, getStaticContent } = require('../controllers/staticContentController')

router.post('/', updateStaticContent)
router.get('/getStaticContent', getStaticContent)
module.exports = router
