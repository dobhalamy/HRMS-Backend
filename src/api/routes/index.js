const roleRoute = require('./rolePermissions')
const authRoute = require('./auth')
const globalTypeCategory = require('./globalTypeCategory')
const globalType = require('./globalType')
const employeeRoute = require('./employee')
const staticContent = require('./staticContent')
const eventRoute = require('./events')
const media = require('./media')
const formBuilderRoute = require('./formBuilder')
const saveFormDataRoute = require('./saveFormData')
const genericRoute = require('./generic')
const clientInfoRoute = require('./clientInformation')
const projectInfoRoute = require('./projectInfo')
const attendanceRoute = require('./attendance')
const happyToHelpRoute = require('./happToHelp')
const rosterUpload = require('./roster')
const exceptionRoute = require('./exception')
const moduleRoute = require('./modulePermissions')
const userRoute = require('./userInfo')
const resetPasswordRoute = require('./resetPassword')
const notificationRoute = require('./notification')
const logsRoute = require('./logs')
const holidayRoute = require('./holidays')

module.exports = {
  roleRoute,
  authRoute,
  globalTypeCategory,
  globalType,
  employeeRoute,
  staticContent,
  eventRoute,
  media,
  formBuilderRoute,
  saveFormDataRoute,
  genericRoute,
  clientInfoRoute,
  projectInfoRoute,
  attendanceRoute,
  happyToHelpRoute,
  rosterUpload,
  exceptionRoute,
  moduleRoute,
  userRoute,
  resetPasswordRoute,
  notificationRoute,
  logsRoute,
  holidayRoute,
}
