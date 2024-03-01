const express = require('express')
const router = express.Router()
const {
  addProjectInfo,
  getProjectInfo,
  updateProjectInfo,
  deleteProject,
  assignToEmployee,
  getNewProjectId,
  removeAssignDeveloper,
  getSingleProjectInfo,
  updateDeveloper,
  uploadProjectDocument,
  getProjectDocument,
  getUploadedDocumentUrl,
  updateProjectDocument,
} = require('../controllers/projectInfoController')

const { isUserAuthenticated } = require('../middleware/auth-middleware')

router.use(isUserAuthenticated)
router.route('/').post(addProjectInfo).get(getProjectInfo).patch(updateProjectInfo)
router.route('/:id').delete(deleteProject)
router.route('/assign').post(assignToEmployee)
router.route('/getNewProjectId').get(getNewProjectId)
router.route('/removeDeveloper/:id').patch(removeAssignDeveloper)
router.route('/:id').get(getSingleProjectInfo)
router.route('/updateDeveloper/:id').patch(updateDeveloper)
router.route('/uploadProjectDocument').post(uploadProjectDocument)
router.route('/getProjectDoc/:id').get(getProjectDocument)
router.route('/getUploadDocumentUrl/:id').get(getUploadedDocumentUrl)
router.route('/updateProjectDocument').patch(updateProjectDocument)

module.exports = router
