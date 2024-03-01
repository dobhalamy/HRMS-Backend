const express = require('express')

const router= express.Router()
const { checkMailId, 
        compareToken, 
        updatePassword,  
        setExpirationLink } = require('../controllers/resetPasswordController')

router.post('/',checkMailId)
router.get('/compareToken/:token', compareToken)
router.post('/updatePassword',updatePassword)
router.get('/setExpiredLink/:token',setExpirationLink )  

module.exports = router