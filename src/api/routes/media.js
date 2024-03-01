const express = require('express')
const router = express.Router()
const {
  documentUpload,
  getDocument,
  documentDelete,
  getSalarySlip,
  updateDocument,
  profilePictureUpload,
  updateProfilePicture,
} = require('../controllers/mediaController')
const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.post('/', isUserAuthenticated, documentUpload)
router.post('/uploadProfileImage', isUserAuthenticated, profilePictureUpload)
router.patch('/updateProfileImage', isUserAuthenticated, updateProfilePicture)
router.patch('/updateMedia', isUserAuthenticated, updateDocument)
router.get('/', isUserAuthenticated, getDocument)
router.delete('/documentDelete', isUserAuthenticated, documentDelete)
router.get('/salarySlip', isUserAuthenticated, getSalarySlip)

module.exports = router
